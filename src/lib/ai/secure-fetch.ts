import jwt from "jsonwebtoken";

const DEFAULT_TOTAL_BUDGET_MS = 1200;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function withTimeout(resource: RequestInfo | URL, ms: number, init?: RequestInit) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  const merged: RequestInit = { ...(init || {}), signal: controller.signal };
  return { promise: fetch(resource, merged).finally(() => clearTimeout(id)), controller };
}

function createServiceJwt() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
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

export async function secureFetch(
  url: string,
  options: RequestInit & { timeoutMs?: number; totalBudgetMs?: number } = {}
) {
  const { timeoutMs = 800, totalBudgetMs = DEFAULT_TOTAL_BUDGET_MS, headers, ...rest } = options;
  const token = createServiceJwt();
  const h = new Headers(headers || {});
  if (!h.has("Authorization")) h.set("Authorization", `Bearer ${token}`);
  if (!h.has("Content-Type")) h.set("Content-Type", "application/json");

  const start = Date.now();
  const attempts = [0, 200, 800]; // initial + two retries
  let lastError: unknown;
  for (let i = 0; i < attempts.length; i++) {
    const waited = attempts[i];
    const elapsed = Date.now() - start;
    if (elapsed + waited > totalBudgetMs) break;
    if (waited > 0) await sleep(waited);
    try {
      const { promise } = withTimeout(url, timeoutMs, { ...rest, headers: h });
      const res = await promise;
      if (res.status >= 500) {
        lastError = new Error(`status_${res.status}`);
      } else {
        return res;
      }
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("secure_fetch_failed");
}

