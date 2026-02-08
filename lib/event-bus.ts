// ============================================================
// DevTalk - Redis-backed Event Bus
// Pub/sub pattern using Redis lists as message queues
// Provides cross-instance communication for horizontal scaling
// ============================================================

import { redis } from "./redis"
import { REDIS_KEYS, LIMITS } from "./types"
import type { SignalMessage, SignalType } from "./types"

// ---- Publish a signal message to a user's channel ----

export const publishSignal = async (
  targetUserId: string,
  type: SignalType,
  payload: Record<string, unknown>,
  senderId: string
): Promise<void> => {
  const message: SignalMessage = {
    type,
    payload,
    timestamp: new Date().toISOString(),
    senderId,
  }

  const channel = REDIS_KEYS.signalChannel(targetUserId)

  // Use LPUSH + LTRIM to maintain a bounded queue per user
  const pipeline = redis.pipeline()
  pipeline.lpush(channel, JSON.stringify(message))
  pipeline.ltrim(channel, 0, 99) // Keep last 100 messages max
  pipeline.expire(channel, LIMITS.SIGNAL_MESSAGE_TTL_SECONDS)
  await pipeline.exec()
}

// ---- Consume pending signals for a user (RPOP pattern) ----

export const consumeSignals = async (
  userId: string,
  maxMessages: number = 10
): Promise<SignalMessage[]> => {
  const channel = REDIS_KEYS.signalChannel(userId)
  const messages: SignalMessage[] = []

  for (let i = 0; i < maxMessages; i++) {
    const raw = await redis.rpop<string>(channel)
    if (!raw) break

    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw
      messages.push(parsed as SignalMessage)
    } catch {
      // Skip malformed messages
      continue
    }
  }

  return messages
}

// ---- Broadcast to all users in a room ----

export const broadcastToRoom = async (
  roomId: string,
  type: SignalType,
  payload: Record<string, unknown>,
  senderId: string,
  excludeSender: boolean = true
): Promise<void> => {
  const usersKey = REDIS_KEYS.roomUsers(roomId)
  const userIds = await redis.smembers(usersKey)

  const targets = excludeSender
    ? userIds.filter((id) => id !== senderId)
    : userIds

  await Promise.all(
    targets.map((targetId) =>
      publishSignal(targetId as string, type, payload, senderId)
    )
  )
}

// ---- Check for pending messages (non-destructive) ----

export const hasPendingSignals = async (userId: string): Promise<boolean> => {
  const channel = REDIS_KEYS.signalChannel(userId)
  const length = await redis.llen(channel)
  return length > 0
}

// ---- Clear all pending signals for a user ----

export const clearSignals = async (userId: string): Promise<void> => {
  const channel = REDIS_KEYS.signalChannel(userId)
  await redis.del(channel)
}
