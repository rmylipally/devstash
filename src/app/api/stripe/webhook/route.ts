import { NextResponse } from "next/server";
import Stripe from "stripe";

import { PlanTier } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import {
  getStripeClient,
  getStripeWebhookSecret,
} from "@/lib/stripe";

function getPlanFromSubscriptionStatus(status: Stripe.Subscription.Status): PlanTier {
  if (status === "active" || status === "trialing") {
    return PlanTier.PRO;
  }

  return PlanTier.FREE;
}

async function updateUserById({
  userId,
  plan,
  stripeCustomerId,
  stripeSubscriptionId,
}: {
  plan: PlanTier;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  userId: string;
}) {
  await prisma.user.update({
    data: {
      plan,
      stripeCustomerId,
      stripeSubscriptionId,
    },
    where: {
      id: userId,
    },
  });
}

async function updateUserByStripeCustomerId({
  stripeCustomerId,
  plan,
  stripeSubscriptionId,
}: {
  plan: PlanTier;
  stripeCustomerId: string;
  stripeSubscriptionId?: string | null;
}) {
  const user = await prisma.user.findUnique({
    select: {
      id: true,
    },
    where: {
      stripeCustomerId,
    },
  });

  if (!user) {
    return;
  }

  await updateUserById({
    userId: user.id,
    plan,
    stripeCustomerId,
    stripeSubscriptionId,
  });
}

async function handleCheckoutCompleted(event: Stripe.CheckoutSessionCompletedEvent) {
  const checkoutSession = event.data.object;
  const stripeCustomerId =
    typeof checkoutSession.customer === "string"
      ? checkoutSession.customer
      : checkoutSession.customer?.id;
  const stripeSubscriptionId =
    typeof checkoutSession.subscription === "string"
      ? checkoutSession.subscription
      : checkoutSession.subscription?.id;
  const metadataUserId = checkoutSession.metadata?.userId;

  if (metadataUserId) {
    await updateUserById({
      userId: metadataUserId,
      plan: PlanTier.PRO,
      stripeCustomerId: stripeCustomerId ?? null,
      stripeSubscriptionId: stripeSubscriptionId ?? null,
    });
    return;
  }

  if (stripeCustomerId) {
    await updateUserByStripeCustomerId({
      plan: PlanTier.PRO,
      stripeCustomerId,
      stripeSubscriptionId: stripeSubscriptionId ?? null,
    });
  }
}

async function handleSubscriptionUpdate(
  event:
    | Stripe.CustomerSubscriptionUpdatedEvent
    | Stripe.CustomerSubscriptionDeletedEvent,
) {
  const subscription = event.data.object;
  const stripeCustomerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;
  const plan = getPlanFromSubscriptionStatus(subscription.status);

  await updateUserByStripeCustomerId({
    plan,
    stripeCustomerId,
    stripeSubscriptionId:
      event.type === "customer.subscription.deleted" ? null : subscription.id,
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing Stripe signature header.",
      },
      { status: 400 },
    );
  }

  const body = await request.text();

  let event: Stripe.Event;

  try {
    event = getStripeClient().webhooks.constructEvent(
      body,
      signature,
      getStripeWebhookSecret(),
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid Stripe webhook signature.",
      },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutCompleted(event as Stripe.CheckoutSessionCompletedEvent);
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await handleSubscriptionUpdate(
          event as
            | Stripe.CustomerSubscriptionUpdatedEvent
            | Stripe.CustomerSubscriptionDeletedEvent,
        );
        break;
      }
      default:
        break;
    }

    return NextResponse.json({
      received: true,
      success: true,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Could not process Stripe webhook event.",
      },
      { status: 500 },
    );
  }
}
