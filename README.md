# Tempo

Tempo brings habits, tasks, focused work, study, planning and reflection into one
offline desktop workspace. It builds on the original Habit Tracker and keeps its
application identity, user-data location and `habits.db` database.

The October 3 redesign adds a dedicated Study library, Home study continuity,
rich local journaling, compact daily habits, separate planning/review pages and
optional encrypted private GitHub backups. Versioned migrations preserve the
existing workspace. Tempo 1.6 adds inline autosaving plans, refined task lists,
full-page journal writing, saved weekly focus charts and progress-first goals.
The 1.8 workspace update adds a compact task board, a scheduled daily queue,
direct habit check-ins and open Study, Journal and Review layouts. Approved scope
and preservation requirements are in [workspace design](docs/approved-workspace-design.md).
The installed 1.6 acceptance record remains in [daily workspace release](docs/daily-workspace-release.md).

## Use the workspace

- **Home:** greeting, annual habit calendar, today's habits and tasks, recorded
  focus time, daily priorities, goals and reviews due. Calendar tooltips include
  recorded missed reasons, freezes and journal lines.
- **Habits:** Check, Quantity and Avoid habits; daily, weekday, weekly quota and
  anchored interval schedules; notes, stacking, non-negotiables, freezes,
  vacation pauses, detail/history views and archive/restore.
- **Tasks:** Inbox, Next, Doing and Done board lanes; drag or keyboard moves;
  scheduled dates/times, priorities, projects, tags, subtasks and linked Focus.
  Archive, recoverable Trash and per-task Keep remain available.
- **Work:** searchable project table, milestones, target dates and linked tasks.
- **Focus:** editable presets, task/habit/Study links, main-process timer,
  restart recovery, tray controls, configurable global shortcuts and optional
  Focus Guard with repair and emergency exit.
- **Study:** curricula and ordered chapter/topic trees, learned progress,
  linked Focus and a due queue with Again, Hard, Good and Easy grades.
- **Plan and Journal:** scheduled tasks flow into the daily focus queue;
  completion updates the same task on its board. Flexible priorities and study
  selections autosave. Journal provides an open dated writing canvas and local
  text search. Earlier evening records remain saved.
- **Goals and Review:** progress from recorded activity, saved weekly summaries and focus charts,
  written reflections and configurable reminders.
- **Statistics and Settings:** date filters, habit/focus charts, focus-break
  history, CSV exports, system/light/dark appearance and complete JSON backups.

Start with the [user guide](docs/user-guide.md). Press **Ctrl/Cmd+K** to navigate,
start a Focus preset, add a task or search your journal. **Ctrl/Cmd+B** toggles the
sidebar; **Ctrl/Cmd+Shift+P** toggles habit privacy.

## Run from source

Clone your private repository first (GitHub sign-in required):

```powershell
git clone https://github.com/mazidhee/tempo.git
cd tempo
```

Use Node **22.16 or newer** and npm for the complete workflow, including the
SQLite backup helper. The application package declares a 22.12 build floor;
release verification used the installed modern Node runtime.

```powershell
npm ci
npm run dev
```

Electron downloads its desktop runtime on first use. To download it ahead of
time, run `npm run setup:desktop`. SQLite uses Electron's bundled `node:sqlite`;
no Python, Visual Studio C++ tools or native SQLite addon rebuild is needed.

## Build and package

```powershell
npm run typecheck
npm test
npm run build
npm run dist
```

`build` creates the renderer and Electron bundles. `dist` also creates a Windows
NSIS installer under `release/desktop/`. macOS/Linux packaging needs the
respective packaging environment and has no equivalent release certification in
this checkpoint. The installed application includes its runtime and local fonts;
the user does not need Node or an internet connection for production features.

Windows shortcuts and the uninstall entry use **Tempo**. The original
`com.habittracker.app` identity and **Habit Tracker** product/data naming remain
intact to preserve the existing workspace.

## Source version control

`origin` is the private `mazidhee/tempo` repository. Original history is preserved;
`upstream` retains the original Habit-Tracker remote. The named rollback tag
`tempo-before-redesign-1.4.0` preserves the preceding installed version.
For a separate reference checkout, use `git worktree add ../tempo-reference tempo-before-redesign-1.4.0`.
Code rollback and personal-data restore are separate operations. Never replace a
newer database with an older copy just to compare the interface.

## Data and recovery

Versioned transactional migrations 2, 3, 4, 100, 200–204 add productivity, the
habit engine, Study, Focus and Reflection. Migration 3 gives legacy habits Check
and daily defaults while retaining their original columns and logs. Schema
upgrades and backup imports create consistent SQLite safety copies.

**Settings → Backups** keeps 14 daily local snapshots and supports an explicit,
password-encrypted upload to the private repository’s `tempo-backups` branch.
No upload happens automatically. Keep the password outside the repository; it
is required to recover a `.tempo-backup` file on another computer. A saved GitHub
token is protected by Windows and excluded from exported data. Source commits
exclude databases, local snapshots and tokens. See [backup design](docs/backups.md).

JSON backup format 3 includes habits/logs/pauses, tasks, presets, preferences,
completed sessions, Study, Focus and Reflection. Formats 1 and 2 remain readable.
Import validates before writing and merges within one transaction. Existing
records, preferences and the current timer take precedence. A pristine workspace
restores preferences/presets but starts idle; imported Guard configuration stays
disabled. Linked habit and Study identifiers are remapped on collisions.

Focus Guard is opt-in. Its website blocking requests administrator permission;
browser secure DNS can bypass hosts blocking. Generated Windows PowerShell
scripts passed isolated fixture tests, and read-only running-app enumeration
was checked in the app's own session. Live UAC, the real hosts file, closing
user applications and physical notification delivery are not certified by those
checks. See the guide for Guard recovery controls.

## Verification and implementation references

Tests use isolated databases, never the owner's live workspace. For an isolated
Electron launch, set `HABIT_TRACKER_DATA_DIR` to a separate absolute directory.
This also suppresses the legacy end-of-day reminder during testing.

- [Integration evidence](docs/master-integration.md) and
  [independent master review](docs/independent-master-review.md)
- [Design implementation and drift comparison](docs/design-implementation.md)
- [Product scope](PRODUCT.md), [preserved design authority](DESIGN.md) and
  [master build brief](docs/master-build-brief.md)
- [Architecture](docs/architecture.md) and [habit engine rules](docs/habit-engine.md)
- [Component sources and licences](docs/component-sources.md),
  [third-party notices](THIRD-PARTY-NOTICES.txt) and [Lucide preview](docs/sidebar-icons.png)

The stack is React, TypeScript, Electron, Vite, Tailwind, Recharts, React Router,
date-fns and Lucide, with cmdk, TanStack Table and shared shadcn/Radix components.
Versions are pinned in `package.json` and `package-lock.json`. Inter and JetBrains
Mono are bundled locally. Runtime tokens live in `src/renderer/styles/tokens.css`.

## Source licence

Tempo now incorporates a React adaptation of Logseq's journal-page frame. The project is licensed under GNU AGPL version 3; see [LICENSE.md](LICENSE.md), [provenance](third-party/logseq/PROVENANCE.md) and THIRD-PARTY-NOTICES.txt. The private repository remains private. Journal/data backups and owner-created cover images are personal data, separate from the app source licence. Keep corresponding source and notices with any future distribution.
