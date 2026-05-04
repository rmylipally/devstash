# Current Feature: Code Editor

## Status

In Progress



## Goals

- Create a dark-themed Monaco-based `CodeEditor` component.
- Use the code editor for snippets and commands only.
- Keep the existing textarea experience for notes, prompts, and other non-code item types.
- Add macOS-style red, yellow, and green window controls to the editor header.
- Add a quick copy button in the editor header.
- Show the current language in the editor header next to the copy control.
- Support both readonly display mode and edit mode.
- Make editor height fluid with a 400px max height and a theme-matched scrollbar.



## Notes

- Loaded from `context/features/code-editor-spec.md`.
- The editor should replace textareas only where the item kind is `snippet` or `command`.
- The component should fit the existing dark dashboard and drawer styling.



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
- 2026-04-28: Loaded Items List View from `context/features/item-list-view-spec.md` and set the feature status to Not Started.
- 2026-04-28: Started Items List View implementation on `feature/items-list-view`.
- 2026-04-28: Completed Items List View with a protected dynamic `/items/[type]` route, type-filtered item fetching, responsive two-column item card grid, item-kind left border accents, focused tests, lint, and successful production build verification.
- 2026-04-28: Loaded Item Listing Three-Column Layout from inline description and set the feature status to Not Started.
- 2026-04-28: Started Item Listing Three-Column Layout implementation on `feature/item-listing-three-column-layout`.
- 2026-04-28: Completed Item Listing Three-Column Layout with a responsive item list grid that keeps one column by default, two columns at medium widths, and three columns at extra-large widths, plus focused rendering coverage, lint, unit tests, and successful production build verification.
- 2026-04-28: Loaded Item Drawer from `context/features/item-drawer-spec.md` and set the feature status to Not Started.
- 2026-04-28: Started Item Drawer implementation on `feature/item-drawer`.
- 2026-04-28: Completed Item Drawer with a shared shadcn-style Sheet drawer, auth-scoped `/api/items/[id]` detail fetching, item detail query helpers, dashboard and item-list drawer triggers, loading/error/detail states, action bar controls, focused tests, lint, and successful production build verification.
- 2026-04-28: Loaded Item Drawer Edit Mode from `context/features/item-drawer-edit-spec.md` and set the feature status to Not Started.
- 2026-04-28: Started Item Drawer Edit Mode implementation on `feature/item-drawer-edit-mode`.
- 2026-04-28: Completed Item Drawer Edit Mode with inline drawer editing, header title editing, Save/Cancel mode controls, a validated `updateItem` server action, owner-scoped item updates, tag replacement with connect-or-create, success/error feedback, router refresh, focused tests, lint, static UI checks, and successful production build verification.
- 2026-04-28: Loaded Item Delete Functionality from inline description and set the feature status to Not Started.
- 2026-04-28: Started Item Delete Functionality implementation on `feature/item-delete-functionality`.
- 2026-04-28: Completed Item Delete Functionality with an owner-scoped `deleteItem` server action and database helper, shadcn-style confirmation dialog, pending destructive state, drawer close and router refresh after success, success/error toast feedback, focused tests, lint, static UI checks, and successful production build verification.
- 2026-04-28: Loaded Item Create from `context/features/item-create-spec.md` and set the feature status to Not Started.
- 2026-04-28: Started Item Create implementation on `feature/item-create`.
- 2026-04-28: Completed Item Create with a shadcn-style create dialog from the top-bar New Item button, type-specific fields for snippet, prompt, command, note, and link items, a validated `createItem` server action, a Prisma create helper with tag connect-or-create, success toast with page refresh, corrected type selector layout, focused tests, lint, static UI checks, and successful production build verification.
- 2026-05-04: Loaded Code Editor from `context/features/code-editor-spec.md` and set the feature status to Not Started.
- 2026-05-04: Started Code Editor implementation on `feature/code-editor`.
