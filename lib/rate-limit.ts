// lib/rate-limit.ts

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, TokenBucket>();

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Validates whether a given IP address exceeds rate limits using the Token Bucket algorithm.
 * 
 * @param ip The client IP address.
 * @param limit The maximum number of tokens (requests).
 * @param windowMs The time window in milliseconds (e.g. 60000 for 1 minute).
 */
export function rateLimit(ip: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(ip) || { tokens: limit, lastRefill: now };

  // Refill tokens based on time elapsed
  const timeElapsed = now - bucket.lastRefill;
  const refillRate = limit / windowMs; // tokens per millisecond
  const refilledTokens = Math.floor(timeElapsed * refillRate);

  if (refilledTokens > 0) {
    bucket.tokens = Math.min(limit, bucket.tokens + refilledTokens);
    bucket.lastRefill = now;
  }

  const success = bucket.tokens > 0;
  if (success) {
    bucket.tokens -= 1;
  }

  buckets.set(ip, bucket);

  const reset = bucket.lastRefill + windowMs;
  return {
    success,
    limit,
    remaining: bucket.tokens,
    reset,
  };
}
