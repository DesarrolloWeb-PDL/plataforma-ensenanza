# PROGRESS — plataforma-ensenanza

## Slice 6: Tracks & Content

### Goal
Implement read API for tracks/levels/lessons, shared types, MDX content loader, web pages, content files, i18n, and tests.

### Accomplished
- Shared: added Track, Level, Lesson interfaces and zod schemas; tests.
- API: added `apps/api/src/tracks` routes and registered in app; public read endpoints.
- DB seed: stable mdxRef paths using track slug.
- Web: content loader, MdxContent component, track/level/lesson pages, 4 MDX files.
- i18n: tracks/lessons namespaces in `messages/es.json`.
- Verification: typecheck, lint, test, web build passed.

### Next Steps
- Add progress tracking endpoints (slice 7).
- Add auth-gated content completion.