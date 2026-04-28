import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "vitest";

process.env.DATABASE_URL ??= "postgresql://devstash:devstash@localhost:5432/devstash";

describe("auth rate limiting", () => {
  it("extracts forwarded client IPs and builds normalized rate limit keys", async () => {
    const { buildRateLimitKey, getClientIp } = await import(
      "../src/lib/rate-limit"
    );
    const request = new Request("https://devstash.test/api/auth/register", {
      headers: {
        "x-forwarded-for": " 203.0.113.10, 10.0.0.1 ",
      },
    });

    assert.equal(getClientIp(request), "203.0.113.10");
    assert.equal(
      buildRateLimitKey("auth:login", [" 203.0.113.10 ", " USER@example.com "]),
      "auth:login:203.0.113.10:user@example.com",
    );
  });

  it("returns 429 responses with retry timing when a limit is exceeded", async () => {
    const { createRateLimitResponse } = await import("../src/lib/rate-limit");
    const response = createRateLimitResponse({
      now: () => new Date("2026-04-28T12:00:00.000Z").getTime(),
      reset: new Date("2026-04-28T12:04:00.000Z").getTime(),
    });

    assert.equal(response.status, 429);
    assert.equal(response.headers.get("Retry-After"), "240");
    assert.deepEqual(await response.json(), {
      success: false,
      error: "Too many attempts. Please try again in 4 minutes.",
    });
  });

  it("returns a NextAuth-compatible 429 url for credentials callback limits", async () => {
    const { createNextAuthRateLimitResponse } = await import(
      "../src/lib/rate-limit"
    );
    const response = createNextAuthRateLimitResponse({
      requestUrl: "https://devstash.test/api/auth/callback/credentials",
      reset: new Date("2026-04-28T12:04:00.000Z").getTime(),
      now: () => new Date("2026-04-28T12:00:00.000Z").getTime(),
    });
    const body = (await response.json()) as { url?: string };

    assert.equal(response.status, 429);
    assert.equal(response.headers.get("Retry-After"), "240");
    assert.equal(
      body.url,
      "https://devstash.test/sign-in?error=rate_limited",
    );
  });

  it("fails open if the backing rate limiter is unavailable", async () => {
    const { checkRateLimit } = await import("../src/lib/rate-limit");
    const result = await checkRateLimit({
      key: "auth:register:203.0.113.10",
      limiter: {
        limit: async () => {
          throw new Error("redis unavailable");
        },
      },
    });

    assert.equal(result.success, true);
  });

  it("uses a process-local limiter when Upstash is not configured", async () => {
    const { checkRateLimit, createInMemoryRateLimiter } = await import(
      "../src/lib/rate-limit"
    );
    let now = new Date("2026-04-28T12:00:00.000Z").getTime();
    const limiter = createInMemoryRateLimiter({
      limit: 2,
      now: () => now,
      windowMs: 60_000,
    });

    assert.equal(
      (await checkRateLimit({ key: "auth:register:203.0.113.10", limiter }))
        .success,
      true,
    );
    assert.equal(
      (await checkRateLimit({ key: "auth:register:203.0.113.10", limiter }))
        .success,
      true,
    );

    const blocked = await checkRateLimit({
      key: "auth:register:203.0.113.10",
      limiter,
    });

    assert.equal(blocked.success, false);
    assert.equal(blocked.reset, new Date("2026-04-28T12:01:00.000Z").getTime());

    now = new Date("2026-04-28T12:01:00.001Z").getTime();

    assert.equal(
      (await checkRateLimit({ key: "auth:register:203.0.113.10", limiter }))
        .success,
      true,
    );
  });

  it("wires auth routes and environment docs through the rate limit utility", async () => {
    const [
      envExample,
      nextAuthRoute,
      registerRoute,
      resendVerificationRoute,
      forgotPasswordRoute,
      resetPasswordRoute,
      signInForm,
    ] = await Promise.all([
      readFile(".env.example", "utf8"),
      readFile("src/app/api/auth/[...nextauth]/route.ts", "utf8"),
      readFile("src/app/api/auth/register/route.ts", "utf8"),
      readFile("src/app/api/auth/resend-verification/route.ts", "utf8"),
      readFile("src/app/api/auth/forgot-password/route.ts", "utf8"),
      readFile("src/app/api/auth/reset-password/route.ts", "utf8"),
      readFile("src/components/auth/SignInForm.tsx", "utf8"),
    ]);

    assert.match(envExample, /UPSTASH_REDIS_REST_URL=/);
    assert.match(envExample, /UPSTASH_REDIS_REST_TOKEN=/);
    assert.match(nextAuthRoute, /authRateLimiters\.login/);
    assert.match(nextAuthRoute, /createNextAuthRateLimitResponse/);
    assert.match(registerRoute, /authRateLimiters\.register/);
    assert.match(resendVerificationRoute, /authRateLimiters\.resendVerification/);
    assert.match(forgotPasswordRoute, /authRateLimiters\.forgotPassword/);
    assert.match(resetPasswordRoute, /authRateLimiters\.resetPassword/);
    assert.match(signInForm, /response\?\.status === 429/);
  });
});
