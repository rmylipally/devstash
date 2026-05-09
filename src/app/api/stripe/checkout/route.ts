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
  } catch {
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
    return NextResponse.json(
      {
        success: false,
        error: getValidationError(parsedInput.error),
      },
      { status: 400 },
    );
  }

  try {
    const stripe = getStripeClient();
    const stripePriceIds = getStripePriceIds();
    const user = await prisma.user.findUnique({
      select: {
        email: true,
        name: true,
        stripeCustomerId: true,
      },
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not find billing account. Try again.",
        },
        { status: 404 },
      );
    }

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId,
        },
        name: user.name ?? undefined,
      });
      customerId = customer.id;

      await prisma.user.update({
        data: {
          stripeCustomerId: customerId,
        },
        where: {
          id: userId,
        },
      });
    }

    const billingCycle = parsedInput.data.billingCycle as BillingCycle;
    const priceId = getPriceIdForCycle(billingCycle, stripePriceIds);
    const baseUrl = getAppBaseUrl();
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

    return NextResponse.json(
      {
        success: true,
        data: {
          url: checkoutSession.url,
        },
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Could not create Stripe checkout session. Try again.",
      },
      { status: 500 },
    );
  }
}
