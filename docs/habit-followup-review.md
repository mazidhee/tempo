# Habit follow-up: interim independent review

October 6, 2026. Reviewed the first stable-greeting and collapsed-slip-reason checkpoint on `codex/habits-work-1.7`. This is an interim bug check, not approval of the proposed full redesign or a release score.

`npm run build` passed. `npm test` passed 118/118. The actual Electron app was launched with `scripts/electron-runtime.cjs` and a new isolated database. The installed app and owner database were not used.

## Actual application results

Evidence: `.review/habit-followup-1791287174666/results.json`; screenshots share that directory. The reproducible harness is `scripts/habit-followup-review.cjs`.

- At 1280px and 390px, a long fictional slip reason starts collapsed, opens on request, and does not squeeze the title or overflow the document.
- **Blocker at 800px:** the expanded sidebar leaves too little content width for the daily row's auto-sized action column. The habit title shrinks to 13.10px and forms vertical letters even with the reason collapsed. See `habit-800-collapsed.png`. Responsive stacking needs to account for available content width, not only the viewport's 650px breakpoint.
- Editing opens the existing reason rather than an empty field; saving without changes preserves the reason.
- Home's greeting is identical after navigation through Tasks, Habits and Journal and after reload in the same time period.
- No renderer errors were observed.

At desktop width, an expanded reason makes the row tall and vertically centres its title. For the final redesign, put the expanded note below the main title/control row or top-align the title.

## Fictional concept preview

Captured the three habit compositions at 1440px, 800px and 390px, the five thought presentations, and the logo options. Evidence: `.review/habit-prototype-1791287297829`; harness: `scripts/habit-prototype-review.cjs`. No JavaScript errors were observed. Desktop compositions are clearly distinct and usable for a preference decision.

At 390px, the `occurrences` label on the streak clips on the right. The document's overflow metric does not catch this because overflow is hidden; fix the narrow streak track or wrap/shorten the unit. Final check-in controls also need explicit state semantics. Concept samples are fictional and do not establish correctness of production streak logic.

The habit and logo selections remain the user's decision. This checkpoint is not ready for installation until the medium-width defect is corrected and the remaining authorized scope is implemented and reviewed.
