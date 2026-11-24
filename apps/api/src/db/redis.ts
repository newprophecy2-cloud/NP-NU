import { Redis } from 'ioredis';
import { Queue } from 'bullmq';
import { getEnv } from '../config/env.js';

let redisInstance: Redis | null = null;
let scrapeQueueInstance: Queue | null = null;

export function getRedis(): Redis {
  if (!redisInstance) {
    const env = getEnv();
    redisInstance = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: true,
    });
  }
  return redisInstance;
}

export function getScrapeQueue(): Queue {
  if (!scrapeQueueInstance) {
    const env = getEnv();
    scrapeQueueInstance = new Queue('npnu-scrape-jobs', {
      connection: { url: env.REDIS_URL },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    });
  }
  return scrapeQueueInstance;
}

export async function cachedJson<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>
): Promise<{ data: T; cacheHit: boolean }> {
  const redis = getRedis();
  try {
    const hit = await redis.get(key);
    if (hit) {
      return { data: JSON.parse(hit) as T, cacheHit: true };
    }
  } catch {
    // Graceful cache degradation
  }
  const data = await loader();
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(data));
  } catch {
    // Ignore cache write errors
  }
  return { data, cacheHit: false };
}

export async function invalidateCachePrefix(prefix: string): Promise<void> {
  const redis = getRedis();
  try {
    const keys = await redis.keys(`${prefix}*`);
    if (keys.length > 0) await redis.del(...keys);
  } catch {
    // Ignore
  }
}

export async function closeRedis(): Promise<void> {
  if (scrapeQueueInstance) {
    await scrapeQueueInstance.close();
    scrapeQueueInstance = null;
  }
  if (redisInstance) {
    await redisInstance.quit();
    redisInstance = null;
  }
}
