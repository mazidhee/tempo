# Tempo 1.7 independent candidate review

October 6, 2026. Candidate review on `codex/habits-work-1.7`. This is a review checkpoint, not installed-release acceptance.

## Scope and safety

Launched the actual Electron renderer and main process with a fresh isolated SQLite database under `.review/`. All sample habits, tasks, journal writing and projects are fictional. Neither the installed app nor its owner database was opened. No application source was changed by the reviewer.

Confirmed choices: Habit A daily rhythm; Home B reading page; optional daily Stoic/personal thoughts; Work projects and milestones; recoverable task Trash and Keep. Outlook/meetings and the new Continuity logo were subsequently cancelled. The logo is therefore excluded from the design judgement.

## Functional evidence

Harness: `scripts/habits-work-review.cjs`. Current complete evidence: `.review/habits-work-review-1791289380333/results.json`.

Ten groups passed in the actual app:

1. Thirty-day cleanup moves eligible completed tasks into Trash while retained tasks remain; restoring exempts the task from repeat cleanup.
2. Habit check-in and detail share the same current streak; quantity completion occurs at the configured target.
3. Existing slip reasons are prefilled and preserved; long reasons expand below the main row without squeezing titles at 1440, 800 or 390 pixels.
4. Daily thoughts support adding, editing, pausing, resuming and reordering. Editing the selected library entry does not change that day's snapshotted thought.
5. The reflection link opens the matching Journal date and preserves existing writing.
6. A Work project supports milestone editing/completion, linked task creation and focus metadata.
7. Archive, Trash, restore and Keep preserve linked task identity and Work metadata.
8. Light/dark views, desktop/medium/narrow widths, expanded/collapsed sidebars and reduced motion pass the tested layout checks.
9. Export/import preserves thought selections, Work projects, task lifecycle and Journal content.
10. A graceful full-process restart preserves those records and produces no renderer errors.

An earlier forced-kill review helper caused an isolated restart disk-I/O error. The database's read-only integrity check was `ok`; replacing that helper with Playwright Electron's graceful `app.close()` produced the passing restart above. This was never an owner-data check.

## Findings for the next round

- **P2: task view and navigation disagree.** From Tasks All, click Trash, then navigate Back. The URL returns to `view=All`, but the heading and list remain Trash. The view is initialized from URL parameters only once. Real-app reproduction: `scripts/habits-work-navigation-review.cjs`; `.review/habits-work-navigation-1791289612220/result.json` and `task-view-after-back.png`.
- Icon-and-text ghost buttons on Home, Work and Thought Settings stack their icons above their labels. Normalize their inline alignment and sizing; visible examples are the Home focus action, Add a thought and Work project controls.
- Work displays `1 open tasks`; singular copy should read `1 open task`.
- Final habit polishing should keep the main check-in action visually close to its habit title and maintain a consistent title/streak/control reading order. The functional medium-width issue is corrected; this is a craft improvement, not a data defect.

Useful screenshots in the complete evidence directory: `home-reading-light-1440.png`, `home-dark-390.png`, `habits-today-dark-1440.png`, `habits-today-dark-800.png`, `work-dark-1440.png`, `work-dark-390.png`, `tasks-dark-390.png`, `settings-dark-390.png`.

## Gate

The current candidate's tested functions pass, but task navigation and control alignment keep it below the requested 9.5 design and UX gate. Final scoring follows the corrected build and the newly requested event-import review. Unit-test, packaging and installed owner-data acceptance are separate checks; this document does not claim they have completed for the final candidate.
