# Stripe Integration Plan

## Goal

Add Stripe subscriptions for DevStash Pro with:

- Monthly: $8 (`month`)
- Yearly: $72 (`year`)

while keeping the app architecture aligned with existing patterns in this repository.

## Current State Analysis

### 1) User billing fields in schema

Observed in `prisma/schema.prisma`:

- `User.plan` (`PlanTier`, default `FREE`)
- `User.stripeCustomerId` (`String?`, unique)
- `User.stripeSubscriptionId` (`String?`, unique)

Important note: this codebase currently tracks subscription status via `plan` on `User` (enum `FREE | PRO`), not `isPro` on `User`.

`isPro` currently exists on `ItemType` (`ItemType.isPro`) and is used for type-level metadata/badging.

### 2) NextAuth/session handling

Observed in `src/auth.ts` and `src/types/next-auth.d.ts`:

- Session strategy is JWT.
- Session callback currently sets only `session.user.id` from `token.sub`.
- Session type augmentation currently only includes `user.id`.

Observed implication:

- Plan information is not currently in token/session.
- UI commonly falls back to `currentUser.plan` from mock data instead of real DB-backed plan.

### 3) How user data is accessed today

Common pattern in server actions/API routes/components:

- Read current user via `auth()`.
- Use `session.user.id` for user-scoped DB operations.
- Return structured result objects for server actions (`{ success, data? | error? }`).
- API routes return `NextResponse.json(...)` with `success` and optional `data`/`error`.

Observed examples:

- `src/actions/items.ts` uses `auth()` + validated input + structured errors.
- `src/app/api/collections/route.ts` uses auth guard + Zod parse + `NextResponse.json`.
- `src/app/api/auth/register/route.ts` and `src/app/api/auth/resend-verification/route.ts` show similar error/status conventions.

### 4) Existing billing/payment code

Observed:

- Stripe-related fields exist in schema only.
- No Stripe SDK usage yet.
- No Stripe checkout/portal/webhook API routes yet.
- No billing UI on settings page yet.

## Feature Gating Analysis

### 1) Free tier limits from spec

From project context/docs:

- Free: 50 items total
- Free: 3 collections
- Pro: unlimited

### 2) Where limits are checked (or should be checked)

Observed helpers available:

- `src/lib/db/items.ts`: item counts/stats helpers
- `src/lib/db/collections.ts`: collection counts/stats helpers

Observed creation entry points to enforce limits:

- Item create path: `src/actions/items.ts` -> `createItem(...)`
- Collection create path: `src/app/api/collections/route.ts` -> `createCollection(...)`

Recommendation:

- Enforce limit checks in server-side creation entry points before DB create.
- Keep checks user-scoped by `session.user.id`.
- Return existing error-response style when limit reached.

### 3) Pro-only features to gate

Based on product docs and current codebase state:

- File/image uploads (already implemented in upload/item flows): gate for Pro.
- AI features (supported by `AiJob` model and future AI actions): gate for Pro.
- Custom types (model exists, feature expected): gate for Pro.
- Export (planned feature): gate for Pro.

### 4) Settings page integration point

Observed in `src/app/settings/page.tsx`:

- Settings currently renders account/security/editor preferences sections inside `DashboardFrame`.
- It is the best place to add Billing section:
  - Current plan
  - Upgrade/manage subscription actions
  - Renewal/cancel status messaging

## API/Webhook Pattern Alignment

### 1) API route structure

Use existing route conventions:

- Auth guard first (`auth()` + 401 JSON on missing session)
- Parse request body safely
- Validate with Zod when body exists
- Return consistent JSON:
  - success path: `{ success: true, data: ... }`
  - error path: `{ success: false, error: "..." }`
- Proper status codes: 200/201/400/401/500 as applicable

### 2) Server action structure

Use existing server-action conventions:

- Keep actions in `src/actions/*` with `"use server"`
- Validate input with Zod
- Wrap DB and external calls in try/catch
- Return discriminated union results

### 3) Environment variable patterns

Observed style from README + existing integrations:

