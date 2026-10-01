# Architecture and preservation decisions

The original app used Electron, React 18, TypeScript, Vite, Tailwind 3, Recharts 2, date-fns, Lucide and better-sqlite3. Its `habits` and `habit_logs` tables stored schedules, archive state, completion, notes and missed reasons. Daily check-ins, midnight locking, weekly spreadsheet, history, habit analytics, CSV export and the 11:30 PM reminder are retained.

The refreshed app uses current stable versions of the same frameworks. SQLite is now supplied by Electron's bundled Node runtime (`node:sqlite`), removing a native C++ installation/rebuild requirement. The thin `database/sqlite.ts` facade preserves existing prepared queries and explicit transactions. No change to the original app identity, database location or original habit/log table meanings is required.

## Files

- `src/main`: window lifecycle, reminder, validated IPC, database and additive migrations.
- `src/shared`: serializable productivity types, timer transitions and schedule-aware analytics. The renderer and main process use the same definitions.
- `src/renderer/pages`: Home, Tasks, Focus, Statistics and Settings, alongside original daily, weekly, history and deeper habit analytics pages.
- `src/renderer/hooks/ProductivityProvider.tsx`: one workspace state, ordered persistence writes, timestamp reconciliation, OS theme changes and optional phase alerts.
- `src/renderer/components`: reusable controls, accessible dialog, calendar heatmap and sidebar.
- `src/renderer/styles/tokens.css`: theme colours, spacing, radius and type tokens.
- `tests`: deterministic timer, streak and heatmap tests.

## Migration and storage

Migration 3 adds the new habit-engine fields and pause table, documented in [habit engine rules](habit-engine.md). Original columns and records stay intact; an automatic SQLite safety copy precedes the upgrade.

Migration 2 creates `schema_migrations` and one `productivity_state` record without replacing or dropping legacy tables. This JSON record contains tasks, subtasks, presets, completed phases, current timer and settings. Changes are validated at IPC and saved as one SQLite update. A single app instance prevents competing writers. The original habit mutations continue through their original IPC.

New task and preset identifiers are UUIDs. Completed phase records carry a unique run identifier, deadline date, duration, phase, preset name and a snapshot of the optional task/habit/project link. Renaming or deleting a task/preset does not rewrite historical focus attribution. Focus statistics exclude break phases. Skipped and reset phases are not recorded as completed.

## Timer semantics

A running phase stores an absolute wall-clock deadline. Intervals repaint and reconcile; they do not count seconds. Pause stores the precise remaining time. Restoring the persisted state after a refresh reconciles an expired deadline once and saves the next waiting phase. No unattended auto-start is performed. Changing a preset or link during an in-progress phase requires resetting it first.

As with any wall-clock timer, manually changing the system clock affects its deadline. Notifications follow OS permissions and quiet-hours policies, and the end-of-day reminder requires the app to be open.

## Backup semantics

JSON export includes all habits/logs, including archived records, plus productivity state. Import validates the backup, creates a full SQLite safety copy, and transactionally merges missing records. Habit identifier collisions are remapped. Existing records, settings and live timer take precedence. Habit CSV remains available; focus session CSV can be exported from Statistics. Exported backups are user-managed files.

## Design and extras

Lucide was chosen over Phosphor and Tabler because its outline family fits the quiet desktop design and avoids mixing icon packages. Sidebar icons are 18 px at a 1.75 stroke. Light/dark palettes use one sage accent, and the default theme follows the operating system live. CSS respects reduced motion.

Included extras: command palette, JSON backup/import, optional alerts and focus mode. Journals, linked goals, a separate daily planner and weekly review were deferred to keep the workspace focused. The retained weekly habit grid and additional habit insights remain available.
