import jwt from "jsonwebtoken";

const DEFAULT_TOTAL_BUDGET_MS = 1200;

// --- Circuit breaker + dedup state ---
type BreakerState = {
  state: "closed" | "open" | "half-open";
  lastOpenedAt: number | null;
  consecutiveFailures: number;
  window: Array<{ t: number; ok: boolean }>;
  lastProbeAt: number | null;
};

const breakers = new Map<string, BreakerState>();
const inflight = new Map<string, Promise<Response>>();
const resultCache = new Map<
  string,
  {
    body: string;
    status: number;
    headers: [string, string][];
    expiresAt: number;
  }
>();

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function withTimeout(
  resource: RequestInfo | URL,
  ms: number,
  init?: RequestInit
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  const merged: RequestInit = { ...(init || {}), signal: controller.signal };
  return {
    promise: fetch(resource, merged).finally(() => clearTimeout(id)),
    controller,
  };
}

function createServiceJwt() {
  const secret = process.env.AI_SERVICE_JWT_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error("AI_SERVICE_JWT_SECRET or JWT_SECRET is not configured");
  const nowSec = Math.floor(Date.now() / 1000);
  const jti = Math.random().toString(36).slice(2) + Date.now().toString(36);
  return jwt.sign(
    {
      iss: "paguyuban-next",
      aud: "paguyuban-ai",
      iat: nowSec,
      exp: nowSec + 30,
      jti,
    },
    secret,
    { algorithm: "HS256" }
  );
}

function getBreaker(key: string): BreakerState {
  const b = breakers.get(key);
  if (b) return b;
  const st: BreakerState = {
    state: "closed",
    lastOpenedAt: null,
    consecutiveFailures: 0,
    window: [],
    lastProbeAt: null,
  };
  breakers.set(key, st);
  return st;
}

function recordResult(b: BreakerState, ok: boolean) {
  const now = Date.now();
  b.window.push({ t: now, ok });
  while (b.window.length && now - b.window[0]!.t > 60_000) b.window.shift();
  if (ok) b.consecutiveFailures = 0;
  else b.consecutiveFailures += 1;
}

function failureRate(b: BreakerState) {
  if (!b.window.length) return 0;
  const fails = b.window.filter((e) => !e.ok).length;
  return fails / b.window.length;
}

export async function secureFetch(
  url: string,
  options: RequestInit & {
    timeoutMs?: number;
    totalBudgetMs?: number;
    breakerKey?: string;
    dedupWindowMs?: number;
  } = {}
) {
  const {
    timeoutMs = 800,
    totalBudgetMs = DEFAULT_TOTAL_BUDGET_MS,
    headers,
    breakerKey = "ai",
    dedupWindowMs = 10_000,
    ...rest
  } = options;

  const token = createServiceJwt();
  const h = new Headers(headers || {});
  if (!h.has("Authorization")) h.set("Authorization", `Bearer ${token}`);
  if (!h.has("Content-Type")) h.set("Content-Type", "application/json");

  // Circuit breaker gate
  const b = getBreaker(breakerKey);
  const now = Date.now();
  if (b.state === "open") {
    if (b.lastOpenedAt && now - b.lastOpenedAt >= 30_000) {
      b.state = "half-open";
      b.lastProbeAt = null;
    } else {
      throw new Error("breaker_open");
    }
  }
  if (b.state === "half-open") {
    if (b.lastProbeAt && now - b.lastProbeAt < 5_000) {
      throw new Error("breaker_half_open_wait");
    }
    b.lastProbeAt = now;
  }

  // Dedup + short result cache
  const bodyStr =
    typeof (rest as any).body === "string"
      ? (rest as any).body
      : JSON.stringify((rest as any).body || {});
  const key = `${rest.method || "GET"}:${url}:${bodyStr}`;
  const cached = resultCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return new Response(cached.body, {
      status: cached.status,
      headers: cached.headers,
    });
  }
  const existing = inflight.get(key);
  if (existing) return existing;

  const start = Date.now();
  const attempts = [0, 200, 800];
  let lastError: unknown;

  const run = async () => {
    for (let i = 0; i < attempts.length; i++) {
      const waited = attempts[i];
      const elapsed = Date.now() - start;
      if (elapsed + waited > totalBudgetMs) break;
      if (waited > 0) await sleep(waited);
      try {
        const { promise } = withTimeout(url, timeoutMs, {
          ...rest,
          headers: h,
        });
        const res = await promise;
        if (res.status >= 500) {
          lastError = new Error(`status_${res.status}`);
        } else {
          recordResult(b, true);
          if (b.state === "half-open") {
            b.state = "closed";
            b.consecutiveFailures = 0;
          }
          const clone = res.clone();
          const body = await clone.text();
          const headersArr: [string, string][] = [];
          res.headers.forEach((v, k) => headersArr.push([k, v]));
          resultCache.set(key, {
            body,
            status: res.status,
            headers: headersArr,
            expiresAt: Date.now() + dedupWindowMs,
          });
          setTimeout(() => resultCache.delete(key), dedupWindowMs + 1000);
          return res;
        }
      } catch (e) {
        lastError = e;
      }
    }
    // failure path
    recordResult(b, false);
    if (b.consecutiveFailures >= 5 || failureRate(b) > 0.2) {
      b.state = "open";
      b.lastOpenedAt = Date.now();
    }
    throw lastError instanceof Error
      ? lastError
      : new Error("secure_fetch_failed");
  };

  const p = run().finally(() => inflight.delete(key));
  inflight.set(key, p);
  try {
    const res = await p;
    return res;
  } catch (e) {
    if (b.state === "half-open") {
      b.state = "open";
      b.lastOpenedAt = Date.now();
    }
    throw e;
  }
}

// Expose for tests
export const __private__ = { getBreaker, breakers, inflight, resultCache };