- Uppercase env names
- Fail fast with explicit errors when critical vars missing
- Optional vars have clear defaults where safe

Recommended Stripe env vars:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_PRO_YEARLY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL` (already used in auth email helpers; reuse pattern)

## Complete Implementation Plan

## Files To Create (with code examples)

### 1) `src/lib/stripe.ts`

Purpose:

- Centralize Stripe client initialization.
- Validate required Stripe env vars once.

Example:

```ts
import Stripe from "stripe";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

export const stripe = new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
  apiVersion: "2025-06-30.basil",
});

export const stripePriceIds = {
  proMonthly: requireEnv("STRIPE_PRICE_PRO_MONTHLY"),
  proYearly: requireEnv("STRIPE_PRICE_PRO_YEARLY"),
};
```

### 2) `src/lib/billing.ts`

Purpose:

- Share billing helpers (`isProPlan`, checkout mode mapping, customer lookup/update).

Example:

```ts
import { PlanTier } from "@/generated/prisma/enums";

export function isProPlan(plan: PlanTier | null | undefined): boolean {
  return plan === PlanTier.PRO;
}
```

### 3) `src/app/api/stripe/checkout/route.ts`

Purpose:

- Create Stripe Checkout Session for authenticated user.
- Ensure customer exists and metadata includes user id.

Example flow:

- Verify session user.
- Parse `billingCycle` (`"monthly" | "yearly"`).
- Load/create Stripe customer and persist `stripeCustomerId` on user.
- Create checkout session with:
  - `mode: "subscription"`
  - one line item (`price` from env)
  - `success_url` + `cancel_url`
  - `client_reference_id` and metadata containing `userId`
- Return `{ success: true, data: { url } }`.

### 4) `src/app/api/stripe/portal/route.ts`

Purpose:

- Create Stripe customer portal session for existing subscriber.

Example flow:

- Verify session user.
- Fetch user + `stripeCustomerId`.
- Create portal session using `return_url` to settings.
- Return portal URL JSON.

### 5) `src/app/api/stripe/webhook/route.ts`

Purpose:

- Receive Stripe webhook events and update `User.plan` plus subscription ids.

Example flow:

- Read raw body (`await request.text()`).
- Verify signature using `STRIPE_WEBHOOK_SECRET` and `stripe.webhooks.constructEvent`.
- Handle at minimum:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- Map active/trialing to `PlanTier.PRO`, canceled/unpaid/etc to `PlanTier.FREE`.
- Update user by `stripeCustomerId` (or `metadata.userId` fallback).
- Return `200` JSON receipt.

### 6) `src/components/profile/BillingSettingsCard.tsx`

Purpose:

- Add billing UI section in settings:
  - show current plan
  - show monthly/yearly selection for upgrade
  - buttons for upgrade/manage

Behavior:

- If Free: call checkout endpoint and redirect to checkout URL.
- If Pro: open customer portal.

### 7) `tests/stripe-checkout-route.test.ts`

Purpose:

- Cover auth guard, input validation, successful checkout URL response.

### 8) `tests/stripe-portal-route.test.ts`

Purpose:

- Cover missing customer and successful portal URL response.

### 9) `tests/stripe-webhook-route.test.ts`

Purpose:

- Cover signature failure and plan transitions (PRO/FREE) for core events.

## Files To Modify (specific changes)

### 1) `src/auth.ts`

Change:

- Add `jwt` callback that always syncs plan from DB per token validation using `token.sub`.
- Add `session` callback assignment for `session.user.plan`.

Why:

- Ensures webhook-driven plan updates are reflected in sessions after reload.
- Avoids stale plan states from long-lived JWT claims.

Note:

- The research prompt references syncing `isPro`; adapt this to sync `plan` in this codebase.

### 2) `src/types/next-auth.d.ts`

Change:

- Extend `Session.user` with `plan` (`"FREE" | "PRO"` or mapped app-level lowercase type).
- Optionally extend JWT type to include `plan`.

### 3) `src/components/dashboard/DashboardShell.tsx`

Change:

- Stop using `currentUser.plan` fallback for real user plan.
- Use session-derived plan (backed by DB sync in auth callback).

### 4) `src/app/settings/page.tsx`

Change:

- Replace `currentUser.plan` usage with real session/profile plan.
- Insert `BillingSettingsCard` section.

### 5) Pages currently deriving plan from mock data

Observed examples to align with real plan source:

- `src/app/profile/page.tsx`
- `src/app/collections/page.tsx`
- `src/app/collections/[slug]/page.tsx`
- `src/app/items/[type]/page.tsx`
- `src/app/favorites/page.tsx`

Change:

- Remove `currentUser.plan` coupling and use authenticated/session-backed plan.

### 6) `src/actions/items.ts`

Change:

- Before item create, enforce free tier item limit (50) unless plan is Pro.
- Reject file/image creation for Free users with explicit upgrade message.

### 7) `src/app/api/collections/route.ts`

Change:

- Before creating collection, enforce free tier collection limit (3) unless Pro.

### 8) `README.md`

Change:

- Add Stripe env vars under required configuration.
- Add local Stripe webhook testing steps.

## Stripe Dashboard Setup Steps

1. Create product: `DevStash Pro`.
2. Create recurring prices:
   - Monthly: $8.00 / month
   - Yearly: $72.00 / year
3. Copy both `price_...` ids into env:
   - `STRIPE_PRICE_PRO_MONTHLY`
   - `STRIPE_PRICE_PRO_YEARLY`
4. Configure webhook endpoint:
   - URL: `${NEXT_PUBLIC_APP_URL}/api/stripe/webhook` (or local tunnel URL)
5. Subscribe webhook to events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
6. Save signing secret to `STRIPE_WEBHOOK_SECRET`.
7. Enable Customer Portal in Stripe dashboard for subscription management.
8. Validate success/cancel URLs target settings page.

## Testing Checklist

### Unit/API tests

- Checkout route:
  - 401 when unauthenticated
  - 400 for invalid billing cycle
  - 200 with checkout URL for valid request
- Portal route:
  - 401 when unauthenticated
  - 400/404 style error when no customer id exists
  - 200 with portal URL when customer exists
- Webhook route:
  - 400 on invalid signature
  - PRO assignment on completed/active subscription events
  - FREE downgrade on subscription deleted/canceled states

### Integration behaviors

- Free user at 50 items cannot create item 51.
- Free user at 3 collections cannot create collection 4.
- Free user blocked from file/image creation.
- Successful checkout upgrades user to Pro after webhook.
- Reload shows Pro plan in session-driven UI.
- Manage subscription opens customer portal.
- Cancel/downgrade webhook returns user to Free and limits reapply.

### Regression checks

- Auth flows still pass (register/sign-in/reset/verification).
- Existing item and collection create/edit/delete flows unaffected for Pro users.
- Settings/profile/dashboard pages render with updated session typing.

## Recommended Implementation Order

1. Add Stripe env vars and `src/lib/stripe.ts` client helper.
2. Implement webhook endpoint first (`/api/stripe/webhook`) and DB plan transitions.
3. Implement NextAuth JWT/session plan sync (`src/auth.ts`, `src/types/next-auth.d.ts`).
4. Implement checkout endpoint (`/api/stripe/checkout`).
5. Implement portal endpoint (`/api/stripe/portal`).
6. Build settings billing UI card and wire upgrade/manage actions.
7. Replace remaining `currentUser.plan` usages with session-backed plan.
8. Add free-tier enforcement in item/collection creation paths.
9. Add tests for Stripe routes and plan-gating logic.
10. Run full lint/test/build and verify local webhook flow with Stripe CLI.

## Risks, Gaps, and Decisions To Confirm

- Schema terminology mismatch: prompt references `isPro` on user, but current schema uses `plan`. Recommendation is to standardize on `plan`.
- Session freshness strategy: DB query in JWT callback adds a small per-validation read, but provides reliable post-webhook consistency.
- Existing UI currently relies on mock plan fallback in several pages; this should be removed to prevent inconsistent gating.
- AI/custom-type/export gating should be enforced when those feature entry points are implemented; file/image and item/collection limits can be enforced immediately.
