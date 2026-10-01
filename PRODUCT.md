# Tempo

<!-- impeccable:product-schema 1 -->

## Platform

web

React interface inside an Electron desktop application. Windows is the primary
verified operating system; this is an offline desktop workspace, not a hosted site.

## Users

The owner uses Tempo personally to organize habits, tasks, focused work and study,
then plan and reflect on progress. The user confirmed the saved master brief on
October 1, 2026.

## Product Purpose

Bring daily commitments, focus time, learning progress and reflection into one
local workspace. The build succeeds when the integrated Windows application
preserves existing records and passes the release acceptance checks.

## Operating Context

Daily habit check-in, task management and focus sessions; morning planning,
evening journaling and weekly review. All production resources must work offline.
Testing uses isolated databases, never the owner's live workspace.

## Capabilities and Constraints

Existing habits, logs, notes, locking, history, analytics, tasks, focus presets,
privacy and backups must remain available. The authorized master build adds
main-process focus timing, tray controls, optional Focus Guard, daily planning,
journal search, weekly reviews, linked goals and minimal curriculum/topic study
with graded spaced review. Versioned transactional migrations preserve data.
Focus Guard is opt-in, with cleanup, repair and an emergency exit. Phone blocking
is outside scope. Existing SQLite uses Electron's bundled node:sqlite.
Only free dependencies and component sources may be used.

## Brand Commitments

The user-facing name is Tempo. The original Habit Tracker application identity,
user-data directory and habits.db filename remain intact. The supplied DESIGN.md
and master brief prescribe the Linear design system and its desktop adaptation.

## Evidence on Hand

The authoritative scope is docs/master-build-brief.md. Implementation decisions
and acceptance requirements are in docs/master-build-plan.md,
docs/foundation-contracts.md and docs/release-readiness.md. Phase 1 review evidence
is saved under docs/review-evidence/phase1-round3; it demonstrates isolated
fixtures, not the owner's real activity. No commercial claims are required.

## Product Principles

- Preserve the existing workspace and its history.
- Keep all production functionality local and offline.
- Compute progress from real logs, never fabricate completed work.
- Give the user control over reminders, blocking and recovery.
- Validate the actual Electron application before claiming release readiness.

## Accessibility & Inclusion

Keyboard navigation, labelled controls, visible focus, dialog focus restoration,
privacy coverage, light/dark appearance, narrow-window layouts and reduced-motion
support are required by the saved brief and acceptance checklist.
