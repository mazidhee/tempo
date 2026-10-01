# Reflection module handoff

Stage 1B branches from tested Foundation `33f3c19`, tag `tempo-foundation-2026-10-01`.

## Integration entries

Additive entries mount migration 200, `registerReflection`, Plan/Journal/Goals/Review
routes, their navigation flags, `reflection-notifications` settings section, and the
three named Home widget slots. C mounts Study and the Settings/Home registry shells.
The integrator must register `reflectionBackup` from `main/reflection/backup.ts` and
import `tests/reflection.test.ts` in the full test entry. Foundation's Study fixture
must count all registered migrations rather than assuming only one module migration.

## API

`src/shared/reflection.ts` augments WorkspaceRequests/WorkspaceEvents. The preload is
unchanged. Read `plan:snapshot` for the full module snapshot and the canonical source
records. Mutations are `plan:save`, `plan:evening`, `plan:saveSettings`, `journal:save`,
`review:generate`, `review:save`, `goals:save`, `goals:archive`. Journal exposes
`journal:lookup(date)`, `journal:lookupDates(dates)` returning a date-to-line dictionary,
and `journal:search({query,start?,end?})`. FTS uses Unicode-normalized word prefixes;
blank search browses dates. Results cap at 500; batch lookup accepts up to 1,000 dates.

Changed events are `plan:changed`, `journal:changed`, `review:changed`, `goals:changed`.
The renderer shares one cached snapshot and event listener set across Home widgets.
It refreshes on actual module changes, Study/focus transitions, mounting, window focus,
and local day rollover. Canonical writes from C can dispatch
`window.dispatchEvent(new Event('workspace-data-changed'))` after persistence.
No per-second clock or periodic whole-history refresh is used.

Exports: `TodayPlanWidget`, `GoalsWidget`, `ReviewsDueWidget` from
`renderer/modules/reflection/widgets.tsx`; `ReflectionNotifications` from `settings.tsx`.

## Schema and backup

Migration 200 runs within the Foundation ordered transactional migration runner.

| Table                          | Persistent columns                                                     |
| ------------------------------ | ---------------------------------------------------------------------- |
| reflection_plans               | date primary key, json (DailyPlan)                                     |
| reflection_journal             | date primary key, text, updated_at                                     |
| reflection_journal_fts         | FTS5 date unindexed, text; maintained by insert/update/delete triggers |
| reflection_reviews             | start primary key, json (WeeklyReview)                                 |
| reflection_goals               | id primary key, json (Goal)                                            |
| reflection_settings            | singleton id 1, json (ReflectionSettings)                              |
| reflection_reminder_deliveries | key primary key, delivered_at                                          |

`reflectionBackup` has key `reflection` and export/validate/merge methods.
Its snapshot is ReflectionData plus deliveries `{key,deliveredAt}[]`. Validation checks
all persisted record shapes, numeric/date/time bounds, review summary fields and
duplicate primary keys before writing. Merge runs inside the caller's transaction,
preserves local primary-key collisions/settings with INSERT OR IGNORE, reconstructs
FTS through triggers and remaps habit, studyTopics and studyCurricula identifiers via
the integrator's maps. No owner data was used in validation.

## Behavior decisions

Plans support three ordered linked/free priorities and a separate Study selection.
Evening completion describes the plan and does not fabricate linked task/habit/Study
completion. Journals allow 20,000 characters. Saved weekly snapshots keep written
prompts; the explicit refresh action saves drafts before refreshing canonical activity.
Sunday auto-generation refreshes snapshots created before the scheduled evening time.
Missing recent completed-week snapshots are generated on reopening.

Habit summaries use canonical due/completion/streak/freeze rules, including closed
boundary misses. Flexible habit target shortfalls count only closed habit periods;
partial periods show credited opportunities without declaring future misses. Focus
excludes breaks and groups canonical sessions. Study recall is labelled Good/Easy
grades divided by all graded reviews, self-reported rather than a measured test.
Chapter goals use the same active topic records and nested identifiers as Study.
Habit goals count completed seven-day periods; freezes never count as completed work.
Other on-track estimates compare progress with elapsed closed calendar days.

Morning/evening/weekly native reminders are independently opt-in and use local times.
Only the configured minute can notify; delivery markers survive restart. Fixtures
under HABIT_TRACKER_DATA_DIR suppress native reminders. Auto-generation remains active.
The app must be open or in its tray for reminders; missed reminders are not replayed.
Habit names and linked habit goal titles receive safe privacy labels in pages,
widgets, native options and accessible controls; Review hides private journal/reason
and reflection text as well.

No dependencies were installed. Existing Foundation MIT component resources and
bundled offline fonts are reused.

## Evidence

`node scripts/reflection-test.cjs`: 13 meaningful tests passed, including file reopen,
FTS edits/Unicode/browse, canonical aggregation, all goal kinds, reminder deduplication,
Sunday refresh, closed streak boundaries, safe correlation labels and backup merging.
`npm run build` passes TypeScript and renderer/main/preload production builds.

`node scripts/reflection-smoke.cjs` uses the real Electron runtime and isolated SQLite,
clicks plan/evening, Journal search, goal creation and review editing, checks private
habit labels/options, then verifies persistence after process restart. The successful
fixture captures all four pages in light/dark at 1280×860 and 760×860:
`.review/reflection-1790857338817`. Layout captures were inspected and token insets/date
control width corrected. The final functional-only run at `.review/reflection-1790857895983` also verifies
that activity refresh saves unsaved written prompts, recomputes activity and persists
the prompts after process restart. Boundary fixes pass all regression/build checks.
This is module validation, not a packaged release or independent review claim.

The targeted minimum-width follow-up used real Electron at 390×860 in light and dark,
covering Plan, Journal, Goals, Review and the exact notification component. All ten
captures passed document-width and control-bound checks; longer fixture labels wrapped
without clipping. Evidence: `.review/reflection-390-1790858304475/result.json` and its ten
PNGs. The Foundation Settings shell does not yet mount contributed sections, so the
notification component was mounted through a temporary fixture route for this check;
the route source was restored afterward. No module visual changes were required.
The app shell's top bar clips its rightmost window control at 390px; this lies outside
B's ownership and is handed to integration. `scripts/reflection-narrow-smoke.cjs`
defaults to C's integrated Settings section; its fixture-route option is documented in
the script for isolated Foundation checks. Existing unit tests were not rerun because
the follow-up did not change implementation.
