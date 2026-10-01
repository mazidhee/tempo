# Master build implementation plan

The inspected application is Electron 44, React 19, TypeScript 7, Vite 8,
Tailwind 4 and Recharts 3 with Lucide icons and Electron's bundled SQLite.
Habits and their logs live in SQLite; tasks, presets, sessions and timer state
currently share a versioned productivity JSON record in SQLite. Renderer pages,
shared habit/timer engines, main-process database/IPC and preload are separate.
Keep this stack and all existing records. The master brief's better-sqlite3 and
already-merged Study assumptions do not match this checkout.

## Sequence

1. Finish Phase 1's independent review and package its validated build.
2. Foundation alone: retain the supplied source verbatim in `DESIGN.md`, add
   Linear tokens/local fonts, shared component kit and typed registries. Include
   the missing minimal Study data contracts required by the master brief.
   Commit to main and tag before any parallel implementation.
3. Three isolated branches/worktrees: A owns main-process Focus, tray, shortcuts
   and opt-in Focus Guard; B owns Plan, Journal, Review, Goals and reminders;
   C owns page restyling, Study UI and command-palette contents.
4. Integrate A then B then C. Verify migration/import compatibility, run the
   complete test suite and independent real-Electron review loop. Package and
   upgrade the desktop installation after verification.

## Additive data changes

- Study foundation migration 4: curricula, ordered topics, spaced review state
  and review log. No changes to existing habit IDs or logs.
- A migrations 100–199: Focus settings/block lists and focus-break events;
  timestamp timer ownership moves to main without discarding current state.
- B migrations 200–299: daily plans/priorities, journal and FTS5 index, saved
  weekly reflections, goals and reminder settings.
- Every schema change has a transaction and migration marker. Backup export
  grows compatibly; legacy backup formats remain supported. No live database
  is used for development or reviewer fixtures.

## Shared contracts

Navigation, routes, settings sections and named Home widget slots have central
registries. Stage 1 changes there are additive registrations only. Main modules
register namespaced IPC through one registry; preload uses explicit typed APIs.
The component kit and tokens are Foundation-owned. Agents may request changes
to those files from the integration agent rather than editing concurrently.

## Decisions

- Windows is the primary verified platform. Platform-specific blocker code
  shares one interface; unsupported operations must report their limitation.
- Privacy already uses Ctrl/Cmd+Shift+P, so Focus shortcuts must use another
  default and detect conflicts.
- Focus Guard is opt-in. Automated testing uses isolated hosts fixtures and
  dedicated harmless processes; selected live applications are never test
  targets. Website blocking must preserve unrelated hosts entries, clean its
  marked block on stop/quit/startup recovery, and expose Repair and emergency exit.
- The minimal Study module supplies curricula/topics, learned progress and a
  graded spaced review queue needed by the requested master screens and goals.
  A separate, unspecified Phase 2 brief is not assumed to have been implemented.
