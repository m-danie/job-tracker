# 0003. Drizzle ORM with code-first migrations

> Last updated 2026-10-30 · reflects commit [`a894636`](https://github.com/m-danie/job-tracker/commit/a894636)

- **Status:** Accepted
- **Date:** 2026-10-18

## Context

The app needs typed database access that works well in serverless functions, and a
schema history that can be reviewed in git.

## Options considered

- **Drizzle**: schema in TypeScript, queries that read like SQL, inferred types, small
  runtime, no separate query engine.
- **Prisma**: mature, with a nice schema language, but more abstraction and a heavier
  runtime, and its own schema file outside TypeScript.
- **Raw SQL / a query builder (Kysely)**: full control, but types and migrations are more
  manual.

## Decision

Drizzle (stable `drizzle-orm` 0.45 / `drizzle-kit` 0.31, not the 1.0 release candidate)
with the standard `pg` driver. The schema is code-first: TypeScript in `src/db/schema/` →
`pnpm db:generate` writes a SQL migration → review and commit it → `pnpm db:migrate`.
`drizzle-kit push` is only for throwaway experiments.

## Consequences

- Every database change is a reviewable SQL file in `drizzle/`.
- The `pg` driver works with Neon and with plain Postgres, so a CI database or a local
  container would need no code change.
- App traffic uses Neon's pooled URL; migrations use the direct (unpooled) one.
- `drizzle-kit` runs outside Next.js, so `drizzle.config.ts` loads `.env.local` itself, and
  the schema uses relative imports (drizzle-kit doesn't read tsconfig path aliases).
