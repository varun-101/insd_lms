import { Redis } from "ioredis";

const url = process.env.REDIS_URL ?? "redis://localhost:6379";

// Shared connection options for BullMQ. `maxRetriesPerRequest: null` is required
// by BullMQ; `lazyConnect` avoids opening a socket until a command is issued
// (so importing these modules during `next build` doesn't try to reach Redis).
export const connection = {
  url,
  maxRetriesPerRequest: null as null,
  lazyConnect: true,
};

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

/** General-purpose Redis client (Zoom token cache, etc.). */
export const redis =
  globalForRedis.redis ??
  new Redis(url, { maxRetriesPerRequest: null, lazyConnect: true });

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;
