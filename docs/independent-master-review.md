# Tempo independent master review — October 1, 2026

## 1. Contract and coverage

Independent reviewer, not a builder. Authority: `master-build-brief.md`, `master-review-packet.md`, `release-readiness.md`, `PRODUCT.md`, the supplied Linear `DESIGN.md`, the Foundation Operate direction contract and Impeccable craft guidance. Code-first was approved; no visual comp was supplied. This review uses actual Electron/preload/SQLite, not persistence mocks or a browser-only approximation. Every runtime database is under a unique `.review/` directory. The owner's live database, real hosts file and unrelated applications were not modified.

Initial tested source: `ca4abd52e5ac8e14929af50c7da7e499f134c010` plus recorded integration changes. Final reviewed candidate: `1433cb46e3d346efbf9af609556b4ad2e605865a`. Packaged `Habit Tracker.exe` SHA256: `354B823FA95B089F0B75B6B28A6AC281A6D7034450184B6F785190B1B1EE4D30`; `resources/app.asar` SHA256: `F349E4FF2CCCA0A85BEA23D1764D22252102E986F436D05E24BBE5B8ED75A369`, independently read from disk after packaging. **Final score: 9.18/10; ship the reviewed candidate.** Installed upgrade acceptance is separate from this independent package review.

Independent commands:

```powershell
npm run typecheck
npm test
npm run build
node scripts/independent-review.cjs
node tests/focus.electron.cjs
node scripts/independent-review-followup.cjs
node scripts/independent-packaged-review.cjs
node scripts/independent-narrow-tasks.cjs
node scripts/independent-native-size.cjs
$env:REVIEW_EXE='release/desktop/win-unpacked/Habit Tracker.exe'
$env:REVIEW_NAME='independent-round2-package-20261001'
node scripts/independent-review.cjs
node scripts/independent-journal-recapture.cjs
```

Typecheck, all 81 tests and production build passed independently. The initial restricted shell prevented esbuild/Vite helper processes with `spawn EPERM`; rerunning with normal child-process access passed. Evidence: `.review/reviewer-typecheck.txt`, `.review/reviewer-tests.txt`, `.review/reviewer-build.txt`. No elevated OS Guard operation was used.

Frozen round 2 source independently passed typecheck, **82/82 tests**, and production build: `.review/reviewer-round2-typecheck.txt`, `.review/reviewer-round2-tests.txt`, `.review/reviewer-round2-build.txt`.

| Requirement | Independent evidence | Scope |
| --- | --- | --- |
| All eleven pages, both themes, desktop 1280 and narrow 390 | Final `.review/independent-native-1790863564180/`: 52 captures at actual BrowserWindow content sizes1280×720/390×720; all44 page views inspected via eight sheets, all eight module Settings views inspected full-size. `.review/independent-round2-package-20261001/`: separate52 captures at renderer1280×860/390×860 | Native content dimensions and renderer widths checked; document widths match and topbar controls remain inside viewport. As-launched1280×720 matches this machine's1280×720 work area. |
| Habits | Created Check, Quantity and Avoid through forms; completed with note; edited, archived/restored, logged custom quantity and slip reason; opened detail/history; privacy enabled and captured | Actual UI/IPC; schedule/lock/freeze/cap/pause/recovery/date-boundary correctness also covered by full suite, rather than every variant being manually clicked |
| Tasks | Quick add, project/tag/high-priority edit, subtask, completion/reopen, priority/project/tag filtering and task-linked Focus. Final390px independently asserted initial action bounds, clicked edit, Focus link and delete | `.review/independent-narrow-tasks-1790863601969/result.json`; actions occupy x239–337 before any scrolling |
| Focus | Start/pause/resume, renderer refresh, linked task/Study, global emergency exit, preset CRUD/custom three seconds, skip, exactly one completion after refresh | Actual UI/main-process records; dedicated runtime test additionally checks close-to-tray and process restart |
| Focus Guard | Strict exit, disabled-by-default, isolated hosts add/remove/startup cleanup, unrelated fixture preservation and stale-renderer protection. Final package also clicked custom-list CRUD, opt-in, pause, skip to break, Repair and conflicting shortcut save | `.review/independent-packaged-1790863557755/result.json` plus independent `tests/focus.electron.cjs`; native elevation, live app closure and physical notifications are not certified |
| Study | Curriculum/topic/nested topic creation, learned progress, Focus linkage | Actual UI; graded reviews, scheduling, archive and migration invariants covered by tests |
| Reflection | Three-priority maximum, evening completion/sleep/energy/journal, Journal FTS/edit/refresh persistence, task goal, weekly generation and saved prompts; final packaged Reminder opt-in/time save and reload | Actual UI; all goal kinds, canonical weekly calculations and reminder deduplication covered by tests |
| Backup/migrations | Real full export/repeat import; full-suite clean restore, collisions/remapping, malformed rejection, legacy formats, original rows and transactional markers/safety copies | Actual IPC plus SQLite tests; installed owner-workspace upgrade remains separate |
| Accessibility/performance | Keyboard command palette and dialog restoration; narrow sidebar navigation; labelled-control scan, reduced motion and contained scrolling; active timer DOM mutation sampling | No full screen-reader certification, physical sleep/wake or overnight trial |

