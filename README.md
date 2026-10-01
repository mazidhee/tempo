# Tempo

A quiet, local personal productivity workspace built on the original Habit Tracker.

Development **resumed on October 1, 2026** at the user's request, following the
saved master brief and installed design skills. Context, session history,
review evidence and remaining milestones are linked from
[the session handoff](docs/session-handoff.md). The confirmed product record is
in [PRODUCT.md](PRODUCT.md); new screens use a code-first workflow with visual review.

## Run

Use Node **22.12 or newer** (Node 24 LTS recommended) and npm.

```powershell
npm ci
npm run dev
```

`npm ci` installs the JavaScript packages. Electron 44 downloads its desktop binary on first use; `npm run dev` triggers that download automatically. To download it ahead of time, run `npm run setup:desktop`. No Python, Visual Studio C++ tools or native SQLite addon rebuild is needed. If a corporate proxy requires it, use Electron's documented `ELECTRON_GET_USE_PROXY` environment option.

## Build and package

```powershell
npm run typecheck
npm test
npm run build
npm run dist
```

`build` creates the renderer and Electron bundles. `dist` also creates a Windows NSIS installer in `release/desktop/` (macOS/Linux targets require their respective packaging environments). The packaged app includes its runtime; the user does not need Node. Production is entirely offline after installation. The original app identity and data directory remain **Habit Tracker**. Windows shortcuts and the uninstall entry are named **Tempo**, avoiding conflicts with unrelated browser shortcuts.

## Features

- Home: time-aware greeting, 365-day habit contribution calendar, today’s habits, tasks due and completed focus time.
- Habits: Check, Quantity and Avoid types; daily, weekday, weekly quota and anchored interval schedules; grouped check-in, non-negotiables, stacking, detail heatmaps, freezes and vacation pauses. Notes, midnight locking, weekly grid, history, missed reasons and archive/restore/delete remain available.
- Tasks: quick add, editing, due dates, priorities, projects, tags, subtasks, Today/Upcoming/All/Completed, and focus shortcuts.
- Focus: any positive durations, preset creation/editing/deletion, task or habit links, start/pause/resume/skip/reset, phase counters, optional sound/notifications and minimal focus mode.
- Statistics: date ranges, focus attribution by task/habit/project/preset, habit streaks and rates, habits/focus heatmaps, tasks completed and focus-time charts.
- Settings: personal greeting name, live system/light/dark theme, reminders, complete JSON backup/import and retained habit CSV export. Statistics exports session CSV.
- Collapsible sidebar, keyboard navigation, Cmd/Ctrl+K command palette, accessible dialogs and reduced-motion support.

## Data and safety

The original SQLite `habits.db` stays in Electron’s original user-data location. Migrations 2 and 3 preserve habit/log records. Migration 3 converts existing habits to Check + daily as requested, retaining their original schedule fields as metadata. A consistent SQLite backup is created before this upgrade. Electron's bundled `node:sqlite` provides SQLite without a third-party native addon. Productivity state is versioned and validated at IPC. Completed phases use immutable snapshots and unique identifiers. Timestamp deadlines survive refresh and background throttling. The next phase waits for an explicit start; unattended time is never treated as focus.

Backup import creates a SQLite safety copy, then merges missing records in one transaction. Existing records, settings and the running timer take precedence. Exported JSON includes archived habit history. The desktop reminder requires the app to remain open, and phase notifications follow OS settings.

See [habit engine rules](docs/habit-engine.md), [architecture and decisions](docs/architecture.md), [icon comparison and preview](docs/icons.md), and the [final independent review](docs/review-round-2.md).

## Testing

`npm test` runs deterministic timer, schedule, quantity/Avoid, freeze/pause, streak, heatmap, DST and migration tests with Node's test runner. The independent review additionally launches the actual Electron app against an old-schema fixture, clicks through user flows, tests persistence and captures desktop/dark/small-screen screenshots. Review artifacts are isolated under `.review/`, never in the real user database.

To launch with isolated data, create a directory, set `HABIT_TRACKER_DATA_DIR` to its absolute path and launch Electron. This also suppresses the end-of-day reminder during testing.

## Stack

React 19, TypeScript 7, Electron 44, Vite 8, Tailwind 4, Recharts 3, React Router 7, date-fns and Lucide. Direct versions are pinned in `package.json` and `package-lock.json`. Design tokens live in `src/renderer/styles/tokens.css`.
