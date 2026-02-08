// ============================================================
// DevTalk - Shared Type Definitions
// Pure data types - no runtime dependencies
// ============================================================

// ---- User & Connection Types ----

export interface UserConnection {
  readonly userId: string
  readonly displayName: string
  readonly connectedAt: string
  readonly lastHeartbeat: string
}

export interface AuthUser {
  readonly id: string
  readonly email: string
  readonly name: string
  readonly createdAt: string
}

// ---- Room Types ----

export interface Room {
  readonly id: string
  readonly user1Id: string
  readonly user2Id: string
  readonly createdAt: string
  readonly status: RoomStatus
}

export type RoomStatus = "waiting" | "active" | "closed"

// ---- Signaling Types ----

export type SignalType =
  | "lobby"
  | "send-offer"
  | "send-answer"
  | "offer"
  | "answer"
  | "add-ice-candidate"
  | "chat-message"
  | "peer-disconnected"
  | "error"
  | "heartbeat"
  | "matched"

export interface SignalMessage {
  readonly type: SignalType
  readonly payload: Record<string, unknown>
  readonly timestamp: string
  readonly senderId: string
}

export interface OfferPayload {
  readonly sdp: RTCSessionDescriptionInit
  readonly roomId: string
}

export interface AnswerPayload {
  readonly sdp: RTCSessionDescriptionInit
  readonly roomId: string
}

export interface IceCandidatePayload {
  readonly candidate: RTCIceCandidateInit
  readonly roomId: string
  readonly type: "sender" | "receiver"
}

export interface ChatMessagePayload {
  readonly message: string
  readonly senderName: string
  readonly roomId: string
  readonly timestamp: string
}

// ---- Queue Types ----

export interface QueueEntry {
  readonly userId: string
  readonly displayName: string
  readonly joinedAt: string
}

// ---- Event Bus Types ----

export type EventChannel =
  | `user:${string}`
  | `room:${string}`
  | "queue:matchmaking"
  | "system:health"

export interface BusEvent<T = unknown> {
  readonly channel: EventChannel
  readonly type: string
  readonly data: T
  readonly timestamp: string
  readonly correlationId: string
}

// ---- API Response Types ----

export interface ApiResponse<T = unknown> {
  readonly success: boolean
  readonly data?: T
  readonly error?: string
  readonly timestamp: string
}

export interface HealthStatus {
  readonly status: "healthy" | "degraded" | "unhealthy"
  readonly uptime: number
  readonly redis: "connected" | "disconnected"
  readonly activeConnections: number
  readonly activeRooms: number
  readonly queueSize: number
}

// ---- Rate Limiter Types ----

export interface RateLimitResult {
  readonly allowed: boolean
  readonly remaining: number
  readonly resetAt: number
}

// ---- Constants ----

export const REDIS_KEYS = {
  userConnection: (userId: string) => `devtalk:user:${userId}` as const,
  room: (roomId: string) => `devtalk:room:${roomId}` as const,
  roomUsers: (roomId: string) => `devtalk:room:${roomId}:users` as const,
  userRoom: (userId: string) => `devtalk:user:${userId}:room` as const,
  matchmakingQueue: "devtalk:queue:matchmaking" as const,
  activeRooms: "devtalk:rooms:active" as const,
  activeUsers: "devtalk:users:active" as const,
  rateLimit: (key: string) => `devtalk:ratelimit:${key}` as const,
  eventStream: (channel: string) => `devtalk:stream:${channel}` as const,
  signalChannel: (userId: string) => `devtalk:signal:${userId}` as const,
  stats: "devtalk:stats" as const,
} as const

export const LIMITS = {
  MAX_ROOMS: 100_000,
  MAX_QUEUE_SIZE: 50_000,
  HEARTBEAT_INTERVAL_MS: 10_000,
  HEARTBEAT_TIMEOUT_MS: 30_000,
  USER_TTL_SECONDS: 300,
  ROOM_TTL_SECONDS: 3600,
  RATE_LIMIT_WINDOW_SECONDS: 60,
  RATE_LIMIT_MAX_REQUESTS: 100,
  SIGNAL_MESSAGE_TTL_SECONDS: 30,
  SSE_RETRY_MS: 3000,
} as const
