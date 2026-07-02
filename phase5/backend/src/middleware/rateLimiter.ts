import { Request, Response, NextFunction } from "express";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

interface RateLimitOptions {
  windowMs: number;
  max: number;
  standardHeaders?: boolean;
  skipHealthCheck?: boolean;
}

const store: RateLimitStore = {};

export function rateLimiter(options: RateLimitOptions) {
  const { windowMs, max, standardHeaders = true, skipHealthCheck = false } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip rate limiting for health check endpoint
    if (skipHealthCheck && req.path === "/health") {
      return next();
    }

    const now = Date.now();
    const windowStart = now - windowMs;
    const key = `${req.ip}:${req.path}`;

    // Clean up expired entries
    for (const k in store) {
      if (store[k].resetTime < now) {
        delete store[k];
      }
    }

    // Get or create entry
    if (!store[key]) {
      store[key] = { count: 0, resetTime: now + windowMs };
    }

    const entry = store[key];

    // Reset if window expired
    if (entry.resetTime < now) {
      entry.count = 0;
      entry.resetTime = now + windowMs;
    }

    entry.count++;

    // Set rate limit headers
    if (standardHeaders) {
      res.setHeader("X-RateLimit-Limit", max.toString());
      res.setHeader("X-RateLimit-Remaining", Math.max(0, max - entry.count).toString());
      res.setHeader("X-RateLimit-Reset", entry.resetTime.toString());
    }

    // Check if limit exceeded
    if (entry.count > max) {
      return res.status(429).json({
        error_code: "RATE_LIMIT_EXCEEDED",
        error_message: "Too many requests. Please try again later.",
        request_id: req.requestId,
      });
    }

    next();
  };
}

// Stricter rate limiter for AI endpoints
export function aiRateLimiter(options?: Partial<RateLimitOptions>) {
  return rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    ...options,
  });
}