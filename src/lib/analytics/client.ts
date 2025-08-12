"use client";

type SessionStartPayload = {
  type: "session_start";
  session: {
    routeFirst?: string | null;
    referrer?: string | null;
    utm?: Record<string, unknown> | null;
    device?: string | null;
    country?: string | null;
  };
};

type EventsPayload = {
  type: "events";
  sessionId: string;
  events: Array<{
    type: string;
    route?: string | null;
    section?: string | null;
    element?: string | null;
    metadata?: Record<string, unknown> | null;
    createdAt?: Date | null;
  }>;
};

async function postJson(url: string, body: unknown): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
    cache: "no-store",
    credentials: "include",
  });
}

export class AnalyticsClient {
  private sessionId: string | null = null;
  private readonly endpoint = "/api/analytics/track";
  // Event batching
  private pendingEvents: EventsPayload["events"] = [];
  private flushTimerId: number | null = null;
  private isFlushing = false;
  private readonly flushIntervalMs = 5000; // flush every 5s
  private readonly maxBatchSize = 20; // flush sooner when reaching this size
  // Cross-tab coordination
  private channel: BroadcastChannel | null = null;
  private clientId: string;
  private isLeader = false;
  private static readonly LEADER_KEY = "analytics_leader_id";
  // Heartbeat
  private heartbeatTimerId: number | null = null;
  private followerMonitorTimerId: number | null = null;
  private lastHeartbeatTs = Date.now();
  private readonly heartbeatIntervalMs = 10000; // leader emits every 10s
  private readonly heartbeatTimeoutMs = 30000; // followers consider leader dead after 30s

  constructor() {
    this.clientId = this.generateClientId();
    if (typeof window !== "undefined") {
      this.initCrossTab();
    }
  }

  async startSession(
    init?: Partial<SessionStartPayload["session"]>
  ): Promise<string | null> {
    try {
      // Followers do not start sessions; ask leader for session id
      if (typeof window !== "undefined" && !this.isLeader) {
        this.requestSessionIdFromLeader();
        return this.sessionId;
      }
      const payload: SessionStartPayload = {
        type: "session_start",
        session: {
          routeFirst:
            typeof window !== "undefined" ? window.location.pathname : null,
          referrer:
            typeof document !== "undefined" ? document.referrer || null : null,
          utm: this.parseUtmParams(),
          device: this.detectDevice(),
          country: undefined,
          ...init,
        },
      };
      const res = await postJson(this.endpoint, payload);
      if (!res.ok) return null;
      const json = (await res.json()) as { sessionId?: string };
      this.sessionId = json.sessionId ?? null;
      try {
        if (this.sessionId && typeof window !== "undefined") {
          window.localStorage.setItem("analytics_session_id", this.sessionId);
          // Schedule periodic flushes once we have a session
          this.scheduleFlush();
          // Ensure we flush on pagehide to avoid losing events
          this.installLifecycleFlushHandlers();
          // Broadcast session to other tabs
          this.postToChannel({ type: "session", sessionId: this.sessionId });
        }
      } catch {}
      return this.sessionId;
    } catch {
      return null;
    }
  }

  async track(
    type: string,
    data?: Omit<EventsPayload["events"][number], "type">
  ): Promise<void> {
    // Queue event and schedule a flush
    const event: EventsPayload["events"][number] = {
      type,
      route:
        typeof window !== "undefined" ? window.location.pathname : undefined,
      ...data,
    };
    if (this.isLeader) {
      this.pendingEvents.push(event);
      // Flush quickly if we reached batch size
      if (this.pendingEvents.length >= this.maxBatchSize) {
        void this.flush();
      } else {
        this.scheduleFlush();
      }
    } else {
      // Delegate to leader via BroadcastChannel
      this.postToChannel({ type: "events", events: [event] });
      // Also request session id if we don't have one yet
      if (!this.sessionId) this.requestSessionIdFromLeader();
    }
  }

  /** Schedule periodic flush if not already scheduled */
  private scheduleFlush(): void {
    if (typeof window === "undefined") return;
    if (this.flushTimerId != null) return;
    this.flushTimerId = window.setInterval(() => {
      void this.flush();
    }, this.flushIntervalMs);
  }

  /** Force flush pending events now */
  async flush(useBeacon: boolean = false): Promise<void> {
    if (!this.isLeader) return; // Only leader communicates with server
    if (this.isFlushing) return;
    if (!this.sessionId) {
      // No session yet; drop or keep? We'll keep a small buffer and try again later
      return;
    }
    if (this.pendingEvents.length === 0) return;
    this.isFlushing = true;
    try {
      // Drain a copy to avoid races
      const events = this.pendingEvents.splice(0, this.pendingEvents.length);
      const payload: EventsPayload = {
        type: "events",
        sessionId: this.sessionId,
        events,
      };
      if (
        useBeacon &&
        typeof navigator !== "undefined" &&
        "sendBeacon" in navigator
      ) {
        try {
          const body = new Blob([JSON.stringify(payload)], {
            type: "application/json",
          });
          navigator.sendBeacon(this.endpoint, body);
        } catch {
          // Fallback to fetch if beacon fails
          await postJson(this.endpoint, payload);
        }
      } else {
        await postJson(this.endpoint, payload);
      }
    } catch {
      // On failure, we won't requeue to avoid infinite growth; next events will retry
    } finally {
      this.isFlushing = false;
    }
  }

