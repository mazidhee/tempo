# Session handoff — paused October 1, 2026

## User's latest instruction

Pause development. The user wants to install new skills, start a new session,
and continue from there. Save project history and commit the current state to
Git so no context or version history is lost. **Do not resume development until
the user asks.** The reviewer was stopped, recorded its progress and cleaned up
its isolated Electron test processes. No background build/review work remains.

## Start the next session here

1. Read this file, [build-status.md](build-status.md),
   [master-build-brief.md](master-build-brief.md),
   [master-build-plan.md](master-build-plan.md), and
   [phase1-review-round-3.md](phase1-review-round-3.md).
2. Inspect `git status` and the latest pause-checkpoint commit. Re-read any new
   applicable skills/instructions installed by the user. Keep existing source,
   records, app identity and data location.
3. When explicitly resumed, finish Phase 1's independent Round 3 review and
   issue its actual weighted score. Do not invent a score from passing tests or
   reuse Round 2's score as final acceptance. Only then start Stage 0 Foundation.

Suggested user prompt: "Read docs/session-handoff.md and resume from the paused
checkpoint. Finish the Phase 1 independent review, then continue the master build
using my newly installed skills."

## What this application is

Tempo is the local desktop productivity app built from the original Habit
Tracker. This is a Windows/PowerShell workspace at
`C:\Users\USER\Documents\Habit-Tracker`; timezone Africa/Lagos. The original
app identity/user-data directory remains **Habit Tracker**; desktop/uninstall
labels are **Tempo**. Database filename is `habits.db`.

The current checkout uses Electron 44, React 19, TypeScript 7, Vite 8, Tailwind 4,
Recharts 3, date-fns, React Router and Lucide. Exact versions are pinned in
`package.json`/`package-lock.json`; Node >=22.12 is required. Electron's bundled
`node:sqlite` replaces the original better-sqlite3 native addon. Keep this working
stack; the master's older stack assumption is corrected in the build plan.

Original features remain: daily check-in, notes, midnight locking, weekly grid,
history, archive/restore/delete, analytics, CSV and reminders. The initial revamp
added Home's greeting/year heatmap/summaries, tasks/subtasks/projects/tags, Focus
presets/links/phase logging, Statistics, themes, command palette, JSON backups and
focus mode. Phase 1 adds Check/Quantity/Avoid, four schedule kinds, one canonical
habit engine, due-occurrence/weekly streaks, freezes, capped vacation pauses,
recovery prompts, sections/stacking/non-negotiables, habit detail and privacy.

## Implemented data and architectural decisions

- Migration 2 adds the productivity JSON record (tasks, presets, sessions, timer,
  settings). Migration 3 adds habit-engine fields/pauses and deliberately converts
  existing habits to Check/daily while preserving original fields/history. A
  consistent SQLite safety copy precedes this upgrade. IDs/data location stay
  intact; migrations are transactional and marked.
- Shared engines live in `src/shared`; database/main IPC in `src/main`; explicit
  typed APIs in preload; React pages/hooks/components/styles in `src/renderer`.
- Completed phases have immutable attribution snapshots and unique run IDs.
  Deadlines survive renderer refresh; the next phase requires an explicit start.
  Skipped/reset/paused time must not fabricate focus.
- Format-2 backups include archived habits, logs, pauses and productivity.
  Import creates a safety copy and transactionally merges missing records with
  identifier remapping. Existing records/settings/running timer win. Format 1
  remains supported. Future modules must be included in a compatible upgrade.
- Fast 250ms clock subscriptions are isolated to timer displays; calendar users
  use minute snapshots. Productivity context does not broadcast `now` each tick.
  Indexed habit calculations and memoized analytics avoid repeated heavy scans.
- Privacy uses Ctrl/Cmd+Shift+P. Focus's future global default must avoid that
  shortcut and detect conflicts.
- No development/review test may use the live database. The isolated override is
  `HABIT_TRACKER_DATA_DIR`; it also suppresses the end-of-day reminder in tests.

## Phase 1 review checkpoint

Round 1 scored **8.1/10** (weighted 8.13): notes could complete a Check, freezes
overwrote notes, weekly outcomes/shades disagreed, privacy leaked names, Quantity
had no correction UI, and year analytics were slow. Those findings were fixed.

Round 2 scored **8.9/10** (weighted 8.935): 36 tests and 13 independent engine
cases passed. Note/freeze/weekly/quantity/privacy/migration fixes were verified.
The remaining clock propagation caused idle stalls; isolation was implemented.

Round 3 has **no final score or approval** because the user paused. The full
independent progress report is [phase1-review-round-3.md](phase1-review-round-3.md).
Important saved evidence:

- This continuation's builder reran `npm run typecheck`, `npm test` (**36/36**),
  `npm run build`, and `git diff --check` successfully.
- Oldest and V2 migrations passed original-field comparisons; V2 productivity
  JSON survived exactly. Oldest `productivityPreserved:false` means no record
  existed to compare, not data loss.
