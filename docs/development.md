# Development

> Last updated 2026-10-30 · reflects commit [`a894636`](https://github.com/m-danie/job-tracker/commit/a894636)

## Requirements

- Node 24 LTS (`.nvmrc`; with nvm, run `nvm use`)
- pnpm, pinned in `package.json`'s `packageManager` field (enable it with
  `corepack enable`). Use `pnpm dlx` for one-off CLIs, never npm or npx.
- A Postgres database. This project uses a Neon branch; any Postgres works with the `pg`
  driver.

## Environment variables

Put these in `.env.local` (gitignored). On Vercel they are set per environment.

| Variable | Used for |
|---|---|
| `DATABASE_URL` | App queries. On Neon, the pooled URL (`-pooler` host) |
| `DATABASE_URL_UNPOOLED` | Migrations (`drizzle-kit`), which shouldn't go through the pooler |
| `BETTER_AUTH_SECRET` | Signs sessions. Generate one with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | The app's public URL, e.g. `http://localhost:3000` |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | GitHub OAuth app. Callback URL: `<BETTER_AUTH_URL>/api/auth/callback/github` |
| `CRON_SECRET` | The cron route only runs when called with `Authorization: Bearer <CRON_SECRET>` |

With the Neon CLI, `neon link` and `neon checkout <branch>` write the database variables
into `.env.local` for you.

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server (Turbopack) |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Generates route types, then `tsc --noEmit` |
| `pnpm build` | Production build |
| `pnpm test` | Vitest |
| `pnpm test:e2e` | Playwright (drives the installed Google Chrome locally) |
| `pnpm db:generate` | Write a SQL migration from `src/db/schema/` |
| `pnpm db:migrate` | Apply pending migrations to the database in `DATABASE_URL_UNPOOLED` |
| `pnpm db:studio` | Browse the database |
| `pnpm auth:generate` | Regenerate Better Auth's schema (after changing auth plugins) |

## Database migrations

The schema is code-first (see [ADR 0003](adr/0003-drizzle-orm-code-first-migrations.md)):

1. Change the schema in `src/db/schema/app.ts`.
2. `pnpm db:generate` writes a new file in `drizzle/`. Read the SQL before committing it.
3. `pnpm db:migrate` applies it to the database in `.env.local` (the Neon `dev` branch).
4. Commit the schema change and the migration together.

Rules: never edit a migration that has been applied, and keep changes backward
compatible (add first, remove later), because production runs the old code until the
new deploy finishes.

**Production** migrations are run by hand, **before** merging code that needs them. To
point one command at the `main` branch without changing `.env.local` (shell variables win
over the ones `drizzle.config.ts` loads):

```bash
DATABASE_URL_UNPOOLED=$(neon connection-string main) pnpm db:migrate
```

## Branches and deploys

- Branch names: `feature/…`, `fix/…`, `chore/…`, `ci/…`. Commit messages use
  [Conventional Commits](https://www.conventionalcommits.org) (`feat:`, `fix:`, …).
- Pushing a branch runs CI and creates a Vercel preview deployment (using the Neon `dev`
  database).
- Merging into `main` deploys to production.

## Roadmap

1. ~~Foundation: scaffold, linting, CI, Vercel deploy~~
2. ~~Data and auth: Neon + Drizzle, Better Auth, schema~~
3. ~~Core CRUD: add and edit applications~~
4. ~~Kanban board~~
5. Automated tests (unit, component, integration against Postgres, e2e)
6. AI assist: paste a job description, get a streamed resume summary and fit notes
7. ~~Polish: seeded demo account, README, architecture diagram, custom domain~~

Later: theme settings (light, dark, system), auto-fill from a job link, privacy-first
mailbox scanning with a local LLM.

## Known issues

- Renaming an application's company leaves the old company row behind, unused.
- Unknown ids on `/applications/[id]` show the 404 page but return HTTP 200, because the
  check runs inside a streamed Suspense boundary.
- Next keeps visited pages mounted, so leaving a form after a validation error and coming
  back can show the earlier typed values.
