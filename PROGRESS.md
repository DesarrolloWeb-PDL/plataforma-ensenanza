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

## Slice 10: Printable Worksheets

### Goal
Implement printable worksheets CRUD, upload/download via storage, teacher answer keys, web download UI, shared types/tests.

### Accomplished
- DB: reworked `worksheets` table to use `file_key`, `answer_key_file_key`, `printable`; migration added.
- Shared: added `Worksheet` interface and zod schemas; tests.
- API: added `apps/api/src/worksheets/routes.ts` and registered; CRUD, list, download, answer-key endpoints.
- Web: added worksheets list page and download button component; teacher-only answer key link.
- Seed: added sample worksheet reference.
- Verification: typecheck, lint, test, web build passed.

### Next Steps
- Add worksheet upload UI for teachers (signed upload).
- Link worksheets to lessons in lesson pages.

## Slice 11: Dashboards

### Goal
Implement teacher dashboard (classes, roster, progress view, grading queue, rubrics) and parent dashboard (child progress summary) + web pages + shared types/tests.

### Accomplished
- Shared: added DashboardSummary, RosterEntry, GradingQueueItem, ParentSummary interfaces and zod schemas; tests.
- API: added `apps/api/src/dashboards/routes.ts` and registered in app; teacher and parent endpoints.
- Web: added `/dashboard/teacher` and `/dashboard/parent` pages with basic tables.
- Verification: typecheck, lint, test, web build passed.

### Next Steps
- Add teacher grading actions in dashboard.
- Add richer charts/summaries.

## Slice 12: Gamification & Consent

### Goal
Implement XP/streaks/badges awarding, consent flow (parent linkage, consent flags), web UI, and shared types/tests.

### Accomplished
- DB: added `user_xp` and `minor_consents` tables; migration `0003_gamification_consent`.
- Shared: added `XpSummary`, `Badge`, `Streak`, `ConsentStatus` interfaces and zod schemas; tests.
- API: added `apps/api/src/gamification/routes.ts` with `/me/xp`, `/me/badges`, `/me/streak/check-in`, consent link/grant/revoke/status; integrated XP/badge/streak awarding into progress completion.
- Web: added `XpDisplay`, `BadgeList`, gamification and consent pages.
- Verification: typecheck, lint, test, web build passed.

### Next Steps
- Add badge awarding rules for additional achievements.
- Add XP leaderboard and richer consent management UI.
## Slice 13: PWA & Observability

### Goal
Implement PWA support (manifest, service worker, offline fallback) and PostHog analytics (client + server) with key event tracking.

### Accomplished
- Web: added public/manifest.json, public/icon.svg, public/offline.html, public/sw.js; service worker registration component; manifest/theme links in locale layout.
- Web: added PostHog provider and tracking for lesson complete, assignment submit, worksheet download.
- API: added optional PostHog client via POSTHOG_KEY/POSTHOG_HOST env vars; capture signup, lesson complete, assignment submit, worksheet download.
- Verification: typecheck, lint, test, web build passed.

### Next Steps
- Add richer offline caching for worksheets and app shell.
- Expand PostHog dashboards and user identification.

## Slice 14: Sandbox Code Runner

### Goal
Provide a sandboxed iframe (+ optional Web Worker) to run user HTML/JS for the teen track, used in assignment submission preview and a dedicated sandbox demo page.

### Accomplished
- Web: added `CodeRunner` component with srcdoc, CSP meta, `sandbox="allow-scripts"`, 5s timeout kill, reset button, console capture.
- Web: added optional `runJsInWorker` helper (blob-backed Worker with timeout).
- Web: added `/sandbox` demo page with HTML/CSS/JS editors and worker run.
- Web: integrated `CodeRunner` preview into code assignment submission form.
- Verification: typecheck, lint, test, web build passed.

### Next Steps
- Add server-side validation/sanitization if running untrusted code in production.
- Add richer output capture and error stack display.

## Slice 15: Grading UI + Ownership Checks

### Goal
Implement teacher grading UI with rubric form, ownership/enrollment guards in API, and helper tests.

### Accomplished
- API: added `apps/api/src/lib/ownership.ts` helper with teacher/student ownership checks.
- API: enforced ownership/enrollment in assignments/submissions/progress routes (403 on violation).
- API: assignments now track `createdBy`.
- Web: added teacher grading page with rubric form at `/dashboard/teacher/grading/[submissionId]`.
- Web: grading queue links to grading page.
- Tests: added ownership helper unit tests.
- Verification: typecheck, lint, test, web build passed.

### Next Steps
- Add rubric picker and validation in grading UI.
- Add richer ownership tests for routes.
