# plataforma-ensenanza

Spanish-first two-track coding platform (Bloques L0-L3 ages 6-12; HTML5+AI L0-L4 ages 12-17).

## Quick start

1. `pnpm install`
2. `cp .env.example .env` and fill secrets
3. `pnpm dev` (web + api)
4. `pnpm test` / `pnpm lint` / `pnpm typecheck`

## Details

| Area | Choice |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Web | Next.js 14 (apps/web) |
| API | Fastify (apps/api) |
| DB | Postgres + Drizzle (packages/db) |
| Shared types | packages/shared |

## Checklist

- [ ] Node >= 20 installed
- [ ] pnpm installed (`npm i -g pnpm`)
- [ ] `.env` configured

## Next step

Phase 2: database schema + auth. See engram `sdd/plataforma-ensenanza/tasks`.
