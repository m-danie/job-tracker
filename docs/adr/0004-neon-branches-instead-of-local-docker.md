# 0004. Neon, with a `dev` branch instead of a local Docker database

> Last updated 2026-10-30 · reflects commit [`a894636`](https://github.com/m-danie/job-tracker/commit/a894636)

- **Status:** Accepted
- **Date:** 2026-10-18

## Context

Production needs hosted Postgres that suits Vercel's serverless functions. Local
development needs a database too, and the development machine is an older laptop with
limited memory.

## Options considered

- **Postgres in Docker locally**: works offline and is easy to reset, but Docker Desktop's
  VM costs about 2 GB of RAM on this machine.
- **A Neon branch for development**: a copy-on-write branch of the production project.
  Nothing runs locally, and it's the same service as production.

## Decision

Neon project in `aws-us-east-1` (next to Vercel's default function region `iad1`; the
region can't be changed later), Postgres 18. Branch `main` is production; branch `dev` is
used for local development and Vercel previews.

## Consequences

- Local development needs an internet connection.
- Previews share the `dev` database with local development until there's a staging
  environment ([0008](0008-no-staging-environment-yet.md)).
- Data never moves from production to development. Demo and test data are seeded instead.
- The CI database (Postgres service container vs a temporary Neon branch) is still open
  and will be decided with the integration tests.
