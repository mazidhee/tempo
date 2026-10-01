# Tempo release acceptance

The finite scope is the user-supplied [master brief](master-build-brief.md), with
checkout decisions in [the implementation plan](master-build-plan.md).
Implementation evidence is in [master integration](master-integration.md), and
actual use is described in [the user guide](user-guide.md).

## Current checkpoint

Phase 1 was independently accepted at 9.2/10. Foundation was committed at
`33f3c19` and tagged before Focus, Reflection and Restyle integrated in the
required order. Type checking, the full 82-test suite and production build pass.
Full backups and shared flows have real-Electron evidence with isolated data.

The frozen 1.2.0 production candidate is `1433cb46`; the Windows installer is
built. Independent packaged round 1 scored 8.88/10 and required three layout
fixes. Independent round 2 verified all three fixes and accepted the frozen
package at **9.18/10**. The authorized Windows upgrade to 1.2.0 also passed
installed acceptance. The original user-data path, preferences and three presets
were retained; offline launch, persistence and relaunch checks passed. Live native
Guard operations and physical notification/sound delivery remain unverified.

## Milestones and evidence

| Milestone | Required outcome | Current evidence |
| --- | --- | --- |
| Phase 1 | Preserve habits, notes, schedules, freezes, pauses, tasks, Focus and privacy | Independent Phase 1 acceptance and retained regression coverage |
| Foundation | Linear tokens, offline fonts, shared kit, typed registries and Study contracts | Tested commit/tag, component sources/licences and migration 4 checks |
| Focus | Main timer, recovery, tray, shortcuts, optional Guard and emergency exit | Suite and real-Electron flows; Windows script fixtures and own-session enumeration; live native limits below |
| Reflection | Daily priorities, journal/FTS, saved reviews, goals and reminders | Persistence, aggregation, search and Home integration checks |
| Restyle and Study | Existing behavior retained, both themes, narrow layouts and minimal Study | Electron capture matrices, Study tests and independent confirmation of all three final layout changes |
| Integration | A/B/C merge order, shared widgets, complete compatible backups | 82 tests/build; format 3, legacy import, collision and timer ownership checks |
| Windows release | Review the frozen package, upgrade installed app and verify retained workspace | Installer built; independent acceptance at 9.18/10; actual installed 1.2.0 acceptance passed |

Installed evidence is `.install-check/master-upgrade-1790863834869/acceptance.json`,
with `installed-home.png` and a consistent pre-upgrade `before.db` in that
directory. Installed ASAR SHA256 matches the independently reviewed candidate:
`F349E4FF2CCCA0A85BEA23D1764D22252102E986F436D05E24BBE5B8ED75A369`.
The installed app uses `C:\Users\USER\AppData\Roaming\habit-tracker`.

Installer: `release/desktop/Habit Tracker Setup 1.2.0.exe`, SHA256
`7B6EF8ED160B0959119A4A1AE3BAD04AB2FA12250EE89F0FDD54869199D45E5E`.
Release tag: `tempo-master-1.2.0-2026-10-01`. The tag includes the reviewed
production candidate plus documentation and verification scripts; those later
changes do not alter the installed ASAR. The verified desktop shortcut reopened
the visible, responding Tempo window after acceptance.

The actual owner's database had zero habits, logs, tasks and sessions before the
upgrade. Acceptance verifies that those counts, preferences and three presets
were retained; populated legacy-data preservation comes from separate fixtures.
A temporary task survived refresh and a full quit/relaunch, then was removed.
Close-to-tray, second-instance show/minimized restore, the exact Tempo desktop
shortcut launch, all core pages offline, zero renderer errors, SQLite integrity
and markers 2/3/4/100/200 passed.

Study is the minimal curriculum/topic/progress/graded-review implementation
required by the brief. The brief assumed a prior Phase 2 system, but no separate
Phase 2 specification or implementation was found.

## Installed Windows acceptance

The installer must match the independently reviewed candidate, with version,
SHA256, source revision and package identity recorded. Before an upgrade,
retain a consistent safety copy. The acceptance contract is below; completed
checks are supported by the evidence above and in master integration, while
physical native/overnight checks retain their explicit limits.

- Every screen and core workflow is available: Home, Plan, Habits, Tasks, Focus,
  Study, Statistics, Goals, Review, Settings and Journal. Existing detail,
  weekly/history, notes, archive and export flows remain usable.
- Legacy fixtures upgrade without losing original habit/log fields or
  productivity history. Migrations 2/3/4/100/200 are versioned and transactional;
  the installed upgrade retains the real workspace and original user-data path.
- Complete JSON backups restore in isolated data, legacy formats remain
  importable and malformed input cannot cause partial writes. Existing records
  and running timers retain precedence; pristine restore starts idle with Guard
  disabled. Safety copies accompany schema/import changes.
- The main timer survives window close and restart, logs completed phases once,
  excludes unfinished/break time from completed focus totals and waits for an
  explicit next start. Computed views update after genuine data changes.
- Local rollover, schedules and week/month/year/DST boundaries have automated
  evidence. Physical overnight and sleep/wake checks are recorded separately.
- Guard remains opt-in with globally reachable Emergency exit and repair.
  Isolated fixtures establish matching, idempotence, unrelated hosts preservation,
  cleanup and crash recovery. Any live Windows elevation/repair/application
  closure check has separate evidence and a bounded harmless target.
- The final independent reviewer launches the actual frozen package, verifies
  every screen in both themes at desktop/narrow sizes, checks keyboard/dialog
  behavior and visually confirms the three final layout fixes. Passing overflow
  metrics alone do not establish readable layout.
- The installed app opens from the Tempo desktop shortcut, loads retained data,
  works offline, persists changes and relaunches correctly. Tray/global shortcuts
  and native delivery are checked or explicitly recorded as unverified.
- A release commit/tag, installer identity, complete third-party notices,
  backup/recovery instructions and a concise user guide accompany the release.
  No unresolved issue blocks daily use or risks data loss.

## Scope of native evidence

Actual generated Windows PowerShell hosts/watchdog scripts passed against
isolated files. Session/identity fixtures and read-only running-app enumeration
in Tempo's own session also passed. No live UAC, real hosts mutation or closure
of user-selected applications is certified by those results. Physical native
notification/sound delivery depends on OS settings and remains unverified.
Browser secure DNS may bypass hosts blocking; the app explains this in Settings.
macOS/Linux native behavior is not certified by the Windows checks.

These limits must accompany the final release disposition. Fixture success
cannot be relabelled as a live native pass or silently satisfy an unperformed
installed-app acceptance check.

## Review stopping rule

The user's review loop stops at 9/10 or above, after five rounds, or after two
consecutive rounds without meaningful gain. Weights are completeness 20%,
correctness 25%, design fidelity 25%, code quality 15% and
UX/accessibility/responsiveness 15%.

A stopping rule ends review iteration; it does not make a broken workflow pass.
A score alone does not establish installed readiness. Record the independent
final verdict and the actual installed acceptance result separately.
