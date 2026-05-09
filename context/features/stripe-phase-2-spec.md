# Stripe Integration - Phase 2 (Webhooks, Feature Gating, and UI)

## Overview

Complete the Stripe integration by adding webhook-driven subscription state updates, enforcing free/pro feature gates in production paths, and shipping billing UI flows that can be verified with Stripe CLI event forwarding.

## Requirements

- Add Stripe webhook endpoint with signature verification
- Process subscription lifecycle events and persist plan/customer/subscription updates
- Enforce free-tier limits and Pro-only behavior in create flows
- Gate Pro-only capabilities (files/images, AI, custom types, export entry points)
- Build billing UI components for upgrade/manage states
- Add integration tests and manual test scripts that rely on Stripe CLI

## Scope

### In Scope

- Webhook route and event handlers
- DB updates to User.plan, stripeCustomerId, stripeSubscriptionId
- Feature gating in server actions/API routes
- Billing UI components and settings integration
- Stripe CLI validation workflow and QA checklist

### Out of Scope

- Advanced analytics/reporting for revenue metrics
- Multi-product pricing beyond current Pro monthly/yearly plans
- Coupon/promotion-code lifecycle

## Files to Create

1. src/app/api/stripe/webhook/route.ts
2. src/components/profile/BillingSettingsCard.tsx
3. tests/stripe-webhook-route.test.ts
4. tests/billing-gating.test.ts
5. docs/stripe-cli-testing.md

## Files to Modify

1. src/actions/items.ts
2. src/app/api/collections/route.ts
3. src/app/settings/page.tsx
4. src/components/dashboard/DashboardShell.tsx
5. src/app/profile/page.tsx
6. src/app/collections/page.tsx
7. src/app/collections/[slug]/page.tsx
8. src/app/items/[type]/page.tsx
9. src/app/favorites/page.tsx
10. README.md

## Implementation Details

### Webhooks

Implement verified webhook handling in src/app/api/stripe/webhook/route.ts:

- Parse raw request body
- Validate signature using STRIPE_WEBHOOK_SECRET
- Handle key events:
  - checkout.session.completed
  - customer.subscription.updated
  - customer.subscription.deleted
- Map Stripe subscription status to User.plan:
  - active/trialing => PRO
  - canceled/incomplete_expired/unpaid => FREE
- Persist stripeCustomerId and stripeSubscriptionId when available

Error handling:

- Invalid signature returns 400
- Unknown events return 200 acknowledgment without failure
- Handler logic must be idempotent for repeated webhook deliveries

### Feature Gating Integration

Use src/lib/usage-limits.ts from Phase 1 in real entry points:

- In src/actions/items.ts:
  - enforce item count cap for FREE
  - block file/image creation for FREE
- In src/app/api/collections/route.ts:
  - enforce collection cap for FREE
- For planned/available Pro-only actions:
  - AI action entry points
  - custom-type mutation entry points
  - export entry points

All gated failures must return clear upgrade-oriented errors consistent with current action/route response patterns.

### UI Components

Create BillingSettingsCard with:

- Current plan display
- Monthly/yearly selector for upgrade
- Upgrade button (checkout)
- Manage subscription button (portal) for Pro users
- Loading and error states

Integrate into settings page without breaking existing account/security/editor sections.

Remove or minimize mock-plan fallback usage where billing state is shown, using session-backed plan after webhook updates.

## Stripe CLI Testing (Required in Phase 2)

Phase 2 validation must include Stripe CLI-dependent scenarios.

### Required Setup

- Install Stripe CLI
- Authenticate Stripe CLI locally
- Forward events to local webhook endpoint
- Configure STRIPE_WEBHOOK_SECRET from Stripe CLI output

### Required Manual Test Scenarios

1. Trigger checkout completion event and verify upgrade to PRO
2. Trigger subscription updated event and verify plan sync remains PRO
3. Trigger subscription deleted event and verify downgrade to FREE
4. Refresh UI and verify billing components show correct state
5. Verify gated create flows react correctly after downgrade

Add these instructions to docs/stripe-cli-testing.md and summarize in README.md.

## Testing

### Automated

- Webhook route tests
  - signature validation failure
  - event-type handling and plan transitions
  - idempotent repeated event handling
- Gating tests
  - FREE blocked at item/collection limits
  - FREE blocked for file/image creation
  - PRO allowed for gated operations
- Existing suite regression run

### Manual (Stripe CLI)

- End-to-end event-forwarding verification
- UI state transitions after event processing
- Post-downgrade behavior checks for enforced limits

## Environment Variables

Ensure docs include:

- STRIPE_WEBHOOK_SECRET (required in Phase 2)
- STRIPE_SECRET_KEY
- STRIPE_PRICE_PRO_MONTHLY
- STRIPE_PRICE_PRO_YEARLY
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- NEXT_PUBLIC_APP_URL

## Acceptance Criteria

- Webhook endpoint is live, verified, and updates User plan/subscription fields correctly
- Feature gating is enforced in item and collection create paths
- Billing UI supports upgrade and manage flows
- Stripe CLI workflow is documented and validated against local app
- Automated tests for webhook and gating pass
- Manual Stripe CLI scenarios pass and are reproducible

## Implementation Order

1. Build webhook route with tests
2. Wire plan/subscription persistence logic
3. Integrate usage-limits helpers into create paths
4. Add BillingSettingsCard and settings integration
5. Remove mock-plan dependencies from billing-sensitive pages
6. Add Stripe CLI testing documentation
7. Run full regression tests + manual Stripe CLI checklist

## References

- docs/stripe-integration-plan.md
- context/project-overview.md
- context/features/stripe-phase-1-spec.md
