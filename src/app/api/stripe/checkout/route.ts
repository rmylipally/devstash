import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { getAppBaseUrl, getPriceIdForCycle, type BillingCycle } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { getStripeClient, getStripePriceIds } from "@/lib/stripe";

const checkoutInputSchema = z.object({
  billingCycle: z.enum(["monthly", "yearly"]),
});

function getValidationError(error: z.ZodError) {
  return error.issues.map((issue) => issue.message).join(" ");
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        error: "You must be signed in to manage billing.",
      },
      { status: 401 },
    );
  }

  let input: unknown;

  try {
    input = await request.json();
  } catch (error) {
    console.error("[checkout] Failed to parse JSON body:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Invalid JSON body.",
      },
      { status: 400 },
    );
  }

  const parsedInput = checkoutInputSchema.safeParse(input);

  if (!parsedInput.success) {
    console.error("[checkout] Input validation failed:", parsedInput.error.issues);
    return NextResponse.json(
      {
        success: false,
        error: getValidationError(parsedInput.error),
      },
      { status: 400 },
    );
  }

  try {
    console.log("[checkout] Starting checkout for user:", userId);
    const stripe = getStripeClient();
    const stripePriceIds = getStripePriceIds();
    
    console.log("[checkout] Price IDs:", stripePriceIds);

    const user = await prisma.user.findUnique({
      select: {
        email: true,
        name: true,
        stripeCustomerId: true,
      },
      where: { id: userId },
    });

    if (!user) {
      console.error("[checkout] User not found:", userId);
      return NextResponse.json(
        {
          success: false,
          error: "Could not find billing account. Try again.",
        },
        { status: 404 },
      );
    }

    console.log("[checkout] Found user:", { email: user.email, hasCustomerId: !!user.stripeCustomerId });

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      console.log("[checkout] Creating Stripe customer for user:", userId);
      try {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            userId,
          },
          name: user.name ?? undefined,
        });
        customerId = customer.id;
        console.log("[checkout] Created Stripe customer:", customerId);

        await prisma.user.update({
          data: {
            stripeCustomerId: customerId,
          },
          where: {
            id: userId,
          },
        });
        console.log("[checkout] Saved customer ID to database");
      } catch (error) {
        console.error("[checkout] Failed to create Stripe customer:", error);
        throw error;
      }
    }

    const billingCycle = parsedInput.data.billingCycle as BillingCycle;
    const priceId = getPriceIdForCycle(billingCycle, stripePriceIds);
    
    if (!priceId) {
      console.error("[checkout] Could not find price ID for billing cycle:", billingCycle, stripePriceIds);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid billing cycle. Try again.",
        },
        { status: 400 },
      );
    }

    console.log("[checkout] Using price ID:", priceId, "for billing cycle:", billingCycle);

    const baseUrl = getAppBaseUrl();
    console.log("[checkout] Base URL:", baseUrl);

    try {
      const checkoutSession = await stripe.checkout.sessions.create({
        cancel_url: `${baseUrl}/settings?billing=cancelled`,
        client_reference_id: userId,
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        metadata: {
          billingCycle,
          userId,
        },
        mode: "subscription",
        success_url: `${baseUrl}/settings?billing=success`,
      });

      console.log("[checkout] Created checkout session:", checkoutSession.id, "URL:", !!checkoutSession.url);

      return NextResponse.json(
        {
          success: true,
          data: {
            url: checkoutSession.url,
          },
        },
        { status: 200 },
      );
    } catch (error) {
      console.error("[checkout] Failed to create Stripe checkout session:", error);
      throw error;
    }
  } catch (error) {
    console.error("[checkout] Unexpected error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      {
        success: false,
        error: "Could not create Stripe checkout session. Try again.",
      },
      { status: 500 },
    );
  }
}
