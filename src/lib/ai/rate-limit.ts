import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import {
  createInMemoryRateLimiter,
  type RateLimiterLike,
} from "@/lib/rate-limit";

export const AI_TAG_REQUESTS_PER_HOUR = 20;

function createAiRateLimiter(prefix: string): RateLimiterLike {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return createInMemoryRateLimiter({
      limit: AI_TAG_REQUESTS_PER_HOUR,
      windowMs: 60 * 60 * 1_000,
    });
  }

  try {
    new URL(url);

    return new Ratelimit({
      analytics: true,
      limiter: Ratelimit.slidingWindow(AI_TAG_REQUESTS_PER_HOUR, "1 h"),
      prefix,
      redis: new Redis({ token, url }),
      timeout: 1_500,
    });
  } catch {
    return createInMemoryRateLimiter({
      limit: AI_TAG_REQUESTS_PER_HOUR,
      windowMs: 60 * 60 * 1_000,
    });
  }
}

export const aiRateLimiters = {
  autoDescription: {
    limiter: createAiRateLimiter("ai:auto-description"),
    prefix: "ai:auto-description",
  },
  autoTag: {
    limiter: createAiRateLimiter("ai:auto-tag"),
    prefix: "ai:auto-tag",
  },
};
