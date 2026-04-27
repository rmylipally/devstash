# Current Feature: Auth Setup - NextAuth + GitHub Provider

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

- Install NextAuth v5 (`next-auth@beta`) and `@auth/prisma-adapter`.
- Set up the split auth config pattern for edge compatibility.
- Add GitHub OAuth provider support.
- Create `src/auth.config.ts` for edge-compatible provider config.
- Create `src/auth.ts` with the Prisma adapter and JWT session strategy.
- Create `src/app/api/auth/[...nextauth]/route.ts` to export NextAuth handlers.
- Create `src/proxy.ts` to protect `/dashboard/*` routes and redirect unauthenticated users to sign in.
- Create `src/types/next-auth.d.ts` to extend the session type with `user.id`.
- Verify unauthenticated `/dashboard` access redirects to sign-in and GitHub sign-in redirects back to `/dashboard`.

## Notes

<!-- Any extra notes -->

- Source spec: `context/features/auth-phase-1-spec.md`.
- Use Context7 to verify current Auth.js / NextAuth v5 conventions before implementation.
- Use `next-auth@beta`; do not install `next-auth@latest` if it resolves to v4.
- Keep `src/proxy.ts` at the same level as `src/app/`.
- Use named export `export const proxy = auth(...)`, not a default export.
- Use `session: { strategy: "jwt" }` with the split config pattern.
- Do not set a custom `pages.signIn`; use the default NextAuth page for testing.
- Required environment variables: `AUTH_SECRET`, `AUTH_GITHUB_ID`, and `AUTH_GITHUB_SECRET`.
- References: https://authjs.dev/getting-started/installation#edge-compatibility and https://authjs.dev/getting-started/adapters/prisma.

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
