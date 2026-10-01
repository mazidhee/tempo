# Phase 1 independent review — round 3 progress

**INCOMPLETE / PAUSED at the user's explicit request. No final score or approval has been issued.**

Reviewed October 1, 2026. The user paused the build to install skills and resume in a new session. This file records completed evidence and remaining review work; it does not declare Phase 1 or the whole application finished. The expanded master build remains pending.

Application implementation was not edited by the reviewer. Electron tests exercised the real renderer, preload, IPC and SQLite using isolated fixtures under `.review/phase1`. Live user data and the installed application were not read or changed. The last already-running test completed before cleanup; the runtime closed its Electron child in `finally`. A read-only process check after cleanup found no `electron` process.

## Completed evidence

- The builder freshly reported successful `npm run typecheck`, **36/36 project tests**, and `npm run build`. These are builder-run checks, not a new independent test-suite run in this resumed reviewer turn.
- The previous Round 3 UI artifacts contain **13/14 passing checks**. The Statistics privacy assertion failed in that first harness. The Round 3 supplement independently passes **8/8**, including computed blur/native-label privacy, note-modal focus trap/restoration, quantity correction, freeze budget guards, weekly partial state, anchor cycle/archive/delete behavior and responsive controls. The packaged-app suite passes **14/14**, including privacy. The initial failure is therefore retained as a timing/selector discrepancy, not silently counted as a pass or a confirmed application privacy defect.
- Both fresh Round 3 legacy migration fixtures passed comparisons of every original habit/log field, IDs, archive state, notes, reasons and schedule metadata. V2 productivity JSON was preserved exactly and migration safety copies exist. `productivityPreserved: false` in the oldest fixture means that schema had no productivity JSON to compare, not that existing productivity data was lost.
- The existing packaged **1.1.0** application suite passed habit creation/checking, quantity thresholds, ordinary-note versus completion distinction, Avoid clean/slip behavior, freeze/undo preservation, schedules, detail/pause editing, weekly cells, privacy, tasks, linked fractional Focus, backup merge and desktop/360px views. This was packaged-executable smoke; Windows installer installation or upgrade was not performed by this reviewer.
- A fresh real Electron idle benchmark on **20 habits / 7,320 logs** passed with no renderer errors. Home frame p95 **17.2 ms**, Statistics **17.1 ms**; 20 ms timer-probe p95 **21.0 / 21.2 ms**. Earlier Round 3 measurements were similarly smooth at 16.8–16.9 ms frame p95.
- A separate, warmed **active-timer** Statistics profile on the same-size isolated fixture measured frame p95 **17.6 ms**, probe p95 **21.2 ms**, **95.6% idle CPU samples**, **zero main-content DOM mutations**, and **four timer-badge mutations** over four seconds. This supports removal of repeated clock-driven route rendering after data/chart loading.
- The final already-running, fresh isolated clock regression completed successfully: the timestamp deadline survived navigation and renderer reload; exactly **one 15-second completed Focus session** was persisted; exactly **one real notification invocation** was observed using a URL-based CDP breakpoint that survived reload; focus/visibility events did not duplicate either result. Statistics immediately showed the completed preset when grouped by Preset.
- With the renderer's wall clock fixed immediately before then after local midnight, Habits changed the completed occurrence to the next day's incomplete occurrence, and Home's final heatmap cell had the next day's `data-date`. Real timers continued running; this was a **simulated renderer clock crossing**, not a physical overnight or DST session.
- Final active-clock regression probe p95 was **20.9 ms** on both Statistics and Home, with no renderer errors. Its screenshot records Home after the simulated midnight rollover.

## Performance interpretation and limits

Early active-timer probes launched Statistics without reliably waiting for its asynchronously loaded habit history and chart content. Several recorded 375–623 ms p95 delays; one also enabled the debugger before performance sampling. These are real observations and must not be erased, but they do not establish repeated warmed timer-driven rendering. The corrected dedicated profile loaded Statistics once, returned with the timer running, waited for a heatmap and 2.5 seconds of warmup, then measured a stable main subtree and 95.6% idle samples. The final prewarmed clock regression likewise measured 20.9 ms p95.

The remaining performance uncertainty is **cold navigation / initial history loading**, especially at larger histories. No final cold-route latency threshold or fully attributed cold-load profile was completed. One idle Home maximum frame sample was 65.8 ms despite a 17.2 ms p95. Four-second samples and host load are limits on these measurements; they are not a guarantee of smoothness on every device.

## Harness corrections, not application fixes

- Each new clock/performance test copies only the isolated performance fixture into a uniquely named review directory. It never copies the live database.
- Focus preset names are unique; notifications are enabled only when currently disabled. Earlier blind toggling and duplicate names made reruns unreliable.
- The notification breakpoint now uses `Debugger.setBreakpointByUrl` to survive a renderer reload. Notification delivery by Windows is **not** asserted; only the application's real invocation was observed.
- `Uncheck habit Year habit 1` and `Complete habit Year habit 1` use exact accessible-name matching. The earlier substring query matched habits 10–19 as well, producing a count of 11.
- The Home heatmap date assertion uses `data-date`; its accessible label deliberately displays a localized date, so comparing it to ISO `YYYY-MM-DD` was an invalid harness expectation.
- Performance sampling now precedes debugger instrumentation, and the final clock regression prewarms the lazy Statistics route. The separate active-performance profile records both main-content and badge mutations.
- Failed review attempts and their unique isolated fixtures are preserved. They are not app implementation changes.

## Artifacts to resume from

- `.review/phase1/ui-round3/results.json`, `supplement-results.json`, `final-checks.json`, and existing desktop/dark/mobile/privacy screenshots.
- `.review/phase1/round3-legacy-oldest/migration-results.json` and `.review/phase1/round3-legacy-v2/migration-results.json`, with migration screenshots and original snapshots.
- `.review/phase1/packaged-round3/results.json` and packaged screenshots.
- `.review/phase1/performance-round3/results.json` and `home.png`, `statistics.png`, `detail.png` (fresh idle rerun).
- `.review/phase1/active-performance-round3-1790819264576/results.json` and `statistics-active-timer.png` (warmed profile and DOM-mutation evidence).
- `.review/phase1/running-clock-round3-1790819286900/running-clock-results.json` and `midnight-home.png` (final passing timer, notification-invocation, Statistics and simulated-midnight evidence).
- `.review/phase1/active-performance-round3.cjs` and `.review/phase1/running-clock-round3.cjs` (corrected, repeatable isolated harnesses).

## Remaining work after explicit resume

1. Inspect and consolidate the Round 3 visual artifacts against the unchanged Phase 1 build; independently rerun the project suite/build if source or dependencies changed in the new session.
2. Decide whether a targeted cold-Statistics-load profile is warranted. Warm active-timer rendering is now supported by direct profile and mutation evidence; cold-load timing remains a separate limitation.
3. Complete the weighted rubric—feature completeness 20%, correctness 25%, design 25%, code quality 15%, UX/accessibility/responsiveness 15%—and issue the actual independent final score. Apply the agreed stop condition of 9+ or the review-loop limit; no score is inferred here.
4. Keep native notification/sound delivery, real overnight/DST testing and Windows installer/upgrade verification explicit. Those were not established by this round. The whole-app release checklist additionally requires the expanded modules and integrated end-to-end use; Phase 1 acceptance alone cannot satisfy it.

**Work stopped after cleanup and progress preservation. Resume only when the user asks to continue.**
