# Current Feature: Rate Limiting for Auth

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

- Add rate limiting to auth-related API routes.
- Use Upstash Redis with `@upstash/ratelimit` for serverless-compatible limiting.
- Create a reusable `src/lib/rate-limit.ts` utility.
- Return `429 Too Many Requests` JSON responses with a `Retry-After` header.
- Display user-friendly rate-limit errors in auth UI flows.
- Protect credentials login, registration, forgot-password, reset-password, and resend-verification flows with endpoint-specific limits.

## Notes

<!-- Any extra notes -->

- Source spec: `context/features/rate-limiting-spec.md`
- Login limit: 5 attempts per 15 minutes, keyed by IP + email.
- Register limit: 3 attempts per 1 hour, keyed by IP.
- Forgot password limit: 3 attempts per 1 hour, keyed by IP.
- Reset password limit: 5 attempts per 15 minutes, keyed by IP.
- Resend verification limit: 3 attempts per 15 minutes, keyed by IP + email.
- Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` environment variables.
- Rate limiting should fail open if Upstash is unavailable.
- NextAuth credentials callback limiting may require a careful custom integration path.

## History

<!-- Keep this updated. Earliest to latest -->

- Project setup and boilerplate cleanup
- 2026-04-24: Completed initial Next.js and Tailwind CSS setup, created the first commit, configured the GitHub remote, pushed `main`, and switched `origin` to HTTPS.
- 2026-04-25: Started Dashboard UI Phase 1 and set the feature status to In Progress.
- 2026-04-25: Completed Dashboard UI Phase 1 with ShadCN initialization, `/dashboard` route, dark dashboard shell, top bar search, display-only new item button, and sidebar/main placeholders.
- 2026-04-25: Started Dashboard UI Phase 2 and set the feature status to In Progress.
- 2026-04-25: Completed Dashboard UI Phase 2 with a collapsible desktop sidebar, mobile drawer sidebar, item type links, favorite and recent collections, sidebar toggle controls, and bottom user area.
- 2026-04-25: Started Dashboard UI Phase 3 and set the feature status to In Progress.
- 2026-04-25: Completed Dashboard UI Phase 3 with server-rendered main dashboard content, stats cards, recent collections, pinned items, and 10 recent items, with sidebar interactivity isolated in a client component.
- 2026-04-25: Started Neon Postgres and Prisma setup and set the feature status to In Progress.
- 2026-04-25: Completed Prisma 7 database setup with initial schema, Auth.js models, migration, local PostgreSQL migration run, seed data, and database test script.
- 2026-04-25: Documented Seed Database with Demo Data as the current feature.
- 2026-04-25: Started Seed Database with Demo Data implementation on `feature/seed-database-demo-data`.
- 2026-04-25: Completed Seed Database with Demo Data with typed seed fixtures, bcrypt-hashed demo credentials, idempotent Prisma upserts, 5 demo collections, 18 demo items, 38 tags, seed tests, and successful build verification.
- 2026-04-25: Completed database smoke-test update to fetch, validate, and display seeded demo data from `scripts/test-db.ts`.
- 2026-04-25: Started Dashboard Collections and set the feature status to In Progress.
- 2026-04-25: Completed Dashboard Collections with Prisma-backed dashboard collection fetching, demo-user scoped collection stats, dominant-kind card accents, all item type icons on collection cards, dashboard route verification, and passing tests/build.
- 2026-04-25: Started Dashboard Items and set the feature status to In Progress.
- 2026-04-25: Completed Dashboard Items with Prisma-backed pinned and recent item fetching, demo-user scoped item stats, database-driven item cards and rows, hidden empty pinned section, dashboard route verification, and passing tests/build.
- 2026-04-25: Started Stats & Sidebar and set the feature status to In Progress.
- 2026-04-25: Completed Stats & Sidebar with database-backed sidebar item type counts, database collection sidebar data, recent collection dominant-kind markers, the sidebar collections link, focused tests, successful build, and localhost dashboard verification.
- 2026-04-25: Adjusted Stats & Sidebar item type order to Snippets, Prompts, Commands, Notes, Files, Images, and Links.
- 2026-04-25: Closed Stats & Sidebar as completed and cleared the current feature details.
- 2026-04-26: Documented Add Pro Badge to Sidebar as the current feature and set the feature status to Not Started.
- 2026-04-26: Started Add Pro Badge to Sidebar implementation on `feature/add-pro-badge-sidebar`.
- 2026-04-26: Completed Add Pro Badge to Sidebar with a reusable ShadCN-style badge component and subtle uppercase `PRO` badges for the Files and Images sidebar types.
- 2026-04-27: Started Add ItemType Table implementation on `feature/item-type-table`.
- 2026-04-27: Completed Add ItemType Table with a database-backed `ItemType` model, migration, seeded built-in type rows, database-driven sidebar item type metadata, updated DB smoke checks, and passing tests/build.
- 2026-04-27: Documented Optimize Dashboard Item Type Counts as the next quick-win feature from the code scan.
- 2026-04-27: Started Optimize Dashboard Item Type Counts implementation on `feature/optimize-dashboard-item-type-counts`.
- 2026-04-27: Completed Optimize Dashboard Item Type Counts by replacing per-kind item count queries with one grouped Prisma query while preserving sidebar item type metadata and counts.
- 2026-04-27: Loaded Auth Setup - NextAuth + GitHub Provider from `context/features/auth-phase-1-spec.md` and set the feature status to Not Started.
- 2026-04-27: Started Auth Setup - NextAuth + GitHub Provider implementation on `feature/auth-setup-nextauth-github-provider`.
- 2026-04-27: Completed Auth Setup - NextAuth + GitHub Provider with Auth.js v5 dependencies, split config, Prisma adapter, GitHub provider, Auth route handlers, dashboard proxy protection, session typing, environment placeholders, and focused auth setup tests.
- 2026-04-27: Loaded Auth Credentials - Email/Password Provider from `context/features/auth-phase-2-spec.md` and set the feature status to Not Started.
- 2026-04-27: Started Auth Credentials - Email/Password Provider implementation on `feature/auth-credentials-email-password-provider`.
- 2026-04-27: Completed Auth Credentials - Email/Password Provider with an edge-safe Credentials placeholder, bcrypt-backed database validation, registration API, password hashing, duplicate-email handling, protected dashboard proxy config, and focused auth credentials tests.
- 2026-04-27: Loaded Auth UI - Sign In, Register & Sign Out from `context/features/auth-phase-3-spec.md` and set the feature status to Not Started.
- 2026-04-27: Started Auth UI - Sign In, Register & Sign Out implementation on `feature/auth-ui-sign-in-register-sign-out`.
- 2026-04-27: Completed Auth UI - Sign In, Register & Sign Out with custom sign-in, registration, and profile pages; credentials and GitHub sign-in UI; registration validation and post-register toast; session-aware dashboard avatar/profile/sign-out controls; and passing lint, tests, and build.
- 2026-04-27: Loaded Email Verification on Register from inline description and set the feature status to Not Started.
- 2026-04-27: Started Email Verification on Register implementation on `feature/email-verification-on-register`.
- 2026-04-27: Completed Email Verification on Register with hashed expiring verification tokens, Resend verification emails, `/verify-email` handling, credentials sign-in blocking until verification, updated auth messaging, a guarded non-demo user cleanup script, and passing lint, tests, type-check, and build.
- 2026-04-27: Loaded Toggle Email Verification from inline description and set the feature status to Not Started.
- 2026-04-27: Started Toggle Email Verification implementation on `feature/toggle-email-verification`.
- 2026-04-27: Completed Toggle Email Verification with an `EMAIL_VERIFICATION_ENABLED` env flag, disabled-mode registration and sign-in behavior, enabled-mode verification preservation, updated auth messaging, env docs, and focused tests.
- 2026-04-28: Loaded Forgot Password from inline description and set the feature status to Not Started.
- 2026-04-28: Started Forgot Password implementation on `feature/forgot-password`.
- 2026-04-28: Completed Forgot Password with secure hashed reset tokens stored in the existing `VerificationToken` model, forgot/reset password pages and API routes, Resend reset emails, token expiry and consumption, sign-in recovery messaging, focused tests, lint, and successful production build verification.
- 2026-04-28: Loaded Profile Page from `context/features/profile-spec.md` and set the feature status to Not Started.
- 2026-04-28: Started Profile Page implementation on `feature/profile-page`.
- 2026-04-28: Completed Profile Page with a protected dashboard-framed `/profile` route, profile identity and account creation details, usage stats, item type breakdown, email-user password change action, guarded delete-account API and confirmation UI, tracked spec, focused tests, lint, and successful production build verification.
- 2026-04-28: Loaded Rate Limiting for Auth from `context/features/rate-limiting-spec.md` and set the feature status to Not Started.
- 2026-04-28: Started Rate Limiting for Auth implementation on `feature/rate-limiting-for-auth`.
- 2026-04-28: Completed Rate Limiting for Auth with Upstash-backed auth endpoint limits, local fallback limiting, NextAuth-compatible credentials throttling, resend-verification support, focused tests, lint, and successful production build verification.
