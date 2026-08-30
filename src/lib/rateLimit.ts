import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const sharedLimiters = new Map<string, Ratelimit>();

const hasUpstashConfig = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);
const redis = hasUpstashConfig ? Redis.fromEnv() : null;

function localRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();

  if (buckets.size > 5000) {
    for (const [bucketKey, bucket] of buckets) {
      if (now > bucket.resetAt) buckets.delete(bucketKey);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfter: 0 };
}

/**
 * Shared, serverless-safe rate limiting through Upstash Redis. Local memory is
 * retained only for development when the two Upstash `.env` values are absent.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfter: number }> {
  if (!redis) return localRateLimit(key, limit, windowMs);

  const configKey = `${limit}:${windowMs}`;
  let limiter = sharedLimiters.get(configKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      prefix: `techchasers:${configKey}`,
      limiter: Ratelimit.slidingWindow(limit, `${Math.ceil(windowMs / 1000)} s`),
    });
    sharedLimiters.set(configKey, limiter);
  }

  try {
    const result = await limiter.limit(key);
    return {
      allowed: result.success,
      retryAfter: result.success ? 0 : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
    };
  } catch (error) {
    // Availability should not turn a Redis outage into a storefront outage.
    console.error('Upstash rate limit failed; using temporary local fallback:', error);
    return localRateLimit(key, limit, windowMs);
  }
}

export function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}
