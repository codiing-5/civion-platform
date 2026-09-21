import { NextRequest } from "next/server";

interface RateLimitRecord {
  count: number;
  resetTime: number; // Unix timestamp in ms
}

class InMemoryRateLimiter {
  private store: Map<string, RateLimitRecord> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Periodically sweep expired keys every 5 minutes to prevent memory leaks
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  /**
   * Checks and increments hit count for a specific key within a time window.
   * 
   * @param key Unique identifier (e.g., `send_otp:ip:192.168.1.1` or `send_otp:email:user@example.com`)
   * @param maxRequests Maximum allowed requests in window
   * @param windowMs Window duration in milliseconds (e.g., 10 * 60 * 1000 for 10 min)
   */
  public checkLimit(
    key: string,
    maxRequests: number,
    windowMs: number
  ): { allowed: boolean; remaining: number; resetInSeconds: number } {
    const now = Date.now();
    const existing = this.store.get(key);

    if (!existing || now >= existing.resetTime) {
      // First request or window expired
      const resetTime = now + windowMs;
      this.store.set(key, { count: 1, resetTime });
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetInSeconds: Math.ceil(windowMs / 1000),
      };
    }

    if (existing.count >= maxRequests) {
      const resetInSeconds = Math.max(1, Math.ceil((existing.resetTime - now) / 1000));
      return {
        allowed: false,
        remaining: 0,
        resetInSeconds,
      };
    }

    existing.count += 1;
    const resetInSeconds = Math.max(1, Math.ceil((existing.resetTime - now) / 1000));
    return {
      allowed: true,
      remaining: maxRequests - existing.count,
      resetInSeconds,
    };
  }

  private cleanup() {
    const now = Date.now();
    this.store.forEach((record, key) => {
      if (now >= record.resetTime) {
        this.store.delete(key);
      }
    });
  }
}

// Global singleton to persist rate limits across hot reloads in development
const globalForLimiter = global as unknown as { rateLimiterInstance?: InMemoryRateLimiter };
export const rateLimiter = globalForLimiter.rateLimiterInstance || new InMemoryRateLimiter();
if (process.env.NODE_ENV !== "production") globalForLimiter.rateLimiterInstance = rateLimiter;

/**
 * Extracts client IP from incoming NextRequest headers
 */
export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const ip = forwardedFor.split(",")[0].trim();
    if (ip) return ip;
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  return req.ip || "127.0.0.1";
}

/**
 * Rate limit configurations for email auth endpoints
 */
export const RATE_LIMITS = {
  SEND_EMAIL_OTP: {
    IP_MAX: 10,           // 10 sends per IP per 10 mins
    IP_WINDOW_MS: 10 * 60 * 1000,
    EMAIL_MAX: 4,         // 4 sends per email per 10 mins
    EMAIL_WINDOW_MS: 10 * 60 * 1000,
  },
  VERIFY_EMAIL_OTP: {
    IP_MAX: 20,           // 20 verify attempts per IP per 10 mins
    IP_WINDOW_MS: 10 * 60 * 1000,
    EMAIL_MAX: 5,         // 5 verify attempts per email per 10 mins
    EMAIL_WINDOW_MS: 10 * 60 * 1000,
  },
  SEND_OTP: {
    IP_MAX: 10,
    IP_WINDOW_MS: 10 * 60 * 1000,
    PHONE_MAX: 4,
    PHONE_WINDOW_MS: 10 * 60 * 1000,
  },
  VERIFY_OTP: {
    IP_MAX: 20,
    IP_WINDOW_MS: 10 * 60 * 1000,
    PHONE_MAX: 5,
    PHONE_WINDOW_MS: 10 * 60 * 1000,
  },
};
