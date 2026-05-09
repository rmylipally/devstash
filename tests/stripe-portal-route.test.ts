import assert from "node:assert/strict";
import { beforeEach, describe, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  portalCreate: vi.fn(),
  userFindUnique: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
    },
  },
}));

vi.mock("@/lib/stripe", () => ({
  getStripeClient: () => ({
    billingPortal: {
      sessions: {
        create: mocks.portalCreate,
      },
    },
  }),
}));

const { POST } = await import("../src/app/api/stripe/portal/route");

describe("stripe portal route", () => {
  beforeEach(() => {
    mocks.auth.mockReset();
    mocks.portalCreate.mockReset();
    mocks.userFindUnique.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mocks.auth.mockResolvedValue(null);

    const response = await POST();

    assert.equal(response.status, 401);
  });

  it("rejects accounts without Stripe customer id", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-123" } });
    mocks.userFindUnique.mockResolvedValue({ stripeCustomerId: null });

    const response = await POST();
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(body, {
      success: false,
      error: "No Stripe customer is linked to this account.",
    });
    assert.equal(mocks.portalCreate.mock.calls.length, 0);
  });

  it("creates portal url for signed-in users", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://devstash.test";
    mocks.auth.mockResolvedValue({ user: { id: "user-123" } });
    mocks.userFindUnique.mockResolvedValue({ stripeCustomerId: "cus_123" });
    mocks.portalCreate.mockResolvedValue({
      url: "https://billing.stripe.com/session/test_123",
    });

    const response = await POST();
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, {
      success: true,
      data: {
        url: "https://billing.stripe.com/session/test_123",
      },
    });
    assert.deepEqual(mocks.portalCreate.mock.calls[0]?.[0], {
      customer: "cus_123",
      return_url: "https://devstash.test/settings",
    });
  });
});
