# Current Feature: Auth UI - Sign In, Register & Sign Out

## Status

<!-- Not Started|In Progress|Completed -->

In Progress

## Goals

<!-- Goals & requirements -->

- Replace NextAuth default pages with custom authentication UI.
- Create a custom `/sign-in` page.
- Add email and password input fields to the sign-in page.
- Add a "Sign in with GitHub" button to the sign-in page.
- Add a link from the sign-in page to the register page.
- Add form validation and error display for sign-in.
- Create a custom `/register` page.
- Add name, email, password, and confirm password fields to the register page.
- Validate registration input, including password match and email format.
- Submit registration to `POST /api/auth/register`.
- Redirect users to sign-in after successful registration.
- Update the bottom of the sidebar to show the current user's avatar, email, and username.
- Use GitHub image when available, otherwise show initials fallback.
- Add an avatar dropdown/up menu with a "Sign out" link.
- Make clicking the user icon navigate to `/profile`.
- Verify GitHub sign-in, credentials sign-in, registration, sidebar avatar, dropdown, sign out, and redirects.

## Notes

<!-- Any extra notes -->

- Source spec: `context/features/auth-phase-3-spec.md`.
- Custom auth pages should replace the default Auth.js pages for sign-in and registration.
- Avatar logic: use `session.user.image` for GitHub users when available.
- Initials fallback: generate initials from the user's name, for example `Brad Traversy` -> `BT`.
- Create a reusable avatar component that handles image and initials display.
- Testing path: `/sign-in`, `/register`, credentials sign-in, GitHub sign-in, dashboard/sidebar avatar, avatar dropdown, sign out, and post-register redirect.

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
