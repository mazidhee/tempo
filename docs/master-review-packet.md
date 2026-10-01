# Master release: independent review packet

This is an acceptance checklist, not a completed review. The separate reviewer
must exercise the real Electron app and write its own findings and score.

Authority: the user requests in `master-build-brief.md`, Phase 1 requirements,
`PRODUCT.md`, `DESIGN.md` and `release-readiness.md`. Windows is the primary OS.
The actual stack uses bundled node:sqlite rather than the brief's stale native
addon assumption. Foundation tag: tempo-foundation-2026-10-01, commit 33f3c19.

## Required checks

- Run typecheck, full tests, production build and the packaged executable.
- Launch with a unique HABIT_TRACKER_DATA_DIR, using the real preload and SQLite.
  `scripts/electron-runtime.cjs` provides a local CDP harness. Its cleanup is
  development-only; never point it at the owner's live database.
- Click Home, Plan, Habits, Tasks, Focus, Study, Statistics, Goals, Review,
  Journal and Settings. Capture every page in both themes at desktop and narrow
  window sizes. Check local fonts, icons, token colours, typography, spacing,
  hairlines, keyboard navigation, focus restoration, reduced motion and overflow.
- Exercise existing habit create/edit/archive/restore, Check/Quantity/Avoid,
  schedules, weekly/history/detail, notes, locking, freezes/caps/pauses/recovery,
  privacy and canonical heatmaps/rates/streaks. Not-due days stay neutral.
- Task quick-add, edit, subtasks, completion, due/priority/tags/project filters,
  deletion and start-focus linkage remain functional.
- Focus preset CRUD/custom seconds, pause/resume/skip/reset, exact-once session
  completion, surviving renderer refresh/window close/main restart and elapsed
  deadlines. Confirm main ownership protects against stale renderer saves.
  Tray, shortcuts/conflicts, phase notification/sound invocation and focus links.
- Guard opt-in/focus-only/paused/break policy, gentle app matching, attempt count,
  strict mode and globally reachable emergency exit. Test add/remove, unrelated
  host preservation, crash/startup cleanup, stop/end/quit and Repair using isolated
  hosts fixtures. Never alter real hosts or terminate unrelated programs in tests.
  Inspect the actual elevation handler and state any native validation limits.
- Study curriculum/topic/nesting CRUD/archive, learned progress, graded reviews,
  scheduling and persistence. Verify links to Focus, Plan and Goals.
- Plan maximum three priorities and Study plan; evening completion/journal/
  sleep/energy; journal browse/edit/FTS search; generated saved weekly reviews
  and editable prompts; all goal kinds and computed progress; Home widgets.
- Reminder settings and persisted duplicate suppression; heatmap journal lookup.
- Legacy database upgrade retains original rows/IDs/history; every schema change
  has a marker and safety backup. Full backup import into a clean fixture, repeat
  merge, collision remapping, old formats, malformed rejection without partial
  writes and inactive Guard after import.
- Profile active Home/Statistics briefly to catch the previous broad clock
  rerender regression. Assess cold navigation separately from warmed timing.

## Report

Give one score and justification for each: completeness (20%), correctness
(25%), DESIGN fidelity (25%), code quality (15%), UX/accessibility/responsiveness
(15%). Compute the weighted 1–10 result. Include exact commands, tested source
revision, screenshots, reproducible bugs and limitations. Score below 8 requires
prioritised specific fixes; 8+ requires the highest-impact 3–5 improvements.
The user loop ends at 9+, five rounds or two rounds without meaningful gain.
Do not certify native delivery, installed upgrade or physical overnight behaviour
from source inspection or mock calls alone.

The user expressly requires the reviewer to launch/click the app, superseding
the screenshot-only restriction of a generic finish-review workflow. The reviewer
is independent of all three builders. Code-first has no approved visual comp;
the supplied design system and Foundation direction contract are the visual bar.
