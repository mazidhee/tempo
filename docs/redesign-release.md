# Tempo 1.5 daily workspace redesign

Installed release, October 3, 2026. Independent review accepted **9.24/10**;
**114/114 tests**, production build, **5/5 exact-package checks**, and final
installed post-recovery quit/relaunch and owner-data preservation checks pass.
The existing Tempo desktop shortcut opens version **1.5.0**.

The Electron/React/TypeScript/SQLite stack is retained. Tiptap 3.31.4 adds semantic
rich text using its official [React integration](https://tiptap.dev/docs/editor/getting-started/install/react)
and [JSON persistence](https://tiptap.dev/docs/editor/core-concepts/persistence).
Migration 203 adds optional Study continuity; migration 204 adds rich journal JSON
and local cover metadata. Existing journal text, topic IDs and history remain intact.

Delivered candidate: source history on private `mazidhee/tempo`, stable rollback
tag `tempo-before-redesign-1.4.0`, compact Today-first habits with deletion safety
copies, dedicated Study curricula and local banners, Home continuation, rich dated
Journal, separate Plan/Journal/Review/Goals routes, expandable weekly review
details, and optional encrypted backup Settings. No short session learning log.

Initial validation: typecheck, production build and 110/110 tests pass. Builder
launched the real Electron app in an isolated database, imported all 1,823 supplied
topics, clicked the six redesigned pages and saved a journal. No renderer errors.
Screenshots: `.review/redesign-builder-1791050109407/`.

Dependency audit: no production dependency vulnerabilities. The packaging-only
electron-builder dependency chain has 8 reported high findings inherited from
http-cache-semantics 4.2.0. The registry currently offers no patched newer version;
the suggested automatic fix downgrades electron-builder. It was not blindly
applied. Those tools are excluded from the staged application package.

Round 1 independent score: **8.88/10**, with 110 tests and 11 real-Electron flow groups. See study-release-review.md for the full original rubric. Improvements implemented before Round 2: per-day local Plan draft recovery, continuation advancing beyond a completed late selection, selected-topic inspector above the browser with scroll visibility, and inline Journal search controls. The user also requested small cover controls and Logseq journal integration. The journal now has nested keyboard outlines, fold state, and recent dated pages. Migration 205 adds explicit defaults for legacy list-item fold state while preserving all journal words and timestamps.

The Logseq journal-item frame is ported from source commit 22a29b30dee3b3930cf49bba50454650c31d2a07. Original source, licence, adaptation date and provenance are retained. The project and packaged notices use AGPL-3.0-only; personal data stays separate, and the source repository stays private.

## Final release evidence

Round 2 scores: features 9.4, correctness 9.3, design 9.1, code 9.2,
UX/accessibility/responsiveness 9.2. The mandatory stopping threshold was met.
The separate reviewer ran the real app, full tests, the exact Windows package
twice, and visually checked desktop and narrow screenshots. Full rubric and
results: [independent review](study-release-review.md).

The installer completed with exit code 0. Installed ASAR matches the independently
reviewed package by SHA-256. Seven owner pages render offline without renderer
errors. Original database rows, IDs, progress, sessions, tasks, presets and exact
settings were compared against the consistent pre-upgrade SQLite backup across
two complete launches; integrity_check returns `ok`. Migrations 203–205 are applied.

Preserved owner data: 6 habits, 6 logs, 3 tasks, 2 sessions, 3 presets,
2 weekly reviews, 5 focus-break events, 7 retained curricula, 3 import records,
and 3,646 retained topics (1,823 active original topics and 1,823 archived recovery
copies). The three active supplied curricula remain visible. No old focus phase
was ended during this update; the saved timer was idle.

Important limitation: the first installed checks saw the database independently
change to habit-only data with default profile settings after a full-data migration
safety copy existed. Its cause is not established. The reset database and sidecars
were retained, the **fresh October 3 pre-upgrade backup** was recovered while Tempo
was closed, and the final read-only installed comparison passed across two launches.
Do not claim that an underlying cause was fixed, or restore older backups over
current preferences. This is separate from the passing source/package review.

Local evidence (ignored; never pushed):

- `.install-check/personal-upgrade-1791054150883/before.db`: consistent original data.
- Same folder `unexpected-reset-habits.db` and sidecars: preserved discrepancy.
- Same folder `redesign-acceptance.json` and `installed-*.png`: final installed checks.
- `.review/study-package-1791053815593/result.json`: independent exact package checks.

Installer `release/desktop/Habit Tracker Setup 1.5.0.exe`, 112,135,638 bytes:
SHA-256 `8b4342ff5b65bebfa20ef572c2c325fd4978b963425f073a2be351d54af2dac4`.
Installed/package ASAR:
`6160c2d2198d145bbeb906d5530bf2f6a1b8efdbc2bba725105b83cc181cd9a9`.

All release source and review scripts are saved in private `mazidhee/tempo`.
Rollback source tag: `tempo-before-redesign-1.4.0`; release tag: `tempo-1.5.0`.
Database backups stay separate from Git source history. Settings → Backups provides
local snapshots and an explicit encrypted upload to the private `tempo-backups`
branch. No real owner-data GitHub upload was performed during testing; the owner
must choose a recovery password and retain it. Offline remains the default.

Impeccable finish verdict: accepted. `DESIGN.md` records the final compact habit,
dedicated document and cover-control patterns. Source provenance is retained under
`third-party/logseq/`. Cover/profile rasters are user-supplied local content; no
reference screenshot assets were copied into the application.
