# Latest installed checkpoint — October 4, 2026

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

# Build status — October 3, 2026

Latest installed release: **Tempo 1.5.0**, independent **9.24/10**, **114/114 tests**,
production build, **5/5 exact-package checks**, and final installed post-recovery
quit/relaunch/data checks pass. Source is saved on private `mazidhee/tempo`; the
desktop shortcut opens the reviewed package. All 1,823 active supplied topics and
original owner records/preferences are retained. See [redesign release](redesign-release.md)
and [independent review](study-release-review.md) for the rubric, hashes, safety
copies and the unconfirmed cause of the initial installed-data discrepancy.

## Previous release — October 2

Latest installed release: **Tempo 1.4.0**, independent **9.27/10**, 101/101 tests,
production build, exact package smoke 5/5 and installed post-recovery restart/data
checks pass. See [UX release](ux-release.md) and [UX review](ux-update-review.md).
The historical dataset discrepancy remains unexplained; recovery copies stay
archived and the original active 1,823 topic identities/progress remain intact.

## Historical foundation checkpoint — October 1

Phase 1 is independently accepted at **9.2/10** (weighted 9.160), with the
recorded limitations in [round 3](phase1-review-round-3.md).

## Foundation

Implemented: approved Linear dark/derived-light tokens, bundled Inter and
JetBrains Mono, official free shadcn kit, typed route/navigation/settings/Home
registries, extensible typed IPC, main module lifecycle, custom window controls,
and additive Study migration 4 with curricula/topics/graded review history.
Existing habitAPI and compatibility routes remain available. New pages are kept
out of navigation until their implementations are mounted.

Validation: typecheck, 40/40 unit tests, production build, whitespace check and
actual Electron smoke with an isolated SQLite database pass. The smoke exercised
legacy routes, command dialog, privacy, both themes, narrow viewport, offline
local font loading and Study refresh persistence. Migration tests cover retained
legacy rows, repeatability, rollback, nesting, archived curriculum restrictions
and DST scheduling. Evidence: `.review/phase1/foundation-1790855397401/`.

These checks validate the shared Foundation, not the full master release. The
page restyle, main-process Focus/Guard and Reflection remain Stage 1 work.
Foundation is being committed/tagged before isolated Stage 1 worktrees begin.

## Next

A: Focus engine, tray, shortcuts, opt-in Guard and cleanup.
B: Plan, Journal/FTS, weekly Review, Goals and reminders.
C: complete Linear restyle, minimal Study UI, settings and command actions.
Integrate A, B, C; include all new data in compatible backups; perform the
independent whole-app review loop; package and verify the installed upgrade.

The installed desktop app has not yet been upgraded to this master revision.
