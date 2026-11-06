# plataforma-ensenanza

Spanish-first two-track coding platform: Bloques (L0-L3, ages 6-12) and HTML5+AI (L0-L4, ages 12-17).

## Quick path

1. `pnpm install`
2. `cp .env.example .env` and fill secrets (R2, PostHog optional)
3. `pnpm dev` (web on :3000, api on :4000)
4. Open http://localhost:3000

## Stack

| Area | Choice |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Web | Next.js 14 (apps/web) |
| API | Fastify (apps/api) |
| DB | Postgres + Drizzle (packages/db) |
| Storage | Cloudflare R2 or local (packages/storage) |
| Shared types | packages/shared |
| Tests | Vitest, Playwright |

## Setup

- Node >= 20, pnpm (see `packageManager`).
- Postgres running with `DATABASE_URL`.
- Optional: Redis not used; R2 credentials for production uploads.
- Copy `.env.example` to `.env` and adjust.

## Dev commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Run web + api via turbo |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Typecheck all packages |
| `pnpm test` | Run unit tests |
| `pnpm format` / `pnpm format:check` | Prettier |

API dev: `pnpm --filter @plataforma/api dev`. Web dev: `pnpm --filter @plataforma/web dev`.

## Test commands

- Unit: `pnpm test`
- Coverage: `pnpm --filter @plataforma/<pkg> test -- --coverage`
- E2E: `pnpm --filter @plataforma/web test:e2e`
- Typecheck: `pnpm typecheck`

## Deploy notes

- Build: `pnpm build`. API start: `node dist/server.js` (after compile) or tsx.
- Set `NODE_ENV=production`, strong JWT secrets, real `DATABASE_URL`.
- Configure R2 credentials and buckets; otherwise local storage is used.
- Run DB migrations: `pnpm --filter @plataforma/db` (drizzle-kit).
- Seed content if needed.
- Web: Next.js build/start; set `NEXT_PUBLIC_API_URL` to public API URL.
- CI runs lint, typecheck, tests, coverage, web build, Playwright e2e.

## Features (slices 6-16)

- Tracks/levels/lessons with MDX content and i18n.
- Progress tracking and completion.
- Assignments with code/file/quiz submissions and grading.
- Live classes (external links) and attendance.
- Printable worksheets with signed downloads.
- Teacher/parent dashboards.
- Gamification: XP, streaks, badges; consent flow.
- PWA manifest/service worker; PostHog analytics.
- Sandbox code runner for HTML/JS.
- Ownership/enrollment guards.
- Comprehensive tests and coverage.

## Next step

MVP complete. See PROGRESS.md for slice history.
