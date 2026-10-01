# Phase 1 independent review — round 1

**Score: 8.1 / 10 (weighted 8.13). Changes required, then resubmit.**

Reviewed October 1, 2026 against the submitted Phase 1 build and documented decisions in `docs/habit-engine.md`. This is an independent review of an actual Electron application, using its real preload, IPC and SQLite persistence. No application implementation was edited. All test data was isolated under `.review/phase1`; the installed app and live user data were untouched.

| Rubric | Weight | Score | Justification |
|---|---:|---:|---|
| Feature completeness | 20% | 8.5 | Check, Quantity, Avoid, four schedule types, freeze/recovery, pauses, grouped check-ins, pinned habits, detail, privacy and backups are implemented. New and existing task/focus flows ran. Weekly displays disagree about eligible and partially logged occurrences; quantity has no UI correction path. |
| Functionality and correctness | 25% | 7.2 | Both legacy migrations preserve original fields and productivity JSON exactly. Persistence, threshold, Avoid outcomes, locking and major rejection guards passed. Two confirmed note-preservation/behavior failures, weekly outcome contradictions and rounded full-completion shading prevent approval. |
| Design quality | 25% | 8.8 | Cohesive restrained green accent, consistent Lucide icons, generous spacing, polished light/dark panels and clean weekly cells. Desktop and 360px screenshots are coherent. Visible mojibake and exposed privacy text undermine the finish. |
| Code quality and structure | 15% | 8.0 | Shared engine and validators are a sound foundation; additive migration, transactional writes, semantic documentation and 34 passing tests are positive. Some tests miss important UI action distinctions and weekly outcomes. Year analytics repeatedly scan logs and are recomputed on clock-driven renders. |
| UX, accessibility and responsiveness | 15% | 8.2 | Modal flows, labeled controls, detail navigation, responsive layouts and existing timestamp timer worked without renderer errors or document overflow. Privacy scope is incomplete, accidental quantity entry cannot be corrected through UI, and weekly partial activity becomes a neutral cell. |

## Completed evidence

- Independently ran the production build and test suite: **build passed; 34/34 tests passed**.
- Launched Electron 44 through CDP with isolated `HABIT_TRACKER_DATA_DIR`; exercised native preload/SQLite rather than persistence mocks.
- Booted both oldest-schema and v2-schema fixtures. Compared every original habit/log field, preserved IDs, archive flags, descriptions, timestamps, schedule metadata, completion values, notes and missed reasons. Both migrated to Check/daily as requested; v2 productivity JSON remained byte-identical; migration safety copies exist.
- Created Check, Quantity, Avoid, weekly-quota and interval habits through forms; tested quick increments, custom amount, 50% threshold against a 2000 ml target, reload persistence, Check complete/uncheck, explicit clean confirmation, Slip reasons and protected Slip outcome.
- Clicked retro-freeze for yesterday, confirmed reason persistence and past-freeze locking. Tested note freeze behavior, detail/year grid, future pause creation/removal, schedule editor and weekly cell controls.
- Actual IPC rejected locked completion/notes, negative quantities, Slip-to-clean, Slip-to-freeze, pauses overlapping completed logs, and a 15-day pause over the 14-day cap without changing the snapshot.
- Existing task quick add/completion, linked focus, fractional preset, running timestamp deadline after refresh, exact completed focus session duration and JSON format-2 merge worked.
- Inspected light/dark desktop and 360px screenshots for Home, Habits, Statistics and Focus. No document overflow; no unexpected page or renderer console errors.
- Independent shared-engine golden cases: **10/13 passed**. The three failures are weekly current-day outcome, weekly partial quantity outcome and 199/200 shading, listed below.
- Independent 20-habit/year benchmark with roughly 7300 logs: one `collectiveYear` calculation took **329 ms**. Statistics invokes that calculation in JSX and receives the 250 ms provider clock updates; the resulting performance risk is concrete. Large-history renderer frame pacing was not separately measured.

## Prioritized fixes and improvements

