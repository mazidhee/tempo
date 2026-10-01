# Phase 1 independent review — round 2

**Score: 8.9 / 10 (weighted 8.935). Meaningful improvement from 8.13; one responsiveness issue remains. Resubmit after fixing clock propagation.**

Independent review on October 1, 2026. Application source was not changed by the reviewer. Electron/preload/IPC/SQLite testing used isolated databases under `.review/phase1`. Live user data and installed application were untouched.

| Rubric | Weight | Score | Justification |
|---|---:|---:|---|
| Feature completeness | 20% | 9.3 | All required Phase 1 habit types, schedules, recovery, freezes/pauses, detail, grouping and privacy are present. Quantity correction is now usable. Existing tasks/focus/backup flows remain functional. |
| Functionality and correctness | 25% | 9.3 | Note action distinction and freeze preservation pass in real SQLite. Weekly eligibility/partial status, exact heatmap shade, cap/month/refund guards and anchor-cycle checks pass. All 36 project tests and 13 independent engine golden cases pass. |
| Design quality | 25% | 9.1 | Consistent restrained visuals, clean Lucide icons, strong light/dark layouts, repaired text and coherent 360px controls. Privacy protects table/card/modal text and safe native option labels. |
| Code quality and structure | 15% | 8.7 | Shared indexed engine, stable snapshots, memoized analytics and documented semantics are strong. The application-wide 250ms clock still invalidates routes/components that do not need timer updates. |
| UX, accessibility and responsiveness | 15% | 7.8 | Labeled correction controls, focus trap/restoration, native privacy labels and responsive layouts pass. Warm Statistics exhibits repeated main-thread delays approaching half a second even with no active timer. This undermines the explicit fast/smooth requirement. |

## Fixed and independently verified

- Build passed; **36/36 project tests passed**.
- **13/13 independent shared-engine cases passed**, including all three previously failing weekly current/partial/shade cases.
- Actual Electron ordinary Add note leaves an unfinished Check unfinished. Explicit Complete with note still completes; uncheck retains its note. Freeze stores protection text separately without replacing the original note, and undo works.
- Today and collective heatmap denominators now agree. Weekly Quantity shows **In progress** with `data-status="partial"`; selected-cell controls show its 25% ring. Personal year shade and historical partial outcome agree with the canonical engine.
- Custom Quantity **Set total / correct entry** changes total and completion predicate consistently, survives reload, and can restore the intended total.
- Corrected IPC budget checks pass: one September occurrence does not consume October budget; a second September freeze exceeds cap 1 and is rejected; cap 0 rejects; today undo refunds; expired dates and paused dates reject; pause overlap rejects.
- After-habit order, same-section restriction, cycle rejection, archive/restore and delete-detach pass against real IPC/database state.
- Privacy mode protects Statistics habit-name cells and expanded legacy cards with computed blur styles. Native Focus options use `Private habit <id>` rather than revealing habit names. Modal note textarea is blurred. Tab stays inside the dialog; Escape restores focus to its trigger.
- Existing task quick add/completion, linked fractional focus preset, timestamp deadline surviving reload, exact completed duration, and format-2 backup UI merge pass.
- Desktop light/dark, expanded 360px habit controls and selected weekly controls were clicked/screenshot-tested with no document overflow and no unexpected renderer errors.
- Fresh oldest-schema migration on this build preserved all original habit/log fields and created its safety copy. Both oldest and v2 schemas passed exact preservation in round 1; migration code is unchanged. A second fresh v2 launch in this round hit reviewer fixed-port reuse, not an application failure. The harness now selects unique ports and awaits process exit; repeat both fresh fixtures in the next round.

## Remaining issue and highest-impact improvements

1. **Isolate the clock from stable workspace state.** `ProductivityProvider` publishes `now` every 250ms through a context consumed by App/routes and `useHabitData`. Consequently Home/Statistics and their charts continue rendering while idle even though heavy calculations have been memoized. Use a narrowly scoped clock subscription for timer digits/badge/Focus and a minute/local-date subscription for greetings, due statuses and midnight rollover. Preserve timestamp accuracy and refresh behavior.

2. **Keep static charts and heatmaps stable between actual data/date changes.** Reuse stable derived arrays/objects and memoize costly chart/grid subtrees as needed so the timer clock does not trigger chart layout/reconciliation. A stopped timer should leave Statistics nearly idle. Keep data mutation and theme/range updates working immediately.

3. **Verify the final performance behavior in Electron, alongside timer/midnight regression.** Reuse the same small-history and 20-habit/7320-log fixtures. Measure warm frame/timer delays with no active timer and with a timer running in another route. CPU/frame measurements vary with host load; the useful acceptance evidence is removal of repeated clock-driven stalls rather than a fragile exact millisecond test assertion. Keep the corrected budget and asynchronous route tests in the reviewer harness.

## Performance evidence and limits

The independent year-engine calculation improved from **329 ms to 38.6 ms** for about 7300 logs, roughly an 8.5x improvement. That fix is effective.

The actual renderer remains costly while idle:

| Fixture/route | Warm frame p95 | 20ms probe p95 | Max probe delay |
|---|---:|---:|---:|
| Full year, first Home run | 100 ms | 108 ms | 141 ms |
| Full year, first Statistics run | 122 ms | 155 ms | 175 ms |
| Full year, repeated Home run | 136 ms | 133 ms | 163 ms |
| Full year, repeated Statistics run | 269 ms | 497 ms | 497 ms |
| Small-history Home baseline | not sampled | 155 ms | 180 ms |
| Small-history Statistics baseline | not sampled | 463 ms | 463 ms |

These are warmed samples after initial navigation/chart load, measured for three seconds. No unrelated review Electron processes were left running. A separate four-second Statistics CPU sample was **39% idle**; much of the activity was in the primary application bundle. Minification prevents precise component attribution from that summary alone. Host load changes the exact numbers, but repeated delays in both small and large fixtures make this a practical issue rather than only an engine benchmark concern. The code's broad clock propagation is the concrete next thing to fix.

## Harness corrections

- The first detail count queried before asynchronous route data loaded (0 cells). Waiting for the first heatmap cell then counting passed at 365, with pause create/remove and editor tested.
- The first partial-cell selector expected raw `partial`; the accessible label intentionally reads **In progress**. Corrected selector plus `data-status` assertion passed in `final-checks.json`.
- Fixed-port reuse caused one migration-launch failure; unique ports and waiting for child exit were added to review infrastructure. This is excluded from app score/findings.

## Artifacts

- `.review/phase1/ui-round2/results.json`
- `.review/phase1/ui-round2/supplement-results.json` (two selector failures corrected by the final checks)
- `.review/phase1/ui-round2/final-checks.json`
- `.review/phase1/edge-round2-results.json`
- `.review/phase1/performance-round2/results.json`
- `.review/phase1/performance-round2/cpu-profile-summary.json`
- `.review/phase1/round2-legacy-oldest/migration-results.json`
- Screenshots: `ui-round2/home-light.png`, `habits-light.png`, `habits-dark.png`, `statistics-dark.png`, `detail-dark.png`, `weekly-partial-fixed.png`, `privacy-focus-fixed.png`, `privacy-statistics-fixed.png`, `mobile-expanded-controls.png`, `mobile-weekly-controls.png`.

Native OS notification/sound delivery and Phase 1 installer installation were not retested. Real-time midnight crossing was not exercised; pure date/DST tests pass. No data correctness blockers remain in the exercised flows. The next round should focus on idle render behavior plus targeted regression of the verified fixes, then score freshly.
