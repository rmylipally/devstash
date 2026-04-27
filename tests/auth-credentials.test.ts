import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { describe, it } from "node:test";

process.env.DATABASE_URL ??= "postgresql://devstash:devstash@localhost:5432/devstash";

describe("auth credentials", () => {
  it("adds an edge-safe Credentials provider placeholder to the shared auth config", async () => {
    const { default: authConfig } = await import("../src/auth.config");

    assert.equal(Array.isArray(authConfig.providers), true);
    assert.equal(authConfig.providers.length, 2);
    assert.equal("adapter" in authConfig, false);
    assert.equal("session" in authConfig, false);
  });

  it("authorizes a user when the submitted password matches the stored bcrypt hash", async () => {
    const { authorizeCredentials } = await import("../src/lib/auth/credentials");
    const passwordHash = await hash("password123", 4);

    const user = await authorizeCredentials(
      { email: "  TEST@example.com ", password: "password123" },
      {
        user: {
          findUnique: async () => ({
            id: "user_1",
            email: "test@example.com",
            emailVerified: new Date("2026-04-27T12:00:00.000Z"),
            name: "Test User",
            image: null,
            passwordHash,
          }),
        },
      },
    );

    assert.deepEqual(user, {
      id: "user_1",
      email: "test@example.com",
      name: "Test User",
      image: null,
    });
  });

  it("returns null for invalid credentials or users without password hashes", async () => {
    const { authorizeCredentials } = await import("../src/lib/auth/credentials");
    const passwordHash = await hash("password123", 4);

    const wrongPassword = await authorizeCredentials(
      { email: "test@example.com", password: "wrong-password" },
      {
        user: {
          findUnique: async () => ({
            id: "user_1",
            email: "test@example.com",
            emailVerified: new Date("2026-04-27T12:00:00.000Z"),
            name: "Test User",
            image: null,
            passwordHash,
          }),
        },
      },
    );
    const oauthOnlyUser = await authorizeCredentials(
      { email: "oauth@example.com", password: "password123" },
      {
        user: {
          findUnique: async () => ({
            id: "user_2",
            email: "oauth@example.com",
            emailVerified: new Date("2026-04-27T12:00:00.000Z"),
            name: "OAuth User",
            image: null,
            passwordHash: null,
          }),
        },
      },
    );
    const missingInput = await authorizeCredentials(
      { email: "", password: "password123" },
      {
        user: {
          findUnique: async () => null,
        },
      },
    );

    assert.equal(wrongPassword, null);
    assert.equal(oauthOnlyUser, null);
    assert.equal(missingInput, null);
  });

  it("blocks credentials sign-in until the email address has been verified", async () => {
    const { authorizeCredentials, EmailNotVerifiedError } = await import(
      "../src/lib/auth/credentials"
    );
    const passwordHash = await hash("password123", 4);

    await assert.rejects(
      () =>
        authorizeCredentials(
          { email: "test@example.com", password: "password123" },
          {
            user: {
              findUnique: async () => ({
                id: "user_1",
                email: "test@example.com",
                emailVerified: null,
                name: "Test User",
                image: null,
                passwordHash,
              }),
            },
          },
        ),
      EmailNotVerifiedError,
    );
  });

  it("allows unverified credentials sign-in when email verification is disabled", async () => {
    const { authorizeCredentials } = await import("../src/lib/auth/credentials");
    const passwordHash = await hash("password123", 4);

    const user = await authorizeCredentials(
      { email: "test@example.com", password: "password123" },
      {
        user: {
          findUnique: async () => ({
            id: "user_1",
            email: "test@example.com",
            emailVerified: null,
            name: "Test User",
            image: null,
            passwordHash,
          }),
        },
      },
      { emailVerificationEnabled: false },
    );

    assert.deepEqual(user, {
      id: "user_1",
      email: "test@example.com",
      image: null,
      name: "Test User",
    });
  });

  it("validates registration input before creating a user", async () => {
    const { registerUser } = await import("../src/lib/auth/credentials");

    const result = await registerUser(
      {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        confirmPassword: "different-password",
      },
      {
        user: {
          findUnique: async () => null,
          create: async () => {
            throw new Error("create should not be called");
          },
        },
      },
    );

    assert.deepEqual(result, {
      success: false,
      status: 400,
      error: "Passwords do not match.",
    });
  });

  it("rejects duplicate registration emails", async () => {
    const { registerUser } = await import("../src/lib/auth/credentials");

    const result = await registerUser(
      {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
      },
      {
        user: {
          findUnique: async () => ({
            id: "user_1",
            email: "test@example.com",
          }),
          create: async () => {
            throw new Error("create should not be called");
          },
        },
      },
    );

    assert.deepEqual(result, {
      success: false,
      status: 409,
      error: "An account with that email already exists.",
    });
  });

  it("hashes a new user's password and returns a consistent success response", async () => {
    const { registerUser } = await import("../src/lib/auth/credentials");
    let savedPasswordHash = "";
    let savedVerificationToken = "";
    let sentVerificationUrl = "";
    const now = new Date("2026-04-27T12:00:00.000Z");

    const result = await registerUser(
      {
        name: "Test User",
        email: " TEST@example.com ",
        password: "password123",
        confirmPassword: "password123",
      },
      {
        user: {
          findUnique: async () => null,
          create: async ({ data }) => {
            savedPasswordHash = data.passwordHash;

            return {
              id: "user_1",
              email: data.email,
              name: data.name,
            };
          },
        },
        verificationToken: {
          deleteMany: async () => ({ count: 0 }),
          create: async ({ data }) => {
            savedVerificationToken = data.token;

            return data;
          },
        },
      },
      {
        appUrl: "https://devstash.test",
        now: () => now,
        passwordHashRounds: 4,
        sendVerificationEmail: async ({ verificationUrl }) => {
          sentVerificationUrl = verificationUrl;
        },
        tokenGenerator: () => "raw-token",
      },
    );

    assert.equal(await compare("password123", savedPasswordHash), true);
    assert.notEqual(savedPasswordHash, "password123");
    assert.equal(
      savedVerificationToken,
      createHash("sha256").update("raw-token").digest("hex"),
    );
    assert.equal(
      sentVerificationUrl,
      "https://devstash.test/verify-email?email=test%40example.com&token=raw-token",
    );
    assert.deepEqual(result, {
      success: true,
      status: 201,
      data: {
        verificationRequired: true,
        user: {
          id: "user_1",
          email: "test@example.com",
          name: "Test User",
        },
      },
    });
  });

  it("skips verification token and email creation when verification is disabled", async () => {
    const { registerUser } = await import("../src/lib/auth/credentials");
    const now = new Date("2026-04-27T12:00:00.000Z");
    let savedEmailVerified: Date | null | undefined;
    let verificationTokenWasUsed = false;
    let verificationEmailWasSent = false;

    const result = await registerUser(
      {
        name: "Test User",
        email: " TEST@example.com ",
        password: "password123",
        confirmPassword: "password123",
      },
      {
        user: {
          findUnique: async () => null,
          create: async ({ data }) => {
            savedEmailVerified = data.emailVerified;

            return {
              id: "user_1",
              email: data.email,
              name: data.name,
            };
          },
        },
        verificationToken: {
          deleteMany: async () => {
            verificationTokenWasUsed = true;
            return { count: 0 };
          },
          create: async ({ data }) => {
            verificationTokenWasUsed = true;
            return data;
          },
        },
      },
      {
        emailVerificationEnabled: false,
        now: () => now,
        passwordHashRounds: 4,
        sendVerificationEmail: async () => {
          verificationEmailWasSent = true;
        },
      },
    );

    assert.equal(savedEmailVerified?.toISOString(), now.toISOString());
    assert.equal(verificationTokenWasUsed, false);
    assert.equal(verificationEmailWasSent, false);
    assert.deepEqual(result, {
      success: true,
      status: 201,
      data: {
        verificationRequired: false,
        user: {
          id: "user_1",
          email: "test@example.com",
          name: "Test User",
        },
      },
    });
  });

  it("verifies unexpired email tokens and consumes them", async () => {
    const { verifyEmailToken } = await import("../src/lib/auth/email-verification");
    const now = new Date("2026-04-27T12:00:00.000Z");
    const tokenHash = createHash("sha256").update("raw-token").digest("hex");
    const state: { updatedEmailVerified: Date | null } = {
      updatedEmailVerified: null,
    };
    let deletedToken = "";

    const result = await verifyEmailToken(
      { email: " TEST@example.com ", token: "raw-token" },
      {
        user: {
          update: async ({ data }) => {
            state.updatedEmailVerified = data.emailVerified;

            return {
              email: "test@example.com",
              emailVerified: data.emailVerified,
              id: "user_1",
            };
          },
        },
        verificationToken: {
          delete: async ({ where }) => {
            deletedToken = where.identifier_token.token;

            return {
              expires: new Date("2026-04-28T12:00:00.000Z"),
              identifier: "test@example.com",
              token: tokenHash,
            };
          },
          findUnique: async ({ where }) =>
            where.identifier_token.identifier === "test@example.com" &&
            where.identifier_token.token === tokenHash
              ? {
                  expires: new Date("2026-04-28T12:00:00.000Z"),
                  identifier: "test@example.com",
                  token: tokenHash,
                }
              : null,
        },
      },
      { now: () => now },
    );

    assert.deepEqual(result, { success: true, status: "verified" });
    if (!state.updatedEmailVerified) {
      throw new Error("emailVerified was not updated");
    }
    assert.equal(state.updatedEmailVerified.toISOString(), now.toISOString());
    assert.equal(deletedToken, tokenHash);
  });

  it("exposes a registration POST route", async () => {
    const routeModule = await import("../src/app/api/auth/register/route");

    assert.equal(typeof routeModule.POST, "function");
  });
});
