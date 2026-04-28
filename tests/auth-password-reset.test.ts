import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { compare } from "bcryptjs";
import { describe, it } from "vitest";

process.env.DATABASE_URL ??=
  "postgresql://devstash:devstash@localhost:5432/devstash";

describe("auth password reset", () => {
  it("creates a hashed password reset token for existing users and sends a reset email", async () => {
    const { requestPasswordReset } = await import(
      "../src/lib/auth/password-reset"
    );
    const now = new Date("2026-04-28T12:00:00.000Z");
    let deletedIdentifier = "";
    let savedIdentifier = "";
    let savedToken = "";
    let sentResetUrl = "";

    const result = await requestPasswordReset(
      { email: " TEST@example.com " },
      {
        user: {
          findUnique: async ({ where }) =>
            where.email === "test@example.com"
              ? {
                  email: "test@example.com",
                  name: "Test User",
                }
              : null,
        },
        verificationToken: {
          deleteMany: async ({ where }) => {
            deletedIdentifier = where.identifier;
            return { count: 1 };
          },
          create: async ({ data }) => {
            savedIdentifier = data.identifier;
            savedToken = data.token;
            return data;
          },
        },
      },
      {
        appUrl: "https://devstash.test",
        now: () => now,
        sendPasswordResetEmail: async ({ resetUrl }) => {
          sentResetUrl = resetUrl;
        },
        tokenGenerator: () => "raw-reset-token",
      },
    );

    assert.deepEqual(result, {
      success: true,
      status: 200,
      data: {
        message:
          "If an account exists for that email, we sent password reset instructions.",
      },
    });
    assert.equal(deletedIdentifier, "password-reset:test@example.com");
    assert.equal(savedIdentifier, "password-reset:test@example.com");
    assert.equal(
      savedToken,
      createHash("sha256").update("raw-reset-token").digest("hex"),
    );
    assert.equal(
      sentResetUrl,
      "https://devstash.test/reset-password?email=test%40example.com&token=raw-reset-token",
    );
  });

  it("does not reveal whether a password reset email matches an account", async () => {
    const { requestPasswordReset } = await import(
      "../src/lib/auth/password-reset"
    );
    let tokenWasCreated = false;
    let emailWasSent = false;

    const result = await requestPasswordReset(
      { email: "missing@example.com" },
      {
        user: {
          findUnique: async () => null,
        },
        verificationToken: {
          deleteMany: async () => {
            tokenWasCreated = true;
            return { count: 0 };
          },
          create: async ({ data }) => {
            tokenWasCreated = true;
            return data;
          },
        },
      },
      {
        sendPasswordResetEmail: async () => {
          emailWasSent = true;
        },
      },
    );

    assert.deepEqual(result, {
      success: true,
      status: 200,
      data: {
        message:
          "If an account exists for that email, we sent password reset instructions.",
      },
    });
    assert.equal(tokenWasCreated, false);
    assert.equal(emailWasSent, false);
  });

  it("updates the password with an unexpired reset token and consumes the token", async () => {
    const { resetPassword } = await import("../src/lib/auth/password-reset");
    const now = new Date("2026-04-28T12:00:00.000Z");
    const tokenHash = createHash("sha256").update("raw-reset-token").digest("hex");
    let savedPasswordHash = "";
    let deletedIdentifier = "";
    let deletedToken = "";

    const result = await resetPassword(
      {
        confirmPassword: "new-password",
        email: " TEST@example.com ",
        password: "new-password",
        token: "raw-reset-token",
      },
      {
        user: {
          update: async ({ data, where }) => {
            assert.equal(where.email, "test@example.com");
            savedPasswordHash = data.passwordHash;
            return { email: where.email, id: "user_1" };
          },
        },
        verificationToken: {
          delete: async ({ where }) => {
            deletedIdentifier = where.identifier_token.identifier;
            deletedToken = where.identifier_token.token;
            return {
              expires: new Date("2026-04-28T13:00:00.000Z"),
              identifier: "password-reset:test@example.com",
              token: tokenHash,
            };
          },
          findUnique: async ({ where }) =>
            where.identifier_token.identifier ===
              "password-reset:test@example.com" &&
            where.identifier_token.token === tokenHash
              ? {
                  expires: new Date("2026-04-28T13:00:00.000Z"),
                  identifier: "password-reset:test@example.com",
                  token: tokenHash,
                }
              : null,
        },
      },
      {
        now: () => now,
        passwordHashRounds: 4,
      },
    );

    assert.deepEqual(result, { success: true, status: 200 });
    assert.equal(await compare("new-password", savedPasswordHash), true);
    assert.equal(deletedIdentifier, "password-reset:test@example.com");
    assert.equal(deletedToken, tokenHash);
  });

  it("rejects expired reset tokens and deletes them", async () => {
    const { resetPassword } = await import("../src/lib/auth/password-reset");
    const now = new Date("2026-04-28T12:00:00.000Z");
    const tokenHash = createHash("sha256").update("raw-reset-token").digest("hex");
    let tokenWasDeleted = false;

    const result = await resetPassword(
      {
        confirmPassword: "new-password",
        email: "test@example.com",
        password: "new-password",
        token: "raw-reset-token",
      },
      {
        user: {
          update: async () => {
            throw new Error("user should not be updated");
          },
        },
        verificationToken: {
          delete: async () => {
            tokenWasDeleted = true;
            return {
              expires: new Date("2026-04-28T11:59:00.000Z"),
              identifier: "password-reset:test@example.com",
              token: tokenHash,
            };
          },
          findUnique: async () => ({
            expires: new Date("2026-04-28T11:59:00.000Z"),
            identifier: "password-reset:test@example.com",
            token: tokenHash,
          }),
        },
      },
      {
        now: () => now,
        passwordHashRounds: 4,
      },
    );

    assert.deepEqual(result, {
      success: false,
      status: 400,
      error: "Password reset link expired.",
    });
    assert.equal(tokenWasDeleted, true);
  });

  it("exposes password reset API routes", async () => {
    const [forgotPasswordRoute, resetPasswordRoute] = await Promise.all([
      import("../src/app/api/auth/forgot-password/route"),
      import("../src/app/api/auth/reset-password/route"),
    ]);

    assert.equal(typeof forgotPasswordRoute.POST, "function");
    assert.equal(typeof resetPasswordRoute.POST, "function");
  });
});