  /** Install lifecycle handlers to flush on tab hide/unload */
  private installLifecycleFlushHandlers(): void {
    if (typeof window === "undefined") return;
    const onPageHide = () => {
      // Use sendBeacon for reliability when page is closing
      void this.flush(true);
    };
    const onVisibilityChange = () => {
      if (document.hidden) {
        void this.flush(true);
      }
    };
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibilityChange);
  }

  // ----- Cross-tab helpers -----
  private initCrossTab(): void {
    // Setup BroadcastChannel
    try {
      this.channel = new BroadcastChannel("analytics");
      this.channel.onmessage = (ev: MessageEvent) => {
        const msg = ev.data as
          | { type: "events"; events: EventsPayload["events"] }
          | { type: "session"; sessionId: string }
          | { type: "request_session" }
          | { type: "heartbeat"; ts: number };
        if (!msg) return;
        if (msg.type === "events") {
          // Leader collects events from followers
          if (this.isLeader) {
            this.pendingEvents.push(...msg.events);
          }
          return;
        }
        if (msg.type === "session") {
          // Followers adopt session id
          this.sessionId = msg.sessionId;
          try {
            window.localStorage.setItem("analytics_session_id", this.sessionId);
          } catch {}
          return;
        }
        if (msg.type === "request_session") {
          if (this.isLeader && this.sessionId) {
            this.postToChannel({ type: "session", sessionId: this.sessionId });
          }
          return;
        }
        if (msg.type === "heartbeat") {
          this.lastHeartbeatTs = Math.max(this.lastHeartbeatTs, msg.ts);
          return;
        }
      };
    } catch {
      this.channel = null;
    }

    // Leader election via localStorage lock (best-effort)
    const currentLeader = window.localStorage.getItem(
      AnalyticsClient.LEADER_KEY
    );
    if (!currentLeader) {
      // Try to claim leadership
      try {
        window.localStorage.setItem(AnalyticsClient.LEADER_KEY, this.clientId);
        this.isLeader = true;
        this.startLeaderHeartbeat();
      } catch {
        this.isLeader = false;
      }
    } else {
      this.isLeader = currentLeader === this.clientId;
      if (this.isLeader) this.startLeaderHeartbeat();
    }

    // React to leader changes
    window.addEventListener("storage", (e: StorageEvent) => {
      if (e.key !== AnalyticsClient.LEADER_KEY) return;
      this.isLeader = e.newValue === this.clientId;
      // If becoming leader and no session yet, start one soon
      if (this.isLeader && !this.sessionId) {
        void this.startSession();
      }
      // Start/stop heartbeat accordingly
      if (this.isLeader) this.startLeaderHeartbeat();
      else this.stopLeaderHeartbeat();
    });

    // On tab close, if leader, release lock so another tab can take over
    const release = () => {
      try {
        const leader = window.localStorage.getItem(AnalyticsClient.LEADER_KEY);
        if (leader === this.clientId) {
          window.localStorage.removeItem(AnalyticsClient.LEADER_KEY);
        }
      } catch {}
    };
    window.addEventListener("pagehide", release);
    window.addEventListener("beforeunload", release);

    // Followers immediately request session id
    if (!this.isLeader) this.requestSessionIdFromLeader();

    // Followers monitor heartbeat to failover if leader dies silently
    this.startFollowerMonitor();
  }

  private postToChannel(message: unknown): void {
    try {
      this.channel?.postMessage(message);
    } catch {}
  }

  private requestSessionIdFromLeader(): void {
    this.postToChannel({ type: "request_session" });
  }

  private startLeaderHeartbeat(): void {
    if (typeof window === "undefined") return;
    if (this.heartbeatTimerId != null) return;
    // Emit first beat immediately
    this.postToChannel({ type: "heartbeat", ts: Date.now() });
    this.heartbeatTimerId = window.setInterval(() => {
      this.postToChannel({ type: "heartbeat", ts: Date.now() });
    }, this.heartbeatIntervalMs);
  }

  private stopLeaderHeartbeat(): void {
    if (this.heartbeatTimerId != null) {
      try {
        window.clearInterval(this.heartbeatTimerId);
      } catch {}
      this.heartbeatTimerId = null;
    }
  }

  private startFollowerMonitor(): void {
    if (typeof window === "undefined") return;
    if (this.followerMonitorTimerId != null) return;
    this.followerMonitorTimerId = window.setInterval(() => {
      if (this.isLeader) return;
      const now = Date.now();
      if (now - this.lastHeartbeatTs > this.heartbeatTimeoutMs) {
        // Attempt to take leadership
        try {
          window.localStorage.setItem(
            AnalyticsClient.LEADER_KEY,
            this.clientId
          );
          const newLeader = window.localStorage.getItem(
            AnalyticsClient.LEADER_KEY
          );
          if (newLeader === this.clientId) {
            this.isLeader = true;
            this.startLeaderHeartbeat();
            if (!this.sessionId) void this.startSession();
          }
        } catch {
          // ignore
        }
      }
    }, Math.min(this.heartbeatIntervalMs, 5000));
  }

  private generateClientId(): string {
    try {
      // Prefer crypto UUID if available
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g: any = globalThis as any;
      if (g?.crypto?.randomUUID) return g.crypto.randomUUID();
    } catch {}
    return `c_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  private parseUtmParams(): Record<string, unknown> | null {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const keys = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
    ];
    const obj: Record<string, string> = {};
    let has = false;
    for (const k of keys) {
      const v = params.get(k);
      if (v) {
        obj[k] = v;
        has = true;
      }
    }
    return has ? obj : null;
  }

  private detectDevice(): string | null {
    if (typeof navigator === "undefined") return null;
    const ua = navigator.userAgent || "";
    if (/Mobi|Android/i.test(ua)) return "mobile";
    if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return "tablet";
    return "desktop";
  }
}

export function maybeCreateAnalytics(): AnalyticsClient | null {
  if (process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== "1") return null;
  return new AnalyticsClient();
}

export function getCurrentAnalyticsSessionId(): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("analytics_session_id");
  } catch {
    return null;
  }
}
