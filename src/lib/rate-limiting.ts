/**
 * Rate limiting utilities for AI service endpoints
 * Implements both user-level and session-level rate limiting
 */

import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastRequest: number;
}

interface SessionLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

// In-memory storage for rate limiting (replace with Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();
const sessionLimitStore = new Map<string, SessionLimitEntry>();

// Rate limiting configuration
export const RATE_LIMITS = {
  USER_HOURLY: { limit: 100, window: 60 * 60 * 1000 }, // 100 requests per hour
  USER_BURST: { limit: 10, window: 60 * 1000 }, // 10 requests per minute (burst)
  SESSION_CHAT: { limit: 20, window: 15 * 60 * 1000 }, // 20 messages per 15 minutes
} as const;

/**
 * Get client identifier from request (IP + optional user ID)
 */
function getClientId(request: NextRequest): string {
  const ip =
    request.ip ||
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // In production, you might want to include user ID from JWT
  // const userId = extractUserFromToken(request);
  // return userId ? `user:${userId}` : `ip:${ip}`;

  return `ip:${ip}`;
}

/**
 * Get session identifier from request
 */
function getSessionId(request: NextRequest): string | null {
  // Try to get session ID from headers, query params, or body
  const sessionId =
    request.headers.get("x-session-id") ||
    request.nextUrl.searchParams.get("sessionId");

  return sessionId || null;
}

/**
 * Check if request is within rate limits
 */
function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  store: Map<string, RateLimitEntry>
): {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
} {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetTime) {
    // First request or window expired
    const resetTime = now + windowMs;
    store.set(key, {
      count: 1,
      resetTime,
      lastRequest: now,
    });

    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetTime,
    };
  }

  if (entry.count >= limit) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter,
    };
  }

  // Within limits, increment counter
  entry.count++;
  entry.lastRequest = now;

  return {
    allowed: true,
    limit,
    remaining: limit - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Check session-based rate limits (for chat endpoints)
 */
function checkSessionLimit(
  sessionId: string,
  limit: number,
  windowMs: number
): {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
} {
  const now = Date.now();
  const entry = sessionLimitStore.get(sessionId);

  if (!entry || now >= entry.resetTime) {
    // First request or window expired
    const resetTime = now + windowMs;
    sessionLimitStore.set(sessionId, {
      count: 1,
      resetTime,
      firstRequest: now,
    });

    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetTime,
    };
  }

  if (entry.count >= limit) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter,
    };
  }

  // Within limits, increment counter
  entry.count++;

  return {
    allowed: true,
    limit,
    remaining: limit - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Rate limiting middleware for AI endpoints
 */
export function rateLimitMiddleware(request: NextRequest): NextResponse | null {
  const clientId = getClientId(request);
  const sessionId = getSessionId(request);

  // Check user hourly limit
  const hourlyCheck = checkRateLimit(
    `hourly:${clientId}`,
    RATE_LIMITS.USER_HOURLY.limit,
    RATE_LIMITS.USER_HOURLY.window,
    rateLimitStore
  );

  if (!hourlyCheck.allowed) {
    return new NextResponse(
      JSON.stringify({
        error: "Rate limit exceeded",
        message: "Hourly request limit exceeded",
        limit: hourlyCheck.limit,
        remaining: hourlyCheck.remaining,
        resetTime: new Date(hourlyCheck.resetTime).toISOString(),
        retryAfter: hourlyCheck.retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": hourlyCheck.retryAfter!.toString(),
          "X-RateLimit-Limit": hourlyCheck.limit.toString(),
          "X-RateLimit-Remaining": hourlyCheck.remaining.toString(),
          "X-RateLimit-Reset": Math.floor(
            hourlyCheck.resetTime / 1000
          ).toString(),
        },
      }
    );
  }

  // Check user burst limit
  const burstCheck = checkRateLimit(
    `burst:${clientId}`,
    RATE_LIMITS.USER_BURST.limit,
    RATE_LIMITS.USER_BURST.window,
    rateLimitStore
  );

  if (!burstCheck.allowed) {
    return new NextResponse(
      JSON.stringify({
        error: "Rate limit exceeded",
        message: "Burst request limit exceeded",
        limit: burstCheck.limit,
        remaining: burstCheck.remaining,
        resetTime: new Date(burstCheck.resetTime).toISOString(),
        retryAfter: burstCheck.retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": burstCheck.retryAfter!.toString(),
          "X-RateLimit-Limit": burstCheck.limit.toString(),
          "X-RateLimit-Remaining": burstCheck.remaining.toString(),
          "X-RateLimit-Reset": Math.floor(
            burstCheck.resetTime / 1000
          ).toString(),
        },
      }
    );
  }

  // Check session chat limit (if applicable)
  if (sessionId && request.nextUrl.pathname.includes("/api/chat/")) {
    const sessionCheck = checkSessionLimit(
      sessionId,
      RATE_LIMITS.SESSION_CHAT.limit,
      RATE_LIMITS.SESSION_CHAT.window
    );

    if (!sessionCheck.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: "Session rate limit exceeded",
          message: "Too many chat messages in this session",
          limit: sessionCheck.limit,
          remaining: sessionCheck.remaining,
          resetTime: new Date(sessionCheck.resetTime).toISOString(),
          retryAfter: sessionCheck.retryAfter,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": sessionCheck.retryAfter!.toString(),
            "X-RateLimit-Limit": sessionCheck.limit.toString(),
            "X-RateLimit-Remaining": sessionCheck.remaining.toString(),
            "X-RateLimit-Reset": Math.floor(
              sessionCheck.resetTime / 1000
            ).toString(),
          },
        }
      );
    }
  }

  // All rate limit checks passed
  return null;
}

/**
 * Add rate limit headers to successful responses
 */
export function addRateLimitHeaders(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  const clientId = getClientId(request);

  // Get current rate limit status
  const hourlyEntry = rateLimitStore.get(`hourly:${clientId}`);
  const burstEntry = rateLimitStore.get(`burst:${clientId}`);

  if (hourlyEntry) {
    response.headers.set(
      "X-RateLimit-Limit-Hourly",
      RATE_LIMITS.USER_HOURLY.limit.toString()
    );
    response.headers.set(
      "X-RateLimit-Remaining-Hourly",
      Math.max(0, RATE_LIMITS.USER_HOURLY.limit - hourlyEntry.count).toString()
    );
    response.headers.set(
      "X-RateLimit-Reset-Hourly",
      Math.floor(hourlyEntry.resetTime / 1000).toString()
    );
  }

  if (burstEntry) {
    response.headers.set(
      "X-RateLimit-Limit-Burst",
      RATE_LIMITS.USER_BURST.limit.toString()
    );
    response.headers.set(
      "X-RateLimit-Remaining-Burst",
      Math.max(0, RATE_LIMITS.USER_BURST.limit - burstEntry.count).toString()
    );
    response.headers.set(
      "X-RateLimit-Reset-Burst",
      Math.floor(burstEntry.resetTime / 1000).toString()
    );
  }

  return response;
}

/**
 * Clean up expired entries from memory stores
 * Should be called periodically to prevent memory leaks
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }

  for (const [key, entry] of sessionLimitStore.entries()) {
    if (now >= entry.resetTime) {
      sessionLimitStore.delete(key);
    }
  }
}

// Clean up expired entries every 5 minutes
if (typeof window === "undefined") {
  // Only run on server side
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}
