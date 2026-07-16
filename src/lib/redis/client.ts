import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  const url = process.env.REDIS_URL;

  if (!url) {
    // Return a mock client when Redis is not configured
    // This prevents crashing during development
    console.warn("REDIS_URL not set — Redis features disabled");
    return createNullRedis();
  }

  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) return null; // Give up after 3 retries
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  client.on("error", (err) => {
    console.warn("Redis connection error:", err.message);
  });

  client.on("connect", () => {
    console.log("Redis connected");
  });

  return client;
}

/**
 * Null Redis client — silently no-ops when Redis isn't configured.
 * Allows the app to run without Redis in development.
 */
function createNullRedis(): any {
  return {
    get: async () => null,
    set: async () => "OK",
    setex: async () => "OK",
    del: async () => 0,
    incr: async () => 1,
    expire: async () => 1,
    lpush: async () => 1,
    rpoplpush: async () => null,
    llen: async () => 0,
    lrange: async () => [],
    lrem: async () => 0,
    ping: async () => "PONG",
    quit: async () => "OK",
    on: () => {},
    status: "close",
  };
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

/**
 * Health check — returns true if Redis is connected.
 */
export async function isRedisHealthy(): Promise<boolean> {
  try {
    const result = await redis.ping();
    return result === "PONG";
  } catch {
    return false;
  }
}

export default redis;