## 2. Fidelity and craft

The application follows the pinned Linear adaptation: near-black `rgb(1,1,2)` canvas, four charcoal surface levels, subtle hairlines, neutral selected navigation, lavender primary actions, local Inter and JetBrains Mono, and compact desktop hierarchy. The derived light theme uses white canvas and neutral pale surfaces. No external HTTP font/resource requests or renderer errors occurred in the capture pass. No second decorative accent, gradient/glow styling or shadow-led card hierarchy was observed.

At 390 pixels the sidebar becomes an accessible drawer, page headers wrap, column layouts stack, and window controls remain reachable. Annual calendars and the Habits grid intentionally scroll inside their panels. Final Tasks uses compact rows retaining due/priority/project metadata and all primary actions in view. Every initial capture had document width equal to viewport width. Final Reminder labels wrap naturally on narrow screens and remain single readable lines on desktop; Focus switches align at row ends. Keyboard command and dialog flows passed.

Initial weaknesses: Journal incorrectly labelled its breadcrumb “Habits”; legacy captions of 9–11 pixels fell below the promised 12-pixel caption scale. Both were reported and addressed by integration. A single detector warning identifies the authored sidebar width transition; this corresponds to the brief's required collapse animation and is not evidence of observed jank. Reduced motion removes the transition.

## 3. Findings and evidence

| Finding | Reproduction / evidence | Status |
| --- | --- | --- |
| Journal breadcrumb mismatch | Initial Plan → Journal capture showed “Workspace / Habits” | Fixed; actual final packaged chrome and native captures show Journal |
| Small legacy captions | Home calendar legend/axis and Statistics metadata used9–11px CSS | Fixed to12px caption token; final full matrix inspected |
| Windows process isolation | `SystemProcessAdapter.list()` initially filtered all `SessionId > 0`; close identity lacked session check | Fixed to Tempo's exact session, rechecked alongside PID/path before close. Actual harmless PowerShell fixture test passes; readonly real CIM query saw286 records and zero outside session1. No live apps closed. |
| Priority filtering | Initial Tasks lacked an explicit priority filter | Fixed; final package independently tested low/high and project/tag text filters |
| P1 Reminder desktop layout | Round1 desktop time Input squeezed labels into one-character columns; `settings-reflection reminders-dark-1280.png` and light equivalent | Fixed in1433cb46; all four final native Reminder captures inspected full-size |
| P2 Narrow task action reachability | Round1 action column required panning after metadata columns | Fixed compact rows; final initial bounds and actual edit/Focus/delete clicks pass |
| P2 Focus switch alignment | `.form-stack label` specificity overrode the component flex row | Fixed scoped selector; four final native Focus settings captures inspected full-size |
| Narrow Habits grid | Current week table's later days remain inside a horizontal scroll region | Low-priority polish opportunity; functional and no document overflow |

Review-harness locator/time-readiness failures were corrected and excluded from product defect counts. For example, Journal save persisted correctly in SQLite; its reload assertion required waiting for the actual entry to hydrate, rather than reading an initially empty textarea after a fixed 300 milliseconds. The final follow-up passed with data-ready waits. Follow-up evidence: `.review/independent-review-1790860539588/followup-result.json` and `.review/reviewer-followup.txt`.

Initial active-timer DOM samples: Home 210 ms warmed navigation, three heatmap mutations and zero widget mutations over 2.4 seconds; Statistics 184 ms, two heatmap mutations and zero widget mutations. These include initial settling and support the absence of the earlier broad per-second DOM rebuild. They are not React-profiler measurements, a cold navigation benchmark or a claim about large real datasets.

Final packaged settled samples, with a running timer: Home365ms and Statistics255ms warmed navigation; **zero broad heatmap/widget/chart DOM mutations** during each2.6-second sample after a1-second settling period. Evidence: `.review/independent-packaged-1790863557755/result.json`. Cold/large-dataset performance remains unbenchmarked. The optional native Journal recapture initially closed during the integrator's concurrent NSIS install; a retry passed and captured all four views after search debounce settled (`.review/reviewer-round2-journal-recapture.txt`). This interruption is excluded from product defect counts.

## 4. Weighted rubric and disposition

