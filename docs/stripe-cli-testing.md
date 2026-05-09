# Stripe CLI Testing

This checklist validates local billing behavior for checkout, customer portal, and webhooks.

## 1. Start local app

```bash
npm run dev
```

## 2. Forward Stripe webhooks

In a separate terminal:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret from the CLI output and set it in `.env`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 3. Trigger checkout from app

1. Sign in to DevStash.
2. Open `/settings`.
3. In Billing, select monthly or yearly.
4. Click Upgrade to Pro.
5. Complete checkout with Stripe test card details.

Expected result:

- The checkout session completes.
- Stripe sends `checkout.session.completed`.
- User plan is updated to `PRO`.

## 4. Validate portal flow

1. On `/settings`, click Manage subscription.
2. Confirm Stripe portal opens.
3. Return to app settings.

Expected result:

- The billing portal session is created successfully.

## 5. Validate cancellation/downgrade webhook

In Stripe dashboard or portal test mode, cancel the subscription.

Expected result:

- Stripe sends `customer.subscription.deleted`.
- User plan is updated to `FREE`.
- `stripeSubscriptionId` is cleared.

## 6. Verify free-tier gating

1. With a free account, create up to free-tier limits.
2. Attempt to create another item or collection.
3. Attempt to create file/image item on free plan.

Expected result:

- Limit error appears after free-tier maximum is reached.
- File/image creation is blocked on free plan.
