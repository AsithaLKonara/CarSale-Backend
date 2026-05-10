import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
let redis: Redis | null = null;
const memoryCache = new Map<string, { value: string; expiry: number }>();

try {
  // Initialize Redis client in silent connection failure mode
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    connectTimeout: 2000, // Quick timeout to prevent server blocks
    lazyConnect: true,
  });

  redis.on('error', (err) => {
    // Suppress connection logs to keep server output clean, fallback triggers automatically
    redis = null;
  });

  redis.connect().catch(() => {
    redis = null;
  });
} catch (error) {
  redis = null;
}

/**
 * High-speed caching interface with automatic local memory fallback
 */
export const getCache = async (key: string): Promise<string | null> => {
  if (redis) {
    try {
      return await redis.get(key);
    } catch {
      // Fallback on failure
    }
  }

  // Memory map fallback
  const cached = memoryCache.get(key);
  if (cached) {
    if (Date.now() < cached.expiry) {
      return cached.value;
    }
    memoryCache.delete(key); // Evict expired key
  }
  return null;
};

export const setCache = async (key: string, value: string, ttlSeconds = 300): Promise<void> => {
  if (redis) {
    try {
      await redis.set(key, value, 'EX', ttlSeconds);
      return;
    } catch {
      // Fallback on failure
    }
  }

  // Memory map fallback
  memoryCache.set(key, {
    value,
    expiry: Date.now() + ttlSeconds * 1000,
  });
};

export const delCache = async (key: string): Promise<void> => {
  if (redis) {
    try {
      await redis.del(key);
      return;
    } catch {
      // Fallback on failure
    }
  }

  // Memory map fallback
  memoryCache.delete(key);
};

export const clearCache = async (pattern: string): Promise<void> => {
  if (redis) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return;
    } catch {
      // Fallback on failure
    }
  }

  // Memory map fallback clear
  const prefix = pattern.replace('*', '');
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
};
