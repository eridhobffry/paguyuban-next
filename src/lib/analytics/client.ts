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

  async startSession(
    init?: Partial<SessionStartPayload["session"]>
  ): Promise<string | null> {
    try {
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
      return this.sessionId;
    } catch {
      return null;
    }
  }

  async track(
    type: string,
    data?: Omit<EventsPayload["events"][number], "type">
  ): Promise<void> {
    if (!this.sessionId) return;
    try {
      const payload: EventsPayload = {
        type: "events",
        sessionId: this.sessionId,
        events: [
          {
            type,
            route:
              typeof window !== "undefined"
                ? window.location.pathname
                : undefined,
            ...data,
          },
        ],
      };
      await postJson(this.endpoint, payload);
    } catch {
      // ignore
    }
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
