# Current work — October 8, 2026

The installed app remains **Tempo 1.8.0**, tag `tempo-1.8.0`. Current work is an
isolated knowledge-workspace selection preview at `http://127.0.0.1:5222/`.
Build with `node scripts/knowledge-preview-build.cjs`, serve with
`node scripts/knowledge-preview-server.cjs`. No production app code or owner
database has changed in this preview work.

Latest owner correction: **do not change installed Home**. Owner approved
**A Classic workspace** and asks for more Notion-like care throughout. Notes
must open at an organised nested folder library, support creating notes, and
use Markdown files in production. Graph must be **only a collapsible right
panel**, with records as nodes and actual relationships as edges. Main sidebar
must be owner-reorderable. Remove standalone Review; keep Statistics exclusively for charts and metrics. Saved review records stay retained. Original logo,
detailed Statistics, Study counts/time/progress/current topic and owner records
remain protected. No AI. Rehab import already performed by owner; never reimport.

Five revised Notes choices: A Classic workspace, B Folder table, C Compact
navigator, D Tabbed notebook, E Visual library. They use real Tiptap editing,
exact vendored Yoopta MIT toolbar CSS, nested folder paths, browser preview
retention, Markdown serialization/export preview, and accessible sidebar order.
Graph has ~100 typed fictional records with declared relationships, settling
local force layout, pan/zoom/filters/search, note navigation and record inspection.
Sidebar Graph/Review entries removed; Statistics reflection blocks removed at the owner’s request.
Prototype waveform is hand-drawn, not established byte-identical to production.

Browser checks: new note in selected folder, slash heading insertion, reload
retention, Markdown frontmatter/heading/paragraph output, nested compact folder
drawer, sidebar up/down ordering and reload retention, empty/keyboard search,
graph opening the right note/project, and reflection retention after navigation.
All five Notes desktop-light and 390px captures have no horizontal overflow.
No browser console errors. Actual Markdown download was not confirmed by the
in-app browser; generated export content is confirmed. Native filesystem Markdown
storage, SQLite graph integration and any migration/release acceptance are **pending**.
No numeric 9.9 design/UX claim is established.

See [preview direction](knowledge-preview-direction.md),
[source audit](knowledge-workspace-source-audit.md) and
[prototype README](prototypes/knowledge-next/README.md). Capture evidence is local
under `.review/knowledge-options/revision-*`. Keep this checkpoint in version
control. Get the owner's concrete visual choice before implementing changed app
screens, as requested; don't replace production `DESIGN.md` with unapproved options.

The fresh [selection review](knowledge-preview-review.md) is **PASS** after fixing
C's clipped navigator labels and recapturing the sidebar-order controls. A new
five-choice question is pending for the revised Notes layouts. This pass does
not establish a 9.9 design score or production readiness.

# Installed release — October 6, 2026

Tempo **1.8.0** implements the owner's thirteen selections from the 75-layout
studio: Tasks E, Plan E, Habits A, History B, Recovery A, Work E, Focus A, Search D,
Goals A, Settings B, Study A, Journal A and Review A. The owner then selected
**Focus controls B — Bottom dock** in the five-option preview at
`http://127.0.0.1:5221/`. Work keeps the incumbent sans heading at weight 600.
See [approved direction](approved-workspace-design.md) and
[implemented design record](approved-workspace-documentation.md).

The bounded review resolves Plan time readability, truthful Study continuation
and Settings navigation; its estimates are **Design 9.5 / UX 9.5**. The fresh
[Work/Focus review](focus-dock-review.md) returns `ship`: Work **9.5/9.5**, Focus
**9.5/9.4**. These are source/capture judgments; the owner's requested **9.9/10
each is not established**. The canonical packet has 78 screenshots across thirteen
surfaces, two themes and three widths, plus six contact sheets. The latest checked
exact-package result, `.review/approved-workspace-1791325794898/results.json`, has
**11/11 passing workflow groups**, second-launch retention, no page errors and
no overflow in 72 measured route captures. Search is visually captured but not
width-measured in that JSON. See [bounded verdict](approved-workspace-review.md)
for the distinction between functional results and the recapture-only packet.

**Tempo 1.8.0 is installed; separate owner-data acceptance passed.** After the
owner confirmed a full quit, a fresh consistent backup was taken. Both installed
launches preserved every original record and exact preference, all 66 imported
events and 1,823 active topics; SQLite integrity and offline rendering passed.
The installed ASAR equals the reviewed package. See [release record](approved-workspace-release.md).

