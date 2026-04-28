import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

interface RateLimitProviderResult {
  limit?: number;
  remaining?: number;
  reset?: number;
  success: boolean;
}

export interface RateLimiterLike {
  limit(identifier: string): Promise<RateLimitProviderResult>;
}

interface AuthRateLimiter {
  limiter: RateLimiterLike | null;
  prefix: string;
}

interface InMemoryRateLimiterOptions {
  limit: number;
  now?: () => number;
  windowMs: number;
}

interface CheckRateLimitInput {
  key: string;
  limiter: RateLimiterLike | null;
}

interface CheckRateLimitResult {
  limit: number;
  remaining: number;
  reset: number;
  success: boolean;
}

interface EnforceAuthRateLimitInput {
  identifiers?: string[];
  rateLimiter: AuthRateLimiter;
  request: Request;
}

let redisClient: Redis | null | undefined;

function durationToMs(duration: Duration): number {
  const match = duration.match(/^(\d+)\s*(ms|s|m|h|d)$/);

  if (!match) {
    return 60_000;
  }

  const value = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case "ms":
      return value;
    case "s":
      return value * 1_000;
    case "m":
      return value * 60_000;
    case "h":
      return value * 60 * 60_000;
    case "d":
      return value * 24 * 60 * 60_000;
    default:
      return 60_000;
  }
}

export function createInMemoryRateLimiter({
  limit,
  now = Date.now,
  windowMs,
}: InMemoryRateLimiterOptions): RateLimiterLike {
  const attempts = new Map<string, { count: number; reset: number }>();

  return {
    async limit(identifier: string): Promise<RateLimitProviderResult> {
      const timestamp = now();
      const existing = attempts.get(identifier);
      const current =
        existing && existing.reset > timestamp
          ? existing
          : { count: 0, reset: timestamp + windowMs };
      const nextCount = current.count + 1;

      attempts.set(identifier, {
        count: nextCount,
        reset: current.reset,
      });

      return {
        success: nextCount <= limit,
        limit,
        remaining: Math.max(0, limit - nextCount),
        reset: current.reset,
      };
    },
  };
}

function getRedisClient(): Redis | null {
  if (redisClient !== undefined) {
    return redisClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    redisClient = null;
    return redisClient;
  }

  try {
    new URL(url);
    redisClient = new Redis({ token, url });
  } catch {
    redisClient = null;
  }

  return redisClient;
}

function createAuthRateLimiter(
  prefix: string,
  limit: number,
  window: Duration,
): AuthRateLimiter {
  const redis = getRedisClient();

  if (!redis) {
    return {
      limiter: createInMemoryRateLimiter({
        limit,
        windowMs: durationToMs(window),
      }),
      prefix,
    };
  }

  return {
    limiter: new Ratelimit({
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix,
      redis,
      timeout: 1_500,
    }),
    prefix,
  };
}

function normalizeRateLimitKeyPart(value: string): string {
  return value.trim().toLowerCase();
}

export const authRateLimiters = {
  forgotPassword: createAuthRateLimiter("auth:forgot-password", 3, "1 h"),
  login: createAuthRateLimiter("auth:login", 5, "15 m"),
  register: createAuthRateLimiter("auth:register", 3, "1 h"),
  resendVerification: createAuthRateLimiter("auth:resend-verification", 3, "15 m"),
  resetPassword: createAuthRateLimiter("auth:reset-password", 5, "15 m"),
};

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    const [clientIp] = forwardedFor.split(",");
    const normalizedClientIp = clientIp?.trim();

    if (normalizedClientIp) {
      return normalizedClientIp;
    }
  }

  return (
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

export function buildRateLimitKey(prefix: string, parts: string[]): string {
  const normalizedParts = parts
    .map(normalizeRateLimitKeyPart)
    .filter(Boolean);

  return [prefix, ...normalizedParts].join(":");
}

export async function checkRateLimit({
  key,
  limiter,
}: CheckRateLimitInput): Promise<CheckRateLimitResult> {
  if (!limiter) {
    return {
      limit: 0,
      remaining: 0,
      reset: Date.now(),
      success: true,
    };
  }

  try {
    const result = await limiter.limit(key);

    return {
      limit: result.limit ?? 0,
      remaining: result.remaining ?? 0,
      reset: result.reset ?? Date.now(),
      success: result.success,
    };
  } catch {
    return {
      limit: 0,
      remaining: 0,
      reset: Date.now(),
      success: true,
    };
  }
}

export function createRateLimitResponse({
  now = Date.now,
  reset,
}: {
  now?: () => number;
  reset: number;
}): NextResponse {
  const retryAfterSeconds = Math.max(1, Math.ceil((reset - now()) / 1_000));
  const retryAfterMinutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  const minuteLabel = retryAfterMinutes === 1 ? "minute" : "minutes";

  return NextResponse.json(
    {
      success: false,
      error: `Too many attempts. Please try again in ${retryAfterMinutes} ${minuteLabel}.`,
    },
    {
      headers: {
        "Retry-After": retryAfterSeconds.toString(),
      },
      status: 429,
    },
  );
}

export function createNextAuthRateLimitResponse({
  now = Date.now,
  requestUrl,
  reset,
}: {
  now?: () => number;
  requestUrl: string;
  reset: number;
}): NextResponse {
  const retryAfterSeconds = Math.max(1, Math.ceil((reset - now()) / 1_000));
  const signInUrl = new URL("/sign-in", requestUrl);

  signInUrl.searchParams.set("error", "rate_limited");

  return NextResponse.json(
    {
      url: signInUrl.toString(),
    },
    {
      headers: {
        "Retry-After": retryAfterSeconds.toString(),
      },
      status: 429,
    },
  );
}

export async function enforceAuthRateLimit({
  identifiers = [],
  rateLimiter,
  request,
}: EnforceAuthRateLimitInput): Promise<NextResponse | null> {
  const key = buildRateLimitKey(rateLimiter.prefix, [
    getClientIp(request),
    ...identifiers,
  ]);
  const result = await checkRateLimit({
    key,
    limiter: rateLimiter.limiter,
  });

  return result.success ? null : createRateLimitResponse({ reset: result.reset });
}
