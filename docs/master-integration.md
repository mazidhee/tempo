# Master integration verification

Foundation was committed as `33f3c19` and tagged
`tempo-foundation-2026-10-01` before Stage A Focus, Stage B Reflection and Stage C
Restyle were integrated in that order. The original package identity, user-data
location and `habits.db` remain in use.

The final production candidate is frozen at `1433cb46`. Its Windows 1.2.0
installer has been built. Candidate ASAR SHA256:
`F349E4FF2CCCA0A85BEA23D1764D22252102E986F436D05E24BBE5B8ED75A369`.
Independent round 2 accepted this package at **9.18/10**. The installed Windows
1.2.0 upgrade also passed the separate acceptance checks recorded below.

## Integrated behavior

- Focus has one main-process timer owner, timestamp recovery, exactly-once
  completed phases, tray controls, close-to-tray, configurable conflict-aware
  shortcuts, phase notifications and an opt-in Guard. Global emergency exit,
  repair and startup/quit cleanup are integrated into workspace chrome.
- Reflection mounts Plan, Journal, Review and Goals, local FTS5 journal search,
  reminders and the Today Plan, Goals and Reviews Due Home widgets. Calendar
  journal lookup and command-palette search open the matching dated entry.
- The restyle uses the Foundation kit, Linear tokens, bundled fonts and Lucide.
  Existing habit detail/history/notes/protection, tasks, exports and privacy
  remain accessible. Tasks supports explicit priority filtering.
- Study provides curricula, ordered chapter/topic trees, learned progress,
  linked Focus, archive/restore and graded calendar-day reviews. This is the
  minimal confirmed Study scope; no separate Phase 2 specification was found.
- Shared data events refresh computed widgets and goal progress after actual
  changes. Main-owned timer/sessions are protected from stale renderer saves.

## Data preservation and backups

The database uses Electron's bundled `node:sqlite`, retaining the original
`com.habittracker.app` identity and Habit Tracker product/data naming. Tempo is the
visible workspace, shortcut and uninstall name.

| Migration | Additive change |
| --- | --- |
| 2 | Productivity state and persistent schema markers |
| 3 | Habit engine fields and pauses; legacy Check + daily defaults, original fields/logs retained |
| 4 | Study curricula, topics and review history |
| 100 | Main-process Focus ownership, Guard settings/blocklists and focus-break history |
| 200 | Daily plans, journal/FTS5, weekly reviews, goals and reminder settings/deliveries |

Migrations run transactionally with persistent markers. A module migration batch
gets a consistent SQLite safety snapshot before pending schema changes.

Backup format 3 includes Study, Focus and Reflection alongside original habits,
logs/pauses and productivity state. Formats 1/2 remain readable. Import validates
all payloads before writing, creates a consistent SQLite safety copy and merges
within one transaction. Existing records, preferences and the current timer win.
A pristine workspace restores preferences and edited presets but starts idle;
Guard settings restore with activation disabled. Habit and Study links are
remapped on identifier collisions. Study remapping is deterministic on repeated
imports, and import cannot turn an active timer strict.

## Recorded checks

| Check | Result and evidence |
| --- | --- |
| Type check | Passed; integration and independent review evidence |
| Full suite | 82/82 passed; `.review/integrated-tests.txt` and `.review/reviewer-final-tests.txt` |
| Production build | Passed; `.review/integrated-build.txt` and `.review/reviewer-final-build.txt`; Vite reports a main-bundle size warning |
| Runtime dependency audit | `npm audit --omit=dev --audit-level=moderate` reported zero runtime vulnerabilities at the integration checkpoint |
| Shared real-Electron smoke | `scripts/master-smoke.cjs` with unique database and real IPC/SQLite; journal tooltip, palette FTS, task completion/reopen, emergency/zen exit and backups passed |
| Theme/window matrix | Eleven screens, light/dark, 1280/390 pixels; `.review/master-1790860202583/result.json`, then module Settings captures in `.review/master-1790860442667/`, 52 captures total |
| Initial matrix diagnostics | Zero recorded runtime errors, document overflow or clipped topbar controls; these metrics did not detect the later visual row-layout findings |
| Native script fixtures | Actual generated Windows PowerShell hosts/watchdog and process/session identity fixtures passed in the full suite |

The initial independent packaged round scored **8.88/10** and required corrections
to Reflection reminder rows, Focus setting rows and narrow Task actions. All three
priorities are implemented in the frozen candidate and independently resolved in
round 2 with actual clicks, a fresh 52-capture packaged matrix and a 52-capture
native matrix. Earlier fixes include Journal breadcrumb,
12-pixel legacy captions, own-session Windows process enumeration/close checks,
priority filtering and backup collision handling. The final independent scores
are completeness 9.4, correctness 9.1, design fidelity 9.3, code quality 8.8 and
UX/accessibility/responsiveness 9.2, weighted 20/25/25/15/15 percent for **9.18/10**.
The independent disposition is ship. Installed acceptance passed separately.

## Native verification limits

The generated PowerShell scripts were executed against isolated hosts and
control files, including watchdog cleanup. Process identity tests exercise
session matching and stale identity handling; read-only enumeration was also
checked against running apps in Tempo's own session.

These checks do not certify live UAC, modifications to the real hosts file,
closing user-selected applications, physical notification/sound delivery,
physical sleep/wake or an overnight trial. macOS/Linux native adapters and
packaging have no equivalent Windows acceptance evidence here. Browser secure
DNS can bypass hosts blocking; Focus settings explains that limitation.

## Installed Windows acceptance

The authorized upgrade passed on the actual installed 1.2.0 application. Evidence:
`.install-check/master-upgrade-1790863834869/acceptance.json` and
`installed-home.png` in the same directory. The pre-upgrade consistent SQLite
copy is `before.db` there. Installed ASAR matches the reviewed candidate hash.

- Original user-data path retained:
  `C:\Users\USER\AppData\Roaming\habit-tracker`.
- Preferences and all three presets retained. The owner's pre-upgrade activity
  counts were zero habits/logs/tasks/sessions; populated legacy preservation is
  established by separate fixture tests, not inferred from those empty counts.
- A temporary task persisted through renderer refresh and a full quit/relaunch,
  then was deleted after verification.
- Close-to-tray, second-instance show and minimized-window restore passed.
- The Tempo desktop shortcut points to the exact installed executable and
  launched it. All core pages opened offline with zero renderer errors.
- SQLite integrity passed and migration markers 2/3/4/100/200 were present.

The acceptance run did not modify native Guard targets. Live UAC/hosts/app
closure and physical delivery retain the limits stated above. Follow
[release readiness](release-readiness.md),
[the independent report](independent-master-review.md),
[design comparison](design-implementation.md) and [the user guide](user-guide.md).
