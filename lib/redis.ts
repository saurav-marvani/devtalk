// ============================================================
// DevTalk - Redis Client Singleton
// Upstash Redis with connection pooling for serverless
// ============================================================

import { Redis } from "@upstash/redis"

// Singleton pattern for serverless - reuse across hot reloads
const createRedisClient = (): Redis =>
  new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  })

// Global singleton to survive HMR
const globalForRedis = globalThis as unknown as { redis: Redis | undefined }

export const redis: Redis = globalForRedis.redis ?? createRedisClient()

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis
}

// ---- Pipeline helper for batch operations ----

export const withPipeline = async <T>(
  operations: (pipeline: ReturnType<typeof redis.pipeline>) => void
): Promise<T[]> => {
  const pipeline = redis.pipeline()
  operations(pipeline)
  return pipeline.exec() as Promise<T[]>
}

// ---- Health check ----

export const checkRedisHealth = async (): Promise<boolean> => {
  try {
    const result = await redis.ping()
    return result === "PONG"
  } catch {
    return false
  }
}
