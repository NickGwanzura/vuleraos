import redis from "./client";

/**
 * Simple rate limiter using Redis.
 * Uses a sliding window (token bucket per key per window).
 *
 * @param key - Unique identifier (e.g., `tenantId:route`)
 * @param limit - Max requests allowed in the window
 * @param windowMs - Time window in milliseconds (default 60s)
 * @returns Whether the request is allowed
 */
export async function checkRateLimit(
  key: string,
  limit: number = 60,
  windowMs: number = 60000
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  try {
    const now = Date.now();
    const windowKey = `ratelimit:${key}:${Math.floor(now / windowMs)}`;

    const count = await redis.incr(windowKey);

    // Set expiry on first request in this window
    if (count === 1) {
      await redis.expire(windowKey, Math.ceil(windowMs / 1000));
    }

    const allowed = count <= limit;
    const remaining = Math.max(0, limit - count);
    const resetAt = new Date(
      Math.ceil(now / windowMs) * windowMs + windowMs
    );

    return { allowed, remaining, resetAt };
  } catch {
    // If Redis is down, allow the request
    return { allowed: true, remaining: limit, resetAt: new Date() };
  }
}

/**
 * Express/Next.js middleware helper for rate limiting API routes.
 *
 * Usage in an API route:
 *   const { allowed, remaining } = await rateLimitByTenant(user.tenantId, "invoices-api");
 *   if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 */
export async function rateLimitByTenant(
  tenantId: string,
  route: string,
  limit?: number,
  windowMs?: number
) {
  return checkRateLimit(`${tenantId}:${route}`, limit, windowMs);
}

/**
 * IP-based rate limiting (for unauthenticated routes like login/register).
 */
export async function rateLimitByIP(
  ip: string,
  route: string,
  limit?: number,
  windowMs?: number
) {
  return checkRateLimit(`ip:${ip}:${route}`, limit, windowMs);
}