Source checkpoint `fe4521b` precedes the final correction/release checkpoint;
use tag `tempo-1.8.0` for the installed version. Preserve Home, sidebar order/top Search,
waveform, detailed Statistics and every owner record/control. Study counts/time/
progress/current topic remain required. The owner imported the Rehab CSV already:
do not run the pending import script, reimport or restore an older snapshot.
No Outlook or meetings integration. The 1.6 tag is a code rollback reference only.

Root `DESIGN.md` remains the incumbent authority. Its historical specimen format
and the missing `.impeccable/design.json` are reported preexisting drift, left
unchanged by the scoped documentation pass.

# Previous installed checkpoint — October 4, 2026

Tempo **1.6.0 is installed**, with the existing desktop shortcut intact. Daily
Plan A supports expanded inline priorities; Tasks and search use calm lists;
normal Journal is a full writing canvas; Review has a saved daily line graph;
Goals show recorded progress first. Existing features and local privacy remain.

Independent rounds **8.87 → 9.20 → 9.51**; final **Design 9.5 / UX 9.5** meet the
stricter user gate. **117/117 tests**, production build, **13/13 exact-package
workflow groups**, graceful Journal preference restart, and installed two-launch
all-record/offline checks pass. All three active curricula and **1,823 original
active topic IDs/progress** remain. Archived recovery copies are retained.
Migration **206** preserves old review totals/writing and marks unknown daily
values; use Update activity explicitly for their new trend. The earlier database
discrepancy still has no proven cause; do not discard copies or overwrite newer
preferences. Source implementation `8392f50`; final release tag `tempo-1.6.0`.
See [daily workspace release](daily-workspace-release.md) and
[independent review](daily-workspace-review.md) for evidence and limitations.

# Latest checkpoint — October 3, 2026

Tempo **1.5.0 is installed and open**, with the existing desktop shortcut intact.
Dedicated curricula, Home continuation, compact Today habits/deletion, distinct
Plan/Journal/Review/Goals pages, rich nested daily outlines, local covers with
small controls, and manual encrypted backups ship. No short learning log.
Logseq journal-frame source is ported and attributed under AGPL-3.0-only.

Review rounds 8.88 → 9.24; 114 tests, production build and 5 exact-package groups
pass. Final installed read-only comparison across two launches preserves every
pre-upgrade record and exact settings, with 1,823 active original topics. The
initial installed database discrepancy has **no proven cause**; its reset copy
and fresh consistent baseline are retained. Read [redesign release](redesign-release.md)
before doing further recovery. Never discard archived copies or overwrite current
preferences from an older backup. Source main and rollback/release tags are on
private `mazidhee/tempo`; owner data remains ignored and separate.

# Previous checkpoint — October 2, 2026

Tempo **1.4.0** is installed from the reviewed package. The UX request is complete:
compact selected study plans/search pickers, responsive timer/partial Guard errors,
centered collapsed sidebar and independent solid palettes. Review rounds 8.62 then
9.27; 101 tests, 5 packaged groups and installed post-recovery persistence pass.
Read [UX release](ux-release.md) first for final hashes, backups and limitations.
The older dataset discrepancy has no proven cause. Current topic identities and
progress are retained; the old paused phase ended with explicit user permission;
missing older records were merged and duplicate recovery curricula archived.
There are 1,823 active supplied topics and 1,823 archived recovery-copy topics.
Do not restore an older snapshot over current preferences or silently delete the
archived copies. Source/package acceptance and installed recovery remain distinct.

# Historical continuation — October 1, 2026

The user resumed in the desktop chat. Foundation passes typecheck, 40 tests,
production build and actual Electron smoke. See build-status.md for current
state. Historical pause details below are retained for provenance; they are not
current instructions to pause. No new product discovery or approval is needed.

# Session handoff — resumed October 1, 2026

## Current continuation

The user explicitly resumed development, reconfirmed the saved master brief and
chose code-first construction with visual review. PRODUCT.md records that scope;
.impeccable/config.json records the workflow preference. Impeccable context and
the installed Frontend UI Standards skill were read. Phase 1 Round 3 independent
review is being completed before Foundation implementation. The historical pause
instructions below are superseded by this resume request.

## User's latest instruction

Pause development. The user wants to install new skills, start a new session,
and continue from there. Save project history and commit the current state to
Git so no context or version history is lost. **Do not resume development until
the user asks.** The reviewer was stopped, recorded its progress and cleaned up
its isolated Electron test processes. No background build/review work remains.

Design tooling was subsequently installed while the app stayed paused. See
[installed-skills.md](installed-skills.md) for the global skills, project
Impeccable hooks, and the LobeHub credential-registration decision still pending.

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

October 8 correction: A Classic workspace is approved. Remove reflection prompts from Statistics; preserve saved review data. New request: a tiny always-on-top Focus timer with pause/resume outside Tempo; five visual control options must precede implementation.