1. **Preserve notes and distinguish ordinary notes from completion.** On an incomplete Check, click “Add note”, type a note and Save: `is_completed` becomes 1. An ordinary note must leave outcome/completion unchanged. Complete-with-note should remain a separate explicit action. Also, after unchecking a Check with note “Completed privately”, freezing with note “Private protection note” replaces `log.note`; protection text must only populate `freeze_note`. Add regression tests covering both UI distinctions and original note retention through freeze/undo.

2. **Make canonical weekly outcomes and shades consistent.** Today lists four eligible habits while `aggregateDay` counts three because an unfinished weekly-quota opportunity is treated as not-due. A weekly Quantity log of 250/1000 displays a `not_due` cell, preventing its partial ring/heatmap shade and selected-cell controls. Preserve flexible past-day neutrality while representing today's eligible opportunity and any actual partial activity. Compute completion shade from the exact ratio/count, not rounded percentage: 199/200 currently receives the full-completion shade. Use “weeks” for weekly streaks where labels currently say “days”. Add tests for current day, partial past activity, future-log causality and boundaries.

3. **Complete privacy coverage.** Ctrl+Shift+P leaves the Statistics habit-name table cells unblurred. Focus “Working on” selected habit name is also unblurred (verified computed filter `none` and screenshot). Apply privacy consistently to all habit-bearing surfaces, including expanded legacy insight cards, chart/tooltips, selected link names and sensitive reason/note text. Verify actual computed styles and screenshots rather than relying only on class presence.

4. **Keep analytics fast as history grows.** Index habit/date lookups or provide a reusable indexed snapshot, and memoize yearly grids/rates/streaks against data and local date rather than timer ticks. Home already memoizes its year grid; extend the same discipline to Statistics and detail. Preserve one canonical engine rather than caching separately implemented status rules.

5. **Finish correction and text polish.** Quantity Custom only adds a nonnegative amount, so an accidental +500 cannot be corrected through the UI although IPC supports `set_quantity`. Add a clearly labeled total/correction option with validation and persistence. Repair visible strings such as “Completed focus time Â· minutes”, heatmap subtitles and loader/error separators. Keep the selected set consistent.

## Harness corrections, not app bugs

- The initial detail pause test used `selectOption` on “Pause reason”; the control is an input. Repeating with `fill` passed creation, deletion and schedule-editor checks.
- The freeze-cap test expected a September 30 freeze to be rejected after an October 1 freeze with cap 1. The budget is explicitly charged to the occurrence month, so accepting one in each month is correct. This is excluded from the findings/score. Pure-engine month isolation, cap-zero and deadline checks passed. A fourth/same-month IPC freeze rejection was not completed in this round; test it in the corrected resubmission harness.

## Remaining review limitations

Native OS notification/sound delivery, real-time crossing of midnight, large-history renderer frame pacing and all backup rejection variants were not exercised in this round. Unit coverage includes midnight/DST/date boundaries, and existing isolated base-app review previously exercised packaging. Phase 1 installer/package smoke should follow the approved fresh build. Anchor-cycle validation and all archive/delete permutations deserve targeted fresh-round coverage. No live user database was read or modified.

## Artifacts

- `.review/phase1/ui-round1/results.json`
- `.review/phase1/ui-round1/supplement-results.json`
- `.review/phase1/edge-results.json`
- `.review/phase1/legacy-oldest/migration-results.json`
- `.review/phase1/legacy-v2/migration-results.json`
- Desktop: `ui-round1/home-light.png`, `habits-light.png`, `habits-dark.png`, `statistics-dark.png`, `weekly-light.png`, `detail-light.png`
- Confirmed defects: `ui-round1/weekly-partial-defect.png`, `privacy-focus-defect.png`, `privacy-statistics-defect.png`, `failure-3.png`, `failure-6.png`
- Responsive: `ui-round1/mobile-home.png`, `mobile-habits.png`, `mobile-statistics.png`, `mobile-focus.png`

The next round must independently rebuild/retest, repeat corrected flows and verify the preservation, weekly consistency, privacy and performance fixes before a final score.
