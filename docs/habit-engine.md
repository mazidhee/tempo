# Phase 1 habit engine

Migration 3 adds the habit engine without deleting original columns, IDs or logs. All existing habits become Check + daily, as requested. Their old frequency/weekday fields remain as original metadata. A consistent SQLite `.before-habit-engine-*.bak` snapshot is created before the migration. The productivity JSON, tasks, presets and timer remain untouched.

New habit fields describe type, quantity target/unit/threshold, schedule, start date, weekly quota/start day, interval, stacking, non-negotiable status and freeze/pause caps. Logs gain quantity and explicit outcomes plus slip/freeze reasons. Version 3 creates `habit_pauses` for inclusive vacation ranges. No later schema edits bypass this migration.

`src/shared/habits.ts` owns `isDue`, outcome resolution, completion, streaks, rates and heatmap aggregation. Main-process writes validate these rules; a renderer cannot bypass midnight locking or caps. Time calculations use local civil dates, while retroactive deadlines use elapsed hours.

## Rules and choices

- Ordinary notes never complete a habit; completion has its own explicit action. Freeze notes preserve the original check-in note. Custom quantity offers both adding an amount and setting the total to correct an entry.
- Check completes explicitly. Quantity completes at target × threshold percentage; its personal heatmap shade still follows percentage of the full target. Collective heatmaps count qualified habits as binary completions.
- Avoid is never automatically clean. Stayed clean opens an explicit end-of-day confirmation. There is no arbitrary clock-hour gate, accommodating different daily routines. A logged Slip requires a reason and cannot be converted into clean or masked by a freeze.
- Daily, weekday and interval streaks count completed due occurrences. Non-due, paused and frozen occurrences never increase length. An unresolved today keeps the previous streak; a Slip today breaks it immediately.
- N-per-week days are flexible opportunities. Due eligibility uses only earlier records in that week, and a fulfilled quota makes subsequent unused days neutral. Today's eligible opportunity is pending and actual partial quantity work stays visible. Untouched flexible past days are neutral in daily grids/heatmaps; an unmet closed week's last day is a miss. The streak counts qualifying weeks, and rates use weekly quota opportunities. A week covered with freezes keeps the run alive without increasing it unless actual completions meet the whole quota. An entirely paused/pre-start week is neutral; partial weeks retain the configured quota.
- Freezes consume the covered occurrence's calendar-month budget, including a retroactive freeze entered in a new month. Default 3; 0 is strict. Already accepted freezes remain valid if the cap is later lowered. Today's freeze can be removed and refunded; past freezes are locked. Completed, paused, slipped and non-due occurrences cannot also be frozen.
- Retroactive recovery is available through exactly 48 elapsed hours after the missed local day's ending midnight, inclusive at the boundary. It does not reopen ordinary editing. The app offers a recovery notice on opening and eligible actions in Today/details.
- Pauses start today or later, use inclusive calendar days, and consume a separate per-year budget (default 14). Ranges cannot overlap or cover a completed/frozen/slipped check-in. Cross-year ranges are charged separately in each year. Past ranges are locked; unstarted ranges can be removed. Paused dates are excluded from rate denominators.
- Collective heatmaps exclude freezes from completion denominators and mark them with hatching. Archived habits contribute their recorded historical dates without creating new post-archive misses. Shade buckets are 0%, 1–49%, 50–99%, 100%.
- Non-negotiables are pinned first within their section. After-habit anchors order the remaining habits in the same section; cycles are rejected. Moving/deleting an anchor detaches affected children.
- Ctrl/Cmd+Shift+P toggles privacy; names and sensitive notes/reasons blur. Ctrl/Cmd+K command navigation remains available.

## Backup and testing

Backup format 2 includes the new habit fields, full logs and pause ranges. Version 1 imports remain supported and normalize to Check + daily. Import creates a SQLite safety copy and preserves the existing-record precedence policy. Habit CSV retains its original leading columns and appends type/quantity/outcome/protection fields.

Unit tests cover schedules, quotas, week starts, freezes, strict/capped protection, pause union/year boundaries, quantity thresholds, explicit Avoid confirmation, streaks, heatmap aggregation, migration preservation and idempotence, DST and midnight rollover. The independent reviewer additionally exercises actual Electron, preload, IPC and SQLite against isolated old-schema fixtures and desktop/mobile UI.
