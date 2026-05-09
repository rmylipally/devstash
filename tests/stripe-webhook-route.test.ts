import assert from "node:assert/strict";
import { beforeEach, describe, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  getStripeClient: () => ({
    webhooks: {
      constructEvent: mocks.constructEvent,
    },
  }),
  getStripeWebhookSecret: () => "whsec_test",
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
      update: mocks.userUpdate,
    },
  },
}));

const { POST } = await import("../src/app/api/stripe/webhook/route");

describe("stripe webhook route", () => {
  beforeEach(() => {
    mocks.constructEvent.mockReset();
    mocks.userFindUnique.mockReset();
    mocks.userUpdate.mockReset();
  });

  it("rejects requests without stripe signature", async () => {
    const response = await POST(
      new Request("https://devstash.test/api/stripe/webhook", {
        body: "{}",
        method: "POST",
      }),
    );

    assert.equal(response.status, 400);
    assert.equal(mocks.constructEvent.mock.calls.length, 0);
  });

  it("processes checkout completion and upgrades user", async () => {
    mocks.constructEvent.mockReturnValue({
      data: {
        object: {
          customer: "cus_123",
          metadata: {
            userId: "user-123",
          },
          subscription: "sub_123",
        },
      },
      type: "checkout.session.completed",
    });

    const response = await POST(
      new Request("https://devstash.test/api/stripe/webhook", {
        body: JSON.stringify({ id: "evt_123" }),
        headers: {
          "stripe-signature": "test-signature",
        },
        method: "POST",
      }),
    );

    assert.equal(response.status, 200);
    assert.deepEqual(mocks.userUpdate.mock.calls[0]?.[0], {
      data: {
        plan: "PRO",
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
      },
      where: {
        id: "user-123",
      },
    });
  });

  it("processes subscription deletion and downgrades account", async () => {
    mocks.constructEvent.mockReturnValue({
      data: {
        object: {
          customer: "cus_123",
          id: "sub_123",
          status: "canceled",
        },
      },
      type: "customer.subscription.deleted",
    });
    mocks.userFindUnique.mockResolvedValue({
      id: "user-123",
    });

    const response = await POST(
      new Request("https://devstash.test/api/stripe/webhook", {
        body: JSON.stringify({ id: "evt_123" }),
        headers: {
          "stripe-signature": "test-signature",
        },
        method: "POST",
      }),
    );

    assert.equal(response.status, 200);
    assert.deepEqual(mocks.userUpdate.mock.calls[0]?.[0], {
      data: {
        plan: "FREE",
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: null,
      },
      where: {
        id: "user-123",
      },
    });
  });
});
