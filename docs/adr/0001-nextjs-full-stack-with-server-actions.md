# 0001. Next.js full stack, server actions instead of an API

> Last updated 2026-10-30 · reflects commit [`a894636`](https://github.com/m-danie/job-tracker/commit/a894636)

- **Status:** Accepted
- **Date:** 2026-10-17

## Context

The app needs pages, forms, a database and auth, built and maintained by one person and
hosted cheaply. Only this app's own UI uses the data. There are no other clients yet.

## Options considered

- **Next.js App Router with server actions**: one codebase and one deploy. Server
  Components read the database directly, and forms call server functions without
  hand-written endpoints.
- **SPA plus a separate REST API** (e.g. Vite + Express): a clear API boundary, but two
  apps to build, deploy and keep in sync, plus API types to share.

## Decision

Next.js (App Router, `src/` directory, Turbopack, React Compiler) on Vercel. Reads happen
in Server Components through `src/db/queries.ts`; every change is a server action
validated with Zod.

## Consequences

- No public API to document or version. Server actions are still public HTTP endpoints
  under the hood, so every action checks the session and ownership itself.
- Cache Components means session reads must sit behind `<Suspense>`. One side effect: a
  `notFound()` inside a streamed boundary returns HTTP 200 (see the known issues in
  [Development](../development.md#known-issues)).
- When an outside client needs the data (the planned mailbox script), add a small
  token-authenticated route handler and describe it with OpenAPI.
