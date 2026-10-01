# Tempo: remaining milestones and release acceptance

The scope is the user-supplied [master brief](master-build-brief.md), with the
checkout-specific decisions in [the implementation plan](master-build-plan.md).
This document defines a finite release. New ideas after these requirements are
met belong to a later release; they do not keep this build open indefinitely.

## Current checkpoint

Phase 1's habit-engine implementation and clock-isolation fix are present.
On October 1, 2026, the builder reran type checking, all 36 project tests and the
production build successfully. Existing Round 3 artifacts record passing old
schema migrations, packaged-app flows and improved renderer performance.
Work is now paused at the user's explicit request. The final already-running
timer/midnight regression passed before cleanup; the independent reviewer saved
[an incomplete progress report](phase1-review-round-3.md) without a final score.
Phase 1's installer is not the completed master
build. The larger modules below have not been integrated into this checkout.

## Remaining long-running milestones

| Milestone | Required outcome | Completion evidence |
| --- | --- | --- |
| 1. Close Phase 1 | Preserve advanced habits, notes, schedules, freezes, pauses, privacy, tasks and focus; finish the performance fix review | Independent real-Electron report, test/build results, migration preservation, packaged smoke; remaining limitations stated |
| 2. Foundation | Linear tokens, local Inter/JetBrains Mono, shared UI families, typed navigation/routes/settings/Home/IPC registries, minimal Study contracts | Token/component documentation, licences, build, isolated migration tests, foundation commit and tag before Stage 1 |
| 3A. Desktop Focus | Main-process timestamp timer; restart recovery; tray, close-to-tray, configurable conflict-aware shortcuts and phase notifications; optional Focus Guard | Timer and tray flows in Electron; exactly-once sessions; process/hosts matching, crash recovery, cleanup and emergency-exit checks using isolated fixtures |
| 3B. Reflection | Up to three daily priorities; evening review, journal with FTS search, saved weekly reviews, linked goals and configurable reminders | Persistence, date boundaries, journal search, review aggregation and goal progress checks; Home widgets integrated |
| 3C. Restyle and Study | Consistent restyle of all screens; curriculum/topic progress and graded spaced reviews; command palette actions | Existing behaviour retained; accessible light/dark screens at desktop and narrow sizes; study/review persistence and keyboard workflows |
| 4. Integration | Merge Focus, Reflection, then Restyle; wire shared widgets, settings and statistics; make complete backups compatible | Full suite/build; old and new backup/import checks; original identifiers/history preserved; no competing timer ownership |
| 5. Release | Review the complete app, package it, upgrade the desktop installation and verify the installed release | Independent release review plus installed-app smoke and data-preservation evidence, release commit/tag, licence list and concise user guide |

The Study implementation is the minimal curriculum/topic/progress/review system
needed by the master brief. The brief assumes a Phase 2 Study system already
exists, but no separate Phase 2 specification or implementation was found.

## The final task: verify the installed Windows release

After integration and the independent review loop, build the installer from the
same reviewed revision, upgrade the existing desktop app, and test that installed
application. Record the installer version/hash and source revision. The release
is ready for full use when all of the following have evidence:

- Every required screen and core workflow is available: Home, Plan, Habits,
  Tasks, Focus, Study, Statistics, Goals, Review, Settings and journal browsing/
  search. Existing weekly/history/detail/notes/archive/export flows still work.
- Real legacy fixtures upgrade without losing original habit/log fields or
  productivity history. All migrations are versioned and transactional, with
  pre-upgrade safety copies. The installed upgrade retains the real workspace.
- All current modules are included in backup export. Legacy backups remain
  importable, complete backups can restore into a clean isolated workspace,
  and invalid input is rejected without partial writes.
- Timer state survives window close and application restart, completed sessions
  are logged once, breaks cannot fabricate focus time, and Home/Statistics update
  after genuine data changes without continuous expensive idle rendering.
- Local date rollover and due schedules work across midnight, week/month/year
  boundaries and DST. Restart and sleep/wake reconciliation are checked.
- Focus Guard is opt-in and its emergency exit is always available. Blocking is
  removed on stop, end, quit and startup recovery; unrelated hosts entries are
  preserved. Automated destructive-path tests use dedicated harmless processes
  and isolated hosts files. Windows elevation/repair behaviour is exercised.
- Every screen is reviewed in light and dark at two window sizes, with keyboard
  navigation, focus restoration, privacy coverage and reduced-motion handling.
- The full test suite, type check and production build pass. The independent
  reviewer actually launches and clicks the app and the packaged build, reports
  the weighted rubric, and provides screenshots and reproducible findings.
- The installed app opens from its desktop shortcut, loads the retained data,
  works offline, persists new changes, and relaunches correctly. Tray/shortcuts,
  native notification/sound delivery and OS-specific limitations are recorded.
- No known issue blocks daily use or risks data loss. Lesser limitations are
  disclosed with their scope. A release commit/tag, component licence notices,
  backup instructions and recovery instructions accompany the installer.

## Review stopping rule and readiness

The user's review loop stops at a score of at least 9/10, after five rounds, or
after two consecutive rounds without meaningful gain. The scoring weights are
feature completeness 20%, correctness 25%, design fidelity 25%, code quality 15%,
and UX/accessibility/responsiveness 15%.

A round limit ends the review loop; it does not turn a broken workflow into a
passing acceptance check. Any unresolved release blocker must remain explicit.
Likewise, a score alone cannot establish installed-app readiness. The practical
finish line is the reviewed, installed Windows release passing the checks above.
