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
- Add progress tracking endpoints (slice 7). (done)
- Add auth-gated content completion. (done)

## Slice 7: Progress Tracking

### Goal
Implement progress tracking endpoints, auth-gated lesson/level completion, web progress indicators, and shared types/tests.

### Accomplished
- Shared: added LessonProgress and LevelCompletion interfaces and zod schemas; tests.
- API: added `apps/api/src/progress/routes.ts` and registered in app; completion + progress endpoints.
- Web: added ProgressButton component and indicators on lesson/level pages.
- Verification: typecheck, lint, test, web build passed.

### Next Steps
- Add assignments/submissions flow (slice 8). (done)

## Slice 8: Assignments & Manual Grading

### Goal
Implement assignments CRUD, submissions (code/file/quiz), manual grading with rubrics, web submission form, shared types/tests, and signed upload endpoint.

### Accomplished
- Shared: added Assignment, Submission, Grade, Rubric interfaces and zod schemas; tests.
- API: added `apps/api/src/assignments/routes.ts` and registered in app; CRUD, submit, grade, list submissions, signed upload.
- Web: added assignment detail page with submission form.
- Verification: typecheck, lint, test, web build passed.

### Next Steps
- Teacher grading UI (deferred).
- Enrollment/ownership checks for assignments.

## Slice 9: Live Classes

### Goal
Implement external-link live classes CRUD, attendance, recording link, MeetingProvider adapter, web UI, shared types/tests.

### Accomplished
- Shared: added LiveClass and Attendance interfaces and zod schemas; tests.
- API: added `apps/api/src/live-classes/routes.ts` and registered in app; CRUD, attendance/join, recording link, MeetingProvider adapter.
- Web: added live classes list and detail pages with join button.
- Verification: typecheck, lint, test, web build passed.

### Next Steps
- Embedded provider implementation (future).
- Teacher attendance management UI.