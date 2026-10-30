# 0006. Demo accounts as temporary anonymous users

> Last updated 2026-10-30 · reflects commit [`a894636`](https://github.com/m-danie/job-tracker/commit/a894636)

- **Status:** Accepted
- **Date:** 2026-10-26

## Context

As a portfolio project, visitors should be able to try the app without registering. A
single shared demo login would let one visitor change or delete what the next one sees.

## Options considered

- **One shared demo account, reset on a schedule**: simple, but visitors interfere with
  each other between resets.
- **A temporary user per visitor, seeded with sample data**: everyone gets a private copy;
  the cost is cleaning up afterwards.

## Decision

Better Auth's `anonymous` plugin creates a temporary user (email on the reserved
`demo.invalid` domain). A `databaseHooks.user.create.after` hook seeds the sample data
from `src/db/demo.ts`. The demo user is deleted on sign-out, and a daily Vercel Cron job
(`/api/cron/delete-demo-users`, protected by `CRON_SECRET`) deletes demo users older than
24 hours. All their data cascades with them.

## Consequences

- Each demo sign-in writes rows, so it has its own rate limit
  ([0005](0005-auth-forms-call-better-auth-from-the-browser.md)).
- The navbar shows a "Demo account, deleted on sign-out" badge.
- If a demo user later signs in with a real account, the plugin deletes the anonymous user
  and its data. Nothing is carried over.
- Vercel Hobby crons run at most once a day, hence the 24-hour window.
