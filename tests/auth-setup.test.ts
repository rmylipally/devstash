import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "vitest";

process.env.DATABASE_URL ??= "postgresql://devstash:devstash@localhost:5432/devstash";

describe("auth setup", () => {
  it("defines an edge-compatible shared auth config without the Prisma adapter", async () => {
    const { default: authConfig } = await import("../src/auth.config");

    assert.equal(Array.isArray(authConfig.providers), true);
    assert.equal(authConfig.providers.length, 2);
    assert.equal("adapter" in authConfig, false);
    assert.equal("session" in authConfig, false);
  });

  it("exposes Auth.js route handlers and helpers from the full auth config", async () => {
    const authModule = await import("../src/auth");
    const routeModule = await import("../src/app/api/auth/[...nextauth]/route");

    assert.equal(typeof authModule.auth, "function");
    assert.equal(typeof authModule.signIn, "function");
    assert.equal(typeof authModule.signOut, "function");
    assert.equal(typeof routeModule.GET, "function");
    assert.equal(typeof routeModule.POST, "function");
  });

  it("protects dashboard routes through the Next.js proxy", async () => {
    const { config, getSignInRedirectUrl, proxy } = await import("../src/proxy");
    const redirectUrl = getSignInRedirectUrl(
      new URL("https://devstash.test/dashboard/items"),
    );

    assert.equal(typeof proxy, "function");
    assert.deepEqual(config, {
      matcher: ["/dashboard/:path*", "/profile", "/items/:path*"],
    });
    assert.equal(redirectUrl.pathname, "/sign-in");
    assert.equal(
      redirectUrl.searchParams.get("callbackUrl"),
      "https://devstash.test/dashboard/items",
    );
  });

  it("keeps the dashboard proxy on the edge-safe shared auth config", async () => {
    const proxySource = await readFile("src/proxy.ts", "utf8");

    assert.match(proxySource, /from "next-auth"/);
    assert.match(proxySource, /from "@\/auth\.config"/);
    assert.doesNotMatch(proxySource, /from "@\/auth"/);
  });

  it("documents auth environment variables and augments sessions with user ids", async () => {
    const [envExample, sessionTypes] = await Promise.all([
      readFile(".env.example", "utf8"),
      readFile("src/types/next-auth.d.ts", "utf8"),
    ]);

    assert.match(envExample, /^AUTH_SECRET=/m);
    assert.match(envExample, /^AUTH_GITHUB_ID=/m);
    assert.match(envExample, /^AUTH_GITHUB_SECRET=/m);
    assert.match(sessionTypes, /interface Session/);
    assert.match(sessionTypes, /id: string/);
  });
});
