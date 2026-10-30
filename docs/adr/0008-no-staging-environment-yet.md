# 0008. No staging environment yet

> Last updated 2026-10-30 · reflects commit [`a894636`](https://github.com/m-danie/job-tracker/commit/a894636)

- **Status:** Accepted
- **Date:** 2026-10-17

## Context

A staging environment catches problems before production, but it costs setup and slows
every release. This is a one-person project with few users.

## Decision

Feature branches merge straight into `main`, which deploys to production. Each pushed
branch gets a Vercel preview deployment (on the Neon `dev` database) to check first, and
GitHub Actions runs lint, typecheck and build on every push.

## Consequences

- CI and previews are the only safety net before production, which makes the automated
  tests the next priority.
- Production migrations are run by hand before merging the code that needs them.
- When continuous deployment is set up: a `staging` branch deploying to a staging
  subdomain with its own Neon branch, and `staging` → `main` for production. This ADR will
  then be superseded.