Round 1 reviewed source `bf37ac07f3fb5d02e906d22dc81916d8d73c4137` and its packaged executable. Independent typecheck, 82 tests and production build passed (`.review/reviewer-final-typecheck.txt`, `.review/reviewer-final-tests.txt`, `.review/reviewer-final-build.txt`). The fresh packaged matrix passed all eleven shared flow groups and produced 52 captures in `.review/independent-final-package-20261001/`; all 44 initial page captures were visually inspected through eight contact sheets, together with full-size module Settings captures. Zero renderer errors, external HTTP resources or document overflow were reported. Journal chrome, captions and priority filtering passed this candidate. The package's ASAR SHA256 was `CFE3B47A663195C25321C0C9AE8169B8036AEA7EE0A23EC046F54376DCF70468`.

| Round 1 criterion | Weight | Score | Reason |
| --- | ---: | ---: | --- |
| Completeness | 20% | 9.4 | Required modules and shared workflows are delivered; native acceptance limitations remain explicitly bounded. |
| Correctness | 25% | 9.1 | 82 tests and actual Electron persistence/timer/backup flows pass; physical Windows delivery is not established by fixtures. |
| DESIGN fidelity | 25% | 8.8 | The Linear palette, typography and surface hierarchy hold, but desktop Reminder layout visibly violates readable row structure. |
| Code quality | 15% | 8.8 | Main-owned timers, migrations and identity rechecks are covered; legacy CSS specificity still creates integration defects. |
| UX/accessibility/responsiveness | 15% | 8.0 | Core keyboard and narrow navigation work; reminder labels collapse vertically, task actions require horizontal panning and Focus switches lack intended alignment. |
| **Weighted result** | **100%** | **8.88/10** | `9.4×.20 + 9.1×.25 + 8.8×.25 + 8.8×.15 + 8.0×.15 = 8.875`. |

**Round 1 disposition: fix and recapture.** The material Reminder defect prevented acceptance despite numeric overflow checks passing. The three fixes were implemented before the following independent round2.

| Round2 criterion | Weight | Score | Reason |
| --- | ---: | ---: | --- |
| Completeness | 20% | 9.4 | Eleven modules and shared workflows pass the actual final package matrix; broad requirement variants have explicit suite evidence. |
| Correctness | 25% | 9.1 | Independent82 tests, core real Electron flows, Guard fixtures and reminder persistence pass; native delivery limitations are stated. |
| DESIGN fidelity | 25% | 9.3 | Both themes retain the pinned palette/type/surfaces; Reminder and Focus rows now have coherent alignment. |
| Code quality | 15% | 8.8 | Timer/migration/identity invariants remain sound; distributed legacy CSS warrants future consolidation. |
| UX/accessibility/responsiveness | 15% | 9.2 | Readable Reminder controls and immediately reachable narrow task actions resolve the material usability findings; full assistive-technology audit remains unperformed. |
| **Weighted result** | **100%** | **9.18/10** | `9.4×.20 + 9.1×.25 + 9.3×.25 + 8.8×.15 + 9.2×.15 = 9.18`. |

**Round2 disposition: ship the reviewed candidate1433cb46.** No remaining blocking defect was reproduced. The user review loop ends after two rounds because the score exceeds9. All three round1 priorities are independently verified in the package.

Installed-app readiness is a separate gate: candidate correctness and a 9+ design score do not prove Windows UAC delivery, physical notification/sound delivery, real installation upgrade or overnight/sleep behavior.

## 5. Highest-impact improvements

The three highest-impact improvements from actual round 1 evidence:

1. **P1 — Restore readable Reminder rows.** Bound the label, switch and time-input columns. On desktop, the full-width time input currently squeezes labels into one-character vertical columns. Recapture both themes and widths from the rebuilt package.
2. **P2 — Keep narrow Tasks actions reachable.** At 390 pixels the task's Focus/edit/delete column begins offscreen after all metadata columns. Use a compact row or retained action area while keeping due date, priority and project visible.
3. **P2 — Align Focus setting switches.** The more-specific `.form-stack label` rule overrides `.focus-setting-row` flex layout, leaving switches directly beside variable-length labels. Scope the component selector so the intended label/control alignment survives integration.

All three changes were made by the integrator and verified independently in round2. Nonblocking highest-impact follow-ups after the9+ stop condition:

1. Improve narrow Habits week navigation so the current day is visible with less horizontal panning.
2. Consolidate legacy form/layout rules into scoped component styles to reduce future specificity collisions.
3. Profile cold navigation with a large realistic fixture and run a focused screen-reader audit; the current small-fixture and keyboard evidence does not establish those claims.
4. Preserve a clearly scoped native acceptance record for physical notifications/sound, sleep/wake and opt-in Windows UAC Guard behavior; fixture success must not be reported as physical delivery.

The integrator reports installed upgrade acceptance passed after the reviewer gate (`.install-check/master-upgrade-1790863834869/acceptance.json`). This is builder-supplied evidence, not an independent installed acceptance run. The recorded original workspace has zero habits/logs/tasks/sessions and three presets; populated preservation is established by fixtures.

Third-party provenance is recorded in `THIRD-PARTY-NOTICES.txt` and `docs/license-manifest.json`; locally bundled fonts and the single Lucide icon family were checked in the runtime review.
