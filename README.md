# DevStash

DevStash is a developer knowledge hub for reusable snippets, commands, prompts, notes, files, images, links, and custom item types.

## Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS v4
- Auth.js v5 with Prisma adapter
- Prisma 7
- Neon Postgres

## Getting Started

Install dependencies:

```bash
npm install
```

Copy the environment template and fill in local values:

```bash
cp .env.example .env
```

Required environment variables:

```bash
DATABASE_URL=
AUTH_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
EMAIL_VERIFICATION_ENABLED=true
RESEND_API_KEY=
RESEND_FROM_EMAIL="DevStash <onboarding@resend.dev>"
```

Generate the Prisma client:

```bash
npm run db:generate
```

Run migrations:

```bash
npm run db:migrate
```

Seed local data:

```bash
npm run db:seed
```

Start the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

- `npm run dev` - Start the Next.js dev server.
- `npm run build` - Build the production app.
- `npm run lint` - Run ESLint.
- `npm run test` - Run Vitest unit tests for server actions and utilities.
- `npm run test:unit` - Run the same non-component Vitest unit suite.
- `npm run test:unit:watch` - Run the non-component Vitest unit suite in watch mode.
- `npm run db:generate` - Generate the Prisma client.
- `npm run db:migrate` - Run Prisma migrations locally.
- `npm run db:migrate:status` - Check migration status.
- `npm run db:deploy` - Deploy migrations.
- `npm run db:seed` - Seed demo data.
- `npm run test:db` - Run the database smoke test.
- `npm run test:seed` - Run the seed data unit test with Vitest.

## Project Context

Read these files before feature work:

- `context/project-overview.md`
- `context/coding-standards.md`
- `context/ai-interaction.md`
- `context/current-feature.md`

## Current Features

- Dashboard shell with sidebar, item type counts, recent collections, pinned items, and recent items.
- Auth.js setup with GitHub OAuth and email/password credentials.
- Custom sign-in, registration, sign-out, email verification, and password reset flows.
- Profile page with account details, usage stats, item type breakdown, password action, and account deletion.

## Notes

- Use Prisma Migrate for schema changes.
- Tailwind CSS v4 configuration belongs in CSS via `@theme`; do not add a Tailwind JS config.
- The local Neon development branch is the default database target unless production is explicitly requested.
