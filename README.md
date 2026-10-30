# Job Tracker

> Last updated 2026-10-30 · reflects commit [`a894636`](https://github.com/m-danie/job-tracker/commit/a894636)

A job-application tracker: keep every application on a Kanban board, drag it from
Applied to Interview to Offer (or Rejected), and keep the history, dates and contacts
for each one. An AI assist for tailoring a resume to a job description is planned.

**Live:** [jobs.poison-apple.org](https://jobs.poison-apple.org). Click **Log in with a Demo Account**
to get a private demo account with sample data. It is deleted when you sign out (or
after 24 hours).

## Features

- Sign in with email and password or GitHub, or try it as a demo user
- Board with four stages; drag cards with mouse, touch or keyboard
- Every stage change is recorded with its date; interview rounds, offer and rejection dates
- Application detail page with history, notes, salary range and contacts
- Add, edit and delete applications and contacts

## Stack

| Area | Choice |
|---|---|
| Framework | Next.js 16 (App Router, server actions, Cache Components, React Compiler) |
| Language | TypeScript, Zod for validation |
| UI | Tailwind CSS 4, daisyUI 5, dnd-kit, Sonner |
| Auth | Better Auth (email + password, GitHub OAuth, anonymous demo users) |
| Database | Postgres on Neon, Drizzle ORM |
| Hosting | Vercel (with a daily Vercel Cron job) |
| Checks | ESLint, `tsc`, GitHub Actions CI; Vitest and Playwright set up |

The reasons behind these choices are in the [decision records](docs/adr/README.md).

## Documentation

- [Architecture](docs/architecture.md): how a request flows, auth, environments
- [Data model](docs/data-model.md): tables and how they relate
- [Development](docs/development.md): local setup, migrations, deploys
- [Decision records](docs/adr/README.md): why things are the way they are

## Getting started

Needs Node 24 (see `.nvmrc`), pnpm (pinned via `packageManager`) and a Postgres database.

```bash
pnpm install
# create .env.local with the variables listed in docs/development.md
pnpm db:migrate
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Status

The MVP is live. Next up: automated tests, then the AI assist. See the roadmap in
[Development](docs/development.md#roadmap).