- Previous packaged executable checks **14/14** and supplement **8/8** passed.
  Initial UI suite **13/14** retained a privacy timing/selector discrepancy; the
  supplement and packaged checks verified computed blur/native labels.
- Fresh idle Home/Statistics p95 frames **17.2/17.1ms**, probe **21.0/21.2ms**, on
  20 habits and 7,320 logs. Warm active Statistics: frame **17.6ms**, probe
  **21.2ms**, **95.6% idle**, zero main-content mutations and four badge mutations
  over four seconds.
- Final already-running clock regression exited successfully before cleanup:
  reload kept the deadline, exactly one 15-second session and one real notification
  invocation, no duplicate on focus/visibility, immediate Statistics update, and
  simulated renderer midnight rollover. Active probe p95 **20.9ms** on both routes.
- Earlier cold/unwarmed/debugger samples were slower (375–623ms p95). Preserve
  them as cold-load/measurement limits; do not assert universal device performance.
- Native Windows notification/sound delivery, physical overnight/DST crossing
  and actual installer upgrade were not established by this round.

The reviewer fixed its harness, not application source: unique fixture/preset
names, conditional notification enabling, URL debugger breakpoints surviving
reload, exact accessible names, `data-date` rather than localized-date comparisons,
and warmed sampling before debugger instrumentation.

## Remaining master build

The complete supplied master brief is saved verbatim in
[master-build-brief.md](master-build-brief.md). Root `DESIGN.md` is also verbatim.
SHA-256 comparison confirmed both match the original attachment sources.
[Foundation contracts](foundation-contracts.md) are documented but **not
implemented**. Proposed dependencies in [component sources](component-sources.md)
are not installed, except existing Recharts/Lucide. Verify stable versions and
licences before installing; do not treat proposal snapshot versions as locked.

Sequence:

1. Close Phase 1 review; retain any explicit limitations.
2. Stage 0 alone: derive Linear tokens/local fonts, component kit and typed nav/
   routes/settings/Home/IPC registries. Add minimal Study contracts/migration 4.
   Test, commit to main and tag before starting Stage 1.
3. Isolated branches/worktrees: A owns main-process Focus, tray, shortcuts and
   opt-in Focus Guard; B owns Plan, Journal/FTS, Review, Goals and reminders;
   C owns restyled pages, minimal Study UI and command-palette contents.
4. Integrate A, B, C in order; validate complete backups/migrations; independent
   real-Electron review; package, upgrade and verify the installed Windows app.

The user explicitly requested parallel work and an independent reviewer in the
original brief. The reviewer must actually build/run/click/screenshots/test the
app. Rubric: completeness20%, correctness25%, design25%, code15%, UX15%. Fix and
resubmit below9, stopping at9+, five rounds or two consecutive no-gain rounds.
Loop limits do not silently excuse release blockers.

Study did not exist despite the master's assumption. Implement only the minimal
curricula/ordered topics/learned progress/graded spaced-review queue needed by the
master screens and goals; do not invent an unspecified separate Phase 2 scope.

Focus Guard is opt-in. Use isolated hosts fixtures and dedicated harmless process
targets in automation. Preserve unrelated hosts entries; clean up on stop/end/
quit/startup recovery; include Repair/emergency exit. Windows is the primary
verified OS. Keep per-OS interfaces and disclose unsupported operations.

## Saved history, evidence and installer

Visible root-session user/assistant messages are in
`docs/session-history/2026-09-30.md` and `2026-10-01.md`. Tool activity/decisions are
consolidated here. Internal reasoning, system/developer prompts, cookies,
credentials, live databases and raw tool payloads are not conversation exports.
Selected result JSON, screenshots and review harness snapshots are versioned in
`docs/review-evidence/phase1-round3/`; local full artifacts remain in ignored
`.review/`. Tests there use a locally installed Playwright path; adapt that path
if moving to another machine. Do not run harness snapshots from `docs/` as-is.

The local Phase 1 installer is `release/desktop/Habit Tracker Setup 1.1.0.exe`,
111,526,290 bytes, SHA-256:
`B02CF8796F9BDFE588A9680527253D669B7126E8ED128180B8639A6CCA54AB6D`.
Generated installers/bundles, node_modules and review databases remain ignored;
source/configuration/tests/history/evidence are committed. Rebuild with `npm ci`
then the documented scripts. No push or remote publication was requested.

On this Windows sandbox, compiler subprocesses initially failed with `spawn
EPERM`; the same tests/build passed when approved outside the sandbox. Native
Electron launches and Win32 process inventory also needed sandbox escalation.
Treat these as environment restrictions, not application failures.

The practical finish line is [release-readiness.md](release-readiness.md): all
planned modules integrated, independent review completed, and the same reviewed
revision installed on Windows with retained data, backup restoration, timer/
restart/Guard cleanup, accessibility, offline and performance checks. A Phase 1
installer alone is not the completed app.
