import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getAppBaseUrl } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";

export async function POST(): Promise<NextResponse> {
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

  try {
    const stripe = getStripeClient();
    const user = await prisma.user.findUnique({
      select: {
        stripeCustomerId: true,
      },
      where: {
        id: userId,
      },
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        {
          success: false,
          error: "No Stripe customer is linked to this account.",
        },
        { status: 400 },
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${getAppBaseUrl()}/settings`,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          url: portalSession.url,
        },
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Could not create Stripe portal session. Try again.",
      },
      { status: 500 },
    );
  }
}
