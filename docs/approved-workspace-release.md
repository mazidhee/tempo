# Tempo 1.8.0 — installed workspace update

Completed October 6, 2026. The owner's selected layouts ship, including Study A,
Journal A, Review A, Work E and the later Focus controls B bottom dock. Home,
sidebar order/top Search, waveform logo and detailed Statistics remain protected.

Source implementation checkpoint: `fe4521b`. The final correction commit follows
this document in Git. Pre-change rollback: `4cad8b0`; earlier accepted release:
`tempo-1.6.0`. Roll back code only; never replace current data with an older backup.

## Verification

- 131 unit tests, typecheck and production build passed during implementation.
- Final exact-package run: `.review/approved-workspace-1791325794898/results.json`;
  11/11 workflow groups including phase switching, tracking, presets/locking,
  Work typography, task-to-plan completion, journal autosave and restart retention.
  No renderer errors or horizontal overflow in measured route captures.
- Independent review scored the three earlier material fixes resolved. Fresh
  Work/Focus review returns `ship` at source scope: Work 9.5 Design/9.5 UX;
  Focus 9.5 Design/9.4 UX. These estimates **do not establish the owner's 9.9 target**.
- Design documentation completed with incumbent authority preserved; the
  preexisting missing `.impeccable/design.json` sidecar was reported, not repaired.
- Preview tiny-text finding was fixed by raising the two 11px metadata styles
  to 12px. No finding was suppressed or left standing in that correction.

## Installed owner-data acceptance

The owner confirmed Tempo fully closed, including its tray icon, and authorized
finishing the update. Process inspection confirmed no running Tempo instance.
`scripts/owner-baseline.cjs` created a fresh consistent local safety copy before
installation. No CSV reimport or data restore was performed.

Baseline and safety copy remain local and Git-ignored:
`.review/owner-upgrade-1791325973927/baseline.json` and `before-upgrade.db`.
`redesign-acceptance.json` in the same folder records the separate two-launch gate.
Every original keyed record, JSON field and exact saved preference compared equal
after both launches; SQLite integrity was OK. All six habits, 66 imported events,
three active curricula and 1,823 active topic identities/progress remain. Tasks,
sessions, presets, archived curricula, journals and saved reviews are retained.
The installed pages rendered offline without renderer errors.

Installed executable: `%LOCALAPPDATA%/Programs/Tempo/Habit Tracker.exe`.
The installed ASAR matches the reviewed final package exactly.

| Artifact | SHA-256 |
| --- | --- |
| `release/desktop/Habit Tracker Setup 1.8.0.exe` | `686e02c80a094eeb4cc78ac5586e650c0dbd94067c908c9625516658c58dada7` |
| Packaged and installed `resources/app.asar` | `4a9254ccbc14471bb7fe74830b268f7217f38f830a7ad28880a21559592e23c9` |

Private owner screenshots and database copies stay outside Git. The 78 committed
review images contain only isolated fictional fixtures. No remaining installed
data gate is pending; visual quality still needs the owner's judgment and the
9.9 target remains unverified.
