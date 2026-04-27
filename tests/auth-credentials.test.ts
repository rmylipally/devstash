import assert from "node:assert/strict";
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
      },
      { passwordHashRounds: 4 },
    );

    assert.equal(await compare("password123", savedPasswordHash), true);
    assert.notEqual(savedPasswordHash, "password123");
    assert.deepEqual(result, {
      success: true,
      status: 201,
      data: {
        user: {
          id: "user_1",
          email: "test@example.com",
          name: "Test User",
        },
      },
    });
  });

  it("exposes a registration POST route", async () => {
    const routeModule = await import("../src/app/api/auth/register/route");

    assert.equal(typeof routeModule.POST, "function");
  });
});
