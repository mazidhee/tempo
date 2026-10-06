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

## Final 1 — Disposition and fidelity

**SHIP source candidate at checkpoint `6309c8e`. Design 9.5 and UX 9.5 meet the requested scoped floor.** Earlier below-floor findings remain above as historical evidence, not current blockers. The final scope excludes the cancelled Outlook integration and new logo. The previous AudioLines mark is restored.

The builder corrected task navigation, inline control alignment, singular Work copy, the empty non-negotiable bar and routine row clutter. Secondary deletion and freeze budgets live under More. The final medium/narrow correction keeps More in the action band and shortens visible slip labels while retaining descriptive accessibility labels. At 800 and 390 pixels, the Check row measures 147.7 px rather than approximately 190 px. Titles, streaks and check-in controls remain readable; no solitary More row remains.

## Final 2 — Persistence and runtime evidence

The independent reviewer ran **128/128 complete tests**, with zero failures, including actual Windows watchdog/identity fixtures. The final functional candidate passed **10/10 actual-Electron groups** in `.review/habits-work-review-1791290101505/results.json`. Tasks All → Trash → history Back now renders All tasks and matches its URL: `.review/habits-work-navigation-1791290138692/result.json`.

Migration 210 adds independent timestamped events without filling unknown days or rewriting check-ins. A fictional CSV review passed **6/6 groups**: preview/filtering, distinct same-day timestamps, multiline quoted notes, concealed history notes, duplicate handling, rejected invalid timestamps, unchanged prior logs, keyboard menu/cancel/confirmed delete, colliding backup habit-ID remapping, repeated backup import and graceful full-process restart. Evidence: `.review/habit-event-review-1791290349331/results.json`. Light/dark event charts and history were captured at 1440, 800 and 390 pixels; `events-dark-390.png` was visually inspected.

Final composition and keyboard check: `.review/habit-final-composition-1791290573295/results.json`. Personally inspected `habits-dark-800.png`, `habits-dark-390.png` and `habits-light-1440.png`; the directory also contains each theme/width and `habits-light-800-sidebar-collapsed.png`. Enter opens More, its Delete action is discoverable, and Escape restores trigger focus. The initial final-composition fixture assumed database return order; that harness mistake was corrected to look up each fictional habit by name before the successful run. It was not an application failure.

## Final 3 — Weighted rubric

| Criterion | Weight | Score | Evidence |
| --- | --- | --- | --- |
| Feature completeness | 20% | 9.5 | Confirmed Habits/Home/Work/task lifecycle/thought/event-import scope is implemented; cancelled features excluded. |
| Functionality and correctness | 25% | 9.6 | Full tests and actual-app flows pass, including quantities/streaks, immutable thoughts, preserved writing, linked Work focus, timestamped import and restart. |
| Design quality | 25% | 9.5 | Restrained daily list and visible streak; quiet secondary actions; reading-page Home; consistent project typography, controls and truthful event line chart. Final medium/narrow density corrected. |
| Code quality and structure | 15% | 9.45 | Additive numbered migrations, central existing habit semantics, separate event history, bounded validated import, backup ID mapping and existing stack retained. |
| UX, accessibility, responsiveness | 15% | 9.5 | Correct URL navigation, safe deletion/restore, keyboard/Escape focus, explicit import preview/status, concealed notes, reduced-motion and light/dark width checks pass. |

Weighted score: **9.5175/10**, rounded **9.52**. This is a scoped source-review judgement supported by the inspected runtime; it does not claim every conceivable defect has been eliminated.

## Final 4 — Material improvements and ceiling

The review loop's material improvements are complete: correct Tasks history, normalize icon/label alignment, remove empty progress state, consolidate routine habit secondary actions, and eliminate the medium/narrow blank action row. There is no remaining material blocker in the reviewed scope. Stop design iteration at the reached 9.5 floor; avoid extra speculative changes before the separate release gate.

## Final 5 — Keep contract and release limits

Keep central `isDue`/streak definitions, neutral days, all habit types, saved notes, frozen/paused semantics and original history. Keep timestamped imported events independent of daily check-ins, notes concealed until requested, immutable dated thoughts, optional greetings, linked Work metadata, recoverable Trash and Keep. Restore and cleanup must not erase historical sessions.

All review launches used isolated fictional data and closed gracefully. No owner database, private CSV, installed app, credentials, hosts file or external account was used by these UI/import reviews. Packaging, exact packaged-binary smoke and installed owner-data preservation remain separate gates. Review harnesses accept `TEMPO_REVIEW_EXE` for a later exact-package check; no such package verification is claimed in this source verdict.

## Exact Windows package acceptance

**SHIP packaged candidate.** The reviewer launched the actual `release/desktop/win-unpacked/Habit Tracker.exe`, FileVersion **1.7.0**, ProductVersion **1.7.0.0**, through the same harnesses with `TEMPO_REVIEW_EXE`. Actual renderer URLs resolved inside `resources/app.asar`; this run did not fall back to the development executable.

- **10/10** actual-app groups, including graceful restart: `.review/habits-work-review-1791290971033/results.json`.
- **6/6** fictional CSV/history/menu/backup-remapping/theme/restart groups: `.review/habit-event-review-1791290976784/results.json`.
- Tasks navigation Back correctly restores All tasks: `.review/habits-work-navigation-1791290977040/result.json`.

The reviewer inspected packaged `habits-today-dark-800.png`, `home-reading-light-1440.png` and `work-dark-1440.png` in the ten-flow directory, plus packaged `events-dark-390.png` in the event directory. They retain the approved compact controls, original logo, reading-page composition and clear recorded-event chart. All fixture processes closed gracefully; no owner data was opened.

ASAR SHA256 was identical before and after these runs: `DCB03FF6AFC0FD6AE5EEBF2C26E6550F67ABF8F6398B2B152D07AA4C8FB0E103`. The source verdict's 9.5 design/UX floor stands for the exact package. Installation and two-launch owner-data acceptance are still the builder's separate gate; this reviewer did not install or import private history.
