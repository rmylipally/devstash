import assert from "node:assert/strict";
import { beforeEach, describe, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  checkoutCreate: vi.fn(),
  customerCreate: vi.fn(),
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
      update: mocks.userUpdate,
    },
  },
}));

vi.mock("@/lib/stripe", () => ({
  getStripeClient: () => ({
    checkout: {
      sessions: {
        create: mocks.checkoutCreate,
      },
    },
    customers: {
      create: mocks.customerCreate,
    },
  }),
  getStripePriceIds: () => ({
    proMonthly: "price_monthly",
    proYearly: "price_yearly",
  }),
}));

const { POST } = await import("../src/app/api/stripe/checkout/route");

describe("stripe checkout route", () => {
  beforeEach(() => {
    mocks.auth.mockReset();
    mocks.checkoutCreate.mockReset();
    mocks.customerCreate.mockReset();
    mocks.userFindUnique.mockReset();
    mocks.userUpdate.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mocks.auth.mockResolvedValue(null);

    const response = await POST(
      new Request("https://devstash.test/api/stripe/checkout", {
        body: JSON.stringify({ billingCycle: "monthly" }),
        method: "POST",
      }),
    );

    assert.equal(response.status, 401);
  });

  it("validates billing cycle input", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-123" } });

    const response = await POST(
      new Request("https://devstash.test/api/stripe/checkout", {
        body: JSON.stringify({ billingCycle: "weekly" }),
        method: "POST",
      }),
    );
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.match(body.error, /Invalid option/);
  });

  it("creates checkout url for signed-in users", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://devstash.test";
    mocks.auth.mockResolvedValue({ user: { id: "user-123" } });
    mocks.userFindUnique.mockResolvedValue({
      email: "demo@devstash.io",
      name: "Demo User",
      stripeCustomerId: "cus_123",
    });
    mocks.checkoutCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/pay/cs_test_123",
    });

    const response = await POST(
      new Request("https://devstash.test/api/stripe/checkout", {
        body: JSON.stringify({ billingCycle: "yearly" }),
        method: "POST",
      }),
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, {
      success: true,
      data: {
        url: "https://checkout.stripe.com/pay/cs_test_123",
      },
    });
    assert.deepEqual(mocks.checkoutCreate.mock.calls[0]?.[0], {
      cancel_url: "https://devstash.test/settings?billing=cancelled",
      client_reference_id: "user-123",
      customer: "cus_123",
      line_items: [{ price: "price_yearly", quantity: 1 }],
      metadata: {
        billingCycle: "yearly",
        userId: "user-123",
      },
      mode: "subscription",
      success_url: "https://devstash.test/settings?billing=success",
    });
  });
});
