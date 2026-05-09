# Current Feature

## Status

<!-- Set to: Not Started, In Progress, or Complete -->

## Goals

<!-- Add goals for the active feature -->

## Notes

<!-- Add context, constraints, and references for the active feature -->

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
- 2026-05-04: Completed Code Editor with a Monaco-based dark editor for snippet and command create/edit/detail flows, editor copy and language controls, fluid 400px max height, type-specific add buttons on supported item type pages, preselected create-dialog types, focused UI checks, lint, unit tests, and successful production build verification.
- 2026-05-04: Loaded Markdown Editor from `context/features/markdown-editor-spec.md` and set the feature status to Not Started.
- 2026-05-04: Started Markdown Editor implementation on `feature/markdown-editor`.
- 2026-05-04: Completed Markdown Editor with a dark Write/Preview editor for note and prompt create/edit/detail flows, GitHub Flavored Markdown rendering, copy controls, readonly preview mode, custom dark preview styling, focused UI checks, lint, unit tests, and successful production build verification.
- 2026-05-05: Loaded File Upload with Cloudflare R2 from `context/features/file-image-spec.md` and set the feature status to Not Started.
- 2026-05-05: Started File Upload with Cloudflare R2 implementation on `feature/file-upload-cloudflare-r2`.
- 2026-05-05: Switched the active file upload storage target from Cloudflare R2 to Amazon S3 bucket `eapi-chc-dev-ets-attachments` under `devstash/api/uploads/`.
- 2026-05-05: Renamed the feature branch to `feature/file-upload-s3`.
- 2026-05-05: Completed File Upload with Amazon S3 with upload and download API routes, drag-and-drop file/image uploads, item create and drawer integration, S3 delete cleanup, SAML2AWS/shared-profile credential support, and passing lint, unit tests, and build.
- 2026-05-06: Loaded Image Gallery View from `context/features/image-display-spec.md` and set the feature status to Not Started.
- 2026-05-06: Started Image Gallery View implementation on `feature/image-gallery-view`.
- 2026-05-06: Completed Image Gallery View with image-specific thumbnail cards, a three-column gallery layout, 16:9 object-cover thumbnails, subtle hover zoom, focused UI coverage, lint, unit tests, and successful production build verification.
- 2026-05-06: Loaded File List View from `context/features/file-display-spec.md` and set the feature status to Not Started.
- 2026-05-06: Started File List View implementation on `feature/file-list-view`.
- 2026-05-06: Completed File List View with a single-column `/items/files` layout, extension-based file icons, file metadata rows, direct download actions, drawer-opening row clicks, responsive stacking, focused UI/data coverage, lint, unit tests, and successful production build verification.
- 2026-05-06: Started Quick Copy Card Action implementation on `feature/quick-copy-card-action`.
- 2026-05-06: Added a disabled dashboard search placeholder fix while real item search remains unimplemented.
- 2026-05-06: Remediated code-scanner audit findings for upload key ownership, canonical auth email links, SVG upload safety, dashboard user-id scoping, S3 cleanup paths, link URL protocols, nested interactive card actions, and disabled upload drops.
- 2026-05-06: Completed Quick Copy Card Action, cleanup, and audit remediation with passing lint, unit tests, and production build verification.
- 2026-05-06: Loaded Collection Create from inline description and set the feature status to Not Started.
- 2026-05-06: Started Collection Create implementation on `feature/collection-create`.
- 2026-05-06: Completed Collection Create with a top-bar New Collection dialog, user-scoped collection creation API, unique collection slugs, toast feedback, dashboard refresh, focused route/UI/data tests, lint, unit tests, and successful production build verification.
- 2026-05-06: Loaded Item Collection Assignment from inline description and set the feature status to Not Started.
- 2026-05-06: Started Item Collection Assignment implementation on `feature/item-collection-assignment`.
- 2026-05-06: Completed Item Collection Assignment with searchable alphabetized collection selection in create/edit item forms, user-owned collection membership persistence and replacement, collection list/detail routes, collection item card display, focused UI/data tests, lint, unit tests, and successful production build verification.
- 2026-05-07: Loaded Collection Actions from inline description and set the feature status to Not Started.
- 2026-05-07: Started Collection Actions implementation on `feature/collection-actions`.
- 2026-05-07: Completed Collection Actions with a dropdown-menu UI component wrapping @base-ui/react menu, updateCollection and deleteCollection server actions, CollectionActions component with edit modal and delete confirmation, 3-dots menu on collection cards, action buttons on collection detail page header, overlay links on cards preventing menu clicks from navigating, edit modal for name/description changes, delete confirmation removing collections without deleting items (items persist but lose collection assignment), and favorite button as UI placeholder only.
- 2026-05-07: Loaded Global Search / Command Palette from `context/features/global-search-spec.md` and set the feature status to Not Started.
- 2026-05-07: Started Global Search / Command Palette implementation on `feature/global-search-command-palette`.
- 2026-05-07: Completed Global Search / Command Palette with a global Cmd+K/Ctrl+K command palette, searchable item and collection results via server action data, dashboard search trigger integration, cmdk result selection navigation, and dashboard deep-link item drawer opening via `openItem` query handling.
- 2026-05-07: Loaded Pagination from `context/features/pagination-spec.md` and set the feature status to Not Started.
- 2026-05-07: Started Pagination implementation on `feature/pagination`.
- 2026-05-07: Completed Pagination with page-based fetching and numbered prev/next controls on `/items/[type]`, `/collections/[slug]`, and `/collections`, plus shared pagination utilities/constants and collection/item count-backed total page calculation.
- 2026-05-07: Loaded Settings Page and Account Actions Move from inline description and set the feature status to Not Started.
- 2026-05-07: Started Settings Page and Account Actions Move implementation on `feature/settings-page-account-actions`.
- 2026-05-07: Completed Settings Page and Account Actions Move with a protected `/settings` route, a new Settings entry in the sidebar user dropdown, account actions moved off `/profile`, and inline reset-link and delete-account controls centralized in settings.
- 2026-05-08: Loaded Editor Preferences Settings from `context/features/editor-settings-spec.md` and set the feature status to Not Started.
- 2026-05-08: Started Editor Preferences Settings implementation on `feature/editor-preferences-settings`.
- 2026-05-08: Completed Editor Preferences Settings with Prisma User model JSON column, database migration, server actions for get/update, EditorPreferencesContext provider with fallback defaults, EditorPreferencesSettings UI component with font size/tab size/theme dropdowns and word wrap/minimap toggles, toast notifications on save, settings page integration, CodeEditor theme/font/tab/wrap/minimap preference application, app-level provider wrapping, all tests passing, and successful production build verification.
- 2026-05-08: Loaded Favorites Page from `context/features/favorites-spec.md` and set the feature status to Not Started.
- 2026-05-08: Started Favorites Page implementation on `feature/favorites`.
- 2026-05-08: Completed Favorites Page with db helper functions for fetching favorited items and collections, protected /favorites route, FavoritesList component with compact terminal/VS Code style list view, type icons and badges, item drawer opening and collection navigation, empty state handling, sorted by updatedAt, star icon button in TopBar, all 133 tests passing, and successful production build verification.
- 2026-05-08: Loaded Add Favorite Toggle Buttons in Drawer, Collection Page, and Cards from inline description and set the feature status to Not Started.
- 2026-05-08: Started Add Favorite Toggle Buttons in Drawer, Collection Page, and Cards implementation on `feature/add-favorite-toggle-buttons-drawer-collection-cards`.
- 2026-05-08: Loaded Add Client-Side Sorting to Favorites Page from inline description and set the feature status to Not Started.
- 2026-05-08: Started Add Client-Side Sorting to Favorites Page implementation on `feature/client-side-sorting-favorites-page`.
- 2026-05-08: Completed Add Favorite Toggle Buttons in Drawer, Collection Page, and Cards with server-backed favorite toggles for items and collections across drawer actions, collection cards/pages, and shared list/card surfaces.
- 2026-05-08: Completed Add Client-Side Sorting to Favorites Page with in-page sort controls for name/date/item type, ascending/descending direction toggle, and client-side sorting for favorite items and collections.
- 2026-05-09: Completed Homepage Mockup with a standalone marketing prototype in `prototypes/homepage` (HTML/CSS/JS), full spec sections and animations, and root route wiring to render the mockup from `/` via static assets in `public/prototypes/homepage`.
- 2026-05-09: Completed Homepage Implementation by replacing the iframe prototype on `/` with real Next.js server/client components using Tailwind + shadcn patterns, preserving the approved mockup visual/animations, and wiring CTA/navigation links to in-app routes.
