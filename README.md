# Tempo

Tempo brings habits, tasks, focused work, study, planning and reflection into one
offline desktop workspace. It builds on the original Habit Tracker and keeps its
application identity, user-data location and `habits.db` database.

The integrated 1.2.0 source passes type checking, all 82 tests and the production
build. Independent packaged review accepted it at **9.18/10**, and the installed
Windows 1.2.0 upgrade passed launch, offline use, data-path preservation and
persistence checks. See [release readiness](docs/release-readiness.md) for the
evidence and remaining native verification limits.

## Use the workspace

- **Home:** greeting, annual habit calendar, today's habits and tasks, recorded
  focus time, daily priorities, goals and reviews due. Calendar tooltips include
  recorded missed reasons, freezes and journal lines.
- **Habits:** Check, Quantity and Avoid habits; daily, weekday, weekly quota and
  anchored interval schedules; notes, stacking, non-negotiables, freezes,
  vacation pauses, detail/history views and archive/restore.
- **Tasks:** quick add, priorities, due dates, projects, tags, subtasks,
  completion/reopen and linked Focus. Filter by view, text and priority.
- **Focus:** editable presets, task/habit/Study links, main-process timer,
  restart recovery, tray controls, configurable global shortcuts and optional
  Focus Guard with repair and emergency exit.
- **Study:** curricula and ordered chapter/topic trees, learned progress,
  linked Focus and a due queue with Again, Hard, Good and Easy grades.
- **Plan and Journal:** up to three priorities, study selections, evening
  reflection, optional sleep/energy, dated journal entries and local text search.
- **Goals and Review:** progress from recorded activity, saved weekly summaries,
  written reflections and configurable reminders.
- **Statistics and Settings:** date filters, habit/focus charts, focus-break
  history, CSV exports, system/light/dark appearance and complete JSON backups.

Start with the [user guide](docs/user-guide.md). Press **Ctrl/Cmd+K** to navigate,
start a Focus preset, add a task or search your journal. **Ctrl/Cmd+B** toggles the
sidebar; **Ctrl/Cmd+Shift+P** toggles habit privacy.

## Run from source

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

## Data and recovery

Versioned transactional migrations 2, 3, 4, 100 and 200 add productivity, the
habit engine, Study, Focus and Reflection. Migration 3 gives legacy habits Check
and daily defaults while retaining their original columns and logs. Schema
upgrades and backup imports create consistent SQLite safety copies.

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
