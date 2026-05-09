# Stripe Integration - Phase 1 (Core Infrastructure)

## Overview

Build the Stripe billing foundation and plan-state infrastructure without enabling full product gating yet. This phase sets up Stripe SDK wiring, checkout/portal endpoints, authenticated billing entry points, and session plan sync.

This phase must also introduce a reusable usage-limits module with unit tests.

## Requirements

- Install and configure Stripe SDK for server-side usage
- Add billing environment variables and startup-safe env validation helpers
- Create Stripe checkout endpoint for monthly/yearly Pro plans
- Create Stripe customer portal endpoint for existing subscribers
- Add auth/session plan propagation so UI can read real user plan (FREE/PRO)
- Add shared billing helpers for plan and billing-cycle behavior
- Add shared usage-limits module for free-tier limits
- Add unit tests for usage-limits module

## Scope

### In Scope

- Core billing libraries/utilities
- Checkout session creation
- Portal session creation
- Session typing and plan sync plumbing
- Usage-limits module + unit tests
- Basic settings-page billing entry wiring (button/action shell only)

### Out of Scope

- Webhook event processing
- Enforcement in item/collection creation flows
- Pro-only feature gating in business logic
- Final billing UI polish and end-to-end Stripe CLI scenarios

## Files to Create

1. src/lib/stripe.ts
2. src/lib/billing.ts
3. src/lib/usage-limits.ts
4. src/app/api/stripe/checkout/route.ts
5. src/app/api/stripe/portal/route.ts
6. tests/usage-limits.test.ts
7. tests/stripe-checkout-route.test.ts
8. tests/stripe-portal-route.test.ts

## Files to Modify

1. src/auth.ts
2. src/types/next-auth.d.ts
3. src/app/settings/page.tsx
4. README.md

## Implementation Details

### Billing Core

- Centralize Stripe client initialization in src/lib/stripe.ts
- Expose strict env readers for:
  - STRIPE_SECRET_KEY
  - STRIPE_PRICE_PRO_MONTHLY
  - STRIPE_PRICE_PRO_YEARLY
- Keep API route responses aligned with existing repository patterns:
  - success payload: success true + data
  - error payload: success false + error

### Session Plan Sync

- Extend session type to include user.plan
- Update auth callbacks to ensure session reflects DB-backed plan state
- Avoid mock-plan fallback for billing-aware UI paths introduced in this phase

### Usage Limits Module

Define explicit free-tier constants and pure helpers in src/lib/usage-limits.ts:

- FREE_TIER_MAX_ITEMS = 50
- FREE_TIER_MAX_COLLECTIONS = 3
- Helper for item-creation eligibility from plan + current count
- Helper for collection-creation eligibility from plan + current count
- Helper for whether file/image kinds require Pro

Return structured result shapes from helper functions so they are reusable in server actions/routes in Phase 2.

## Unit Testing (Required)

Create tests/usage-limits.test.ts with complete unit coverage for:

1. Free user below limits can create items/collections
2. Free user at exact limits is blocked
3. Pro user bypasses limits
4. File/image Pro requirement logic
5. Edge cases (negative counts treated safely, unknown plans rejected or normalized)

Test style requirements:

- Use Vitest patterns already present in tests directory
- Keep tests deterministic and side-effect free
- No network/database dependencies in usage-limits tests

## API Testing (Phase 1)

Add route tests for:

- checkout route auth guard and billing-cycle validation
- checkout success returns redirect URL
- portal route auth guard
- portal error when customer missing
- portal success returns redirect URL

## Environment Variables

Add and document:

- STRIPE_SECRET_KEY
- STRIPE_PRICE_PRO_MONTHLY
- STRIPE_PRICE_PRO_YEARLY
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- NEXT_PUBLIC_APP_URL

Note: STRIPE_WEBHOOK_SECRET is Phase 2.

## Acceptance Criteria

- Checkout endpoint can create Stripe checkout URL for monthly/yearly plans
- Portal endpoint can create customer-portal URL for subscribed users
- Session type includes plan and billing-aware code can read it
- usage-limits module exists with unit tests passing
- Stripe core tests and usage-limits tests pass in CI/local suite
- No webhook handling or hard feature gating added yet

## Testing Steps

1. Run unit tests for usage-limits module
2. Run checkout/portal API tests
3. Run full test suite to catch regressions
4. Verify lint and build pass

## References

- docs/stripe-integration-plan.md
- context/project-overview.md
- Existing API route patterns under src/app/api
