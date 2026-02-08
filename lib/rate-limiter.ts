// ============================================================
// DevTalk - Redis-backed Rate Limiter
// Sliding window counter using Redis INCR + EXPIRE
// Memory-efficient, horizontally scalable
// ============================================================

import { redis } from "./redis"
import { REDIS_KEYS, LIMITS } from "./types"
import type { RateLimitResult } from "./types"

// ---- Sliding window rate limiter ----

export const checkRateLimit = async (
  identifier: string,
  maxRequests: number = LIMITS.RATE_LIMIT_MAX_REQUESTS,
  windowSeconds: number = LIMITS.RATE_LIMIT_WINDOW_SECONDS
): Promise<RateLimitResult> => {
  const key = REDIS_KEYS.rateLimit(identifier)
  const now = Math.floor(Date.now() / 1000)
  const windowKey = `${key}:${Math.floor(now / windowSeconds)}`

  const pipeline = redis.pipeline()
  pipeline.incr(windowKey)
  pipeline.expire(windowKey, windowSeconds)

  const results = await pipeline.exec()
  const currentCount = (results[0] as number) ?? 0

  const allowed = currentCount <= maxRequests
  const remaining = Math.max(0, maxRequests - currentCount)
  const resetAt = (Math.floor(now / windowSeconds) + 1) * windowSeconds * 1000

  return { allowed, remaining, resetAt }
}

// ---- IP-based rate limiter for API routes ----

export const checkIpRateLimit = async (
  ip: string,
  maxRequests: number = 60,
  windowSeconds: number = 60
): Promise<RateLimitResult> => {
  return checkRateLimit(`ip:${ip}`, maxRequests, windowSeconds)
}

// ---- User-based rate limiter ----

export const checkUserRateLimit = async (
  userId: string,
  maxRequests: number = LIMITS.RATE_LIMIT_MAX_REQUESTS,
  windowSeconds: number = LIMITS.RATE_LIMIT_WINDOW_SECONDS
): Promise<RateLimitResult> => {
  return checkRateLimit(`user:${userId}`, maxRequests, windowSeconds)
}

// ---- Signaling-specific rate limiter (higher throughput) ----

export const checkSignalingRateLimit = async (
  userId: string
): Promise<RateLimitResult> => {
  // Signaling needs higher limits: 200 req/10sec
  return checkRateLimit(`signal:${userId}`, 200, 10)
}
