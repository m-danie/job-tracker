# 0005. Auth forms call Better Auth from the browser; rate limits in Postgres

> Last updated 2026-10-30 · reflects commit [`a894636`](https://github.com/m-danie/job-tracker/commit/a894636)

- **Status:** Accepted
- **Date:** 2026-10-26

## Context

The login and register forms first used server actions that called `auth.api.*` on the
server. Better Auth's rate limiting only applies to HTTP requests to `/api/auth/*`, so
those server-side calls skipped it, leaving sign-in open to brute force. Rate-limit
counters also need storage: on Vercel each function instance has its own memory, so
in-memory counters aren't shared.

## Decision

- The auth forms (`src/components/auth-form.tsx`) use the Better Auth browser client
  (`authClient.signIn.*`, `authClient.signUp.*`), so every attempt goes through
  `/api/auth/*` and is rate limited.
- Rate limits are stored in Postgres (`rateLimit.storage: "database"`, the `rate_limit`
  table). Demo sign-ins have a stricter rule: 5 per 10 minutes per IP.
- Sign-out stays a server action, since it doesn't need rate limiting.

## Consequences

- Validation messages come from Zod on the client and from Better Auth's error codes,
  mapped to friendly text in one place.
- Rate limits apply on Vercel previews too, which matters when testing the demo flow
  repeatedly from one IP.
