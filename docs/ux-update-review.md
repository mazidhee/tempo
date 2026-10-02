# Tempo 1.4 UX follow-up independent review

Round 1, 2 October 2026. **Disposition: FIX. Weighted score: 8.62/10.** This review covers the reported Plan, Focus, Guard, appearance and collapsed-navigation defects. It does not certify the installed owner instance or a subsequently built package.

| Dimension | Weight | Score | Assessment |
| --- | ---: | ---: | --- |
| Completeness | 20% | 9.2 | Requested picker, Plan, Focus, Guard, palette and sidebar paths exist and work. |
| Correctness | 25% | 8.2 | Timer/native separation passes; a delayed settings acknowledgement corrupts intervening text. |
| Design | 25% | 8.7 | Solid palettes retain the incumbent hierarchy; intermediate-width Settings has an internal horizontal overflow. |
| Code quality | 15% | 8.4 | Shared bounded picker and native coalescing improve structure; renderer snapshot reconciliation needs correction. |
| UX | 15% | 8.6 | Search and selected-only plans remove overload; responsive Settings and save fidelity still need work. |

## Persistence contract

Independent `npm test`: **100/100 pass**. Independent `npm run build`: **pass**. Real Electron fixture imported all three actual bundled curricula, producing 1,823 topics. The corrected UI review passed **10/10** checks, including pagination and keyboard/curriculum search, same-day journal/priority draft retention, Plan day switching, per-topic Focus start, five Pause/Resume cycles, same-frame duplicate start/stop actions, one saved tracked session, backup provenance, palette/accent independence, refresh and a real process restart. UI Pause commit times were 450, 131, 149, 199, 183 and 166 ms. No renderer errors or remote resource requests were observed.

The bounded save-latency fixture adds 200 ms only to `productivity:save` in a private copy of the production Electron build. Typing `Divine Reviewer Long Name` at 25 ms per character resulted in `Dneame`; the input, persisted SQLite snapshot and reload all agreed on the damaged value. Ordinary real-disk typing at 15 ms per character passed. This establishes a latency-dependent renderer reconciliation defect, rather than a failure of ordinary SQLite persistence. `ProductivityProvider.update()` installs each earlier acknowledged snapshot while later optimistic writes are still queued; `focus:changed` also replaces the entire optimistic state. Preserve/rebase pending edits and acknowledge authoritative timer changes without rolling back newer settings.

No owner database, installed owner process, real hosts file or unrelated process was modified. Every fixture app and the dedicated native target was closed after checking.

## Fidelity contract

Reviewed real screenshots of Plan/Focus at 1280 and 390 in Tempo, Graphite, Slate, Dusk and Forest, light and dark modes. Palette choices are solid, distinct and independent of the solid Cedar accent. Long selected topics wrap; the compact timer retains clear action hierarchy. The 390 px search modal wraps the actual longest unique imported title and breadcrumb, stays within its width and closes with Escape. The collapsed rail's brand/search/navigation/avatar/collapse controls all lie within 0.34 px of the rail center; the actual rail measures 76 px in reviewer geometry.

Settings at 390 stacks correctly. At 800, the expanded application rail and persistent Settings section column leave approximately 250 px for the appearance panel, with a visible horizontal scrollbar in the main content scroller. Document-level `scrollWidth` alone misses this internal overflow. Stack Settings sections at an earlier breakpoint and let appearance/accent controls wrap within the available pane.

## Ceiling contract

This is one scoped review round, with harness corrections separated from product findings. The initial result-count selector incorrectly included native collection `<option>` elements; the failed assertion left the modal open and cascaded into later checks. A later physical triple click could legitimately toggle Start/Pause across separate settled actions; the final duplicate-action check dispatches three same-frame clicks and passes. A mislabeled Coral accent was corrected to the actual Terracotta choice. These are harness mistakes and are not product defects.

The save-latency experiment was run once. The native fixture supplied only the reviewer-owned `FocusReviewProbe.exe` and used a private FileHosts denial/delay; it invoked the real production Windows close adapter. Website failure did not suppress the app close: one native target exited safely, no close error, and Pause returned in 119 and 53 ms. Native closure took about 20 seconds. The sampled Guard status was honestly pending while work drained, with concise recovery copy and bounded diagnostics. Native throughput optimization is deferred; successful closure and responsive timer meet this release's defect scope.

## Material fixes

1. **Required: preserve later optimistic edits across queued save/event acknowledgements.** Retest the one 200 ms save fixture, rapid cross-field palette/accent updates, real Focus event delivery and reload. The final persisted string must equal the requested string.
2. **Required: adapt Settings at intermediate widths.** Stack the section navigation earlier and wrap appearance/accent controls; verify 800, 390 and desktop with the main scroller's geometry, not only document overflow.
3. **Documentation: describe the 1.4 interaction changes in the offline guide.** Cover searchable pickers, selected-only automatically saved study plans, per-topic Start focus, independent mode/palette/accent choices, concise website retry and independent App Guard. The guide has since been updated to identify the 1.4 scope; its final content is part of the targeted resubmission.

## Keep contract

Keep the 30-result page bound, keyboard and curriculum filtering, selected-only study rows, same-day unsaved reflection retention, above-ring Focus link placement, visible tracking Save and stop, responsive timer ownership, website/app failure separation, exact native process identity checks, solid independent palettes, centered sidebar and existing data/import provenance. Keep Privacy mode behavior; its confirmed behavior was not changed by this review.

Evidence: `.review/ux-update-review-1790938564849/results.json` and screenshots contain the passing UI/restart batch; `picker-long-narrow.png` was recaptured at an actual 390 px viewport. `.review/ux-update-review-1790938424905/native-guard-results.json` references the native diagnosis and denial screenshots. `.review/ux-update-queue-1790938713699/queue-results.json` and `settings-800.png` establish the two required fixes. Reviewer harnesses: `scripts/ux-update-review.cjs`, `scripts/ux-update-queue-review.cjs`, and the bounded recapture helper `scripts/ux-update-picker-capture.cjs`.

**Next verdict:** targeted recapture/retest of this material batch; acceptance requires at least 9/10 and no remaining material defect. Exact package smoke and installed acceptance follow source acceptance.

## Round 2 targeted verdict

**Disposition: SHIP source candidate. Weighted score: 9.27/10** (completeness 9.4, correctness 9.3, design 9.2, code 9.2, UX 9.2; unchanged weights). No material fix remains. Exact package and installed-owner acceptance are separate gates.

Independent tests **101/101 pass**; independent final build **passes**. The same 200 ms private save fixture now preserves `Divine Reviewer Long Name` in the input, authoritative persisted snapshot and reload. A real Focus start delivered during typing remains running after queued writes drain. Rapid cross-field changes end with Forest and Cedar after reload. This confirms both preservation of later optimistic edits and authoritative timer delivery in the actual app, beyond the new reconciliation unit test.

New screenshots at 1280, 800 and 390 confirm readable stacked Settings navigation and fitted palette/appearance controls. The main scroller's client/scroll widths are respectively 1046/1046, 566/566 and 380/380; appearance controls also match client/scroll widths. The intermediate-width scrollbar is gone. The offline 1.4 guide now documents bounded search, selection autosave, per-topic Focus, independent appearance choices and website retry/App Guard behavior.

Persistence, fidelity and keep contracts pass; the bounded ceiling is reached after one material batch and its targeted confirmation. Retain round 1's passing 10/10 UI/restart checks and unchanged native Guard evidence. Deferred native throughput optimization is outside the accepted material batch. Evidence: `.review/ux-update-queue-1790939027458/queue-results.json`, `settings-800.png` and `settings-390.png`. All reviewer fixture processes were closed.

## Exact package gate

**Disposition: SHIP packaged candidate, 5/5 smoke groups pass.** Ran the actual `release/desktop/win-unpacked/Habit Tracker.exe` using two launches in a fresh isolated directory. The package imported all three supplied sources to 1,823 topics and repeated import remained idempotent; its 30-result keyboard/curriculum Plan picker saved automatically, started the correct linked topic and paused responsively. Profile, Graphite and Cedar persisted; Settings fitted at 800 px; the offline 1.4 guide rendered. Collapsed navigation and captured layout remain correct, with no renderer errors or remote resources. Actual package restart preserved profile, palette, accent, all topics and the dated Plan selection. Both reviewer packaged fixture launches are closed. Owner installation and owner-data preservation remain the root agent's separate acceptance gate.

| Artifact | SHA256 |
| --- | --- |
| `release/desktop/win-unpacked/Habit Tracker.exe` | `4B6C28E263872DEFA1657263F19962A4C43F90B62F7A358D84FD40433D98C510` |
| `release/desktop/win-unpacked/resources/app.asar` | `1E573B34991D8F4AF336773422C12FD99F975C39FBE6ACF3229F6FEDB38B611B` |
| `release/desktop/Habit Tracker Setup 1.4.0.exe` | `45FB100378DB9CD90485EF2AA19CDC52B4369054E852D9843A4361501C36DBED` |

Evidence: `.review/ux-package-review-1790939372002/results.json`, `settings-800.png`, `focus-collapsed.png`; harness `scripts/ux-package-review.cjs`. The first package harness attempt searched a short title whose breadcrumb matched several results; ArrowDown correctly selected another result, so its expected-ID assertion failed. The bounded correction uses the same longest unique title as the passing source review and requires one search result before keyboard selection. This was a harness correction, not an app defect or source change.

## Installed data discrepancy: independent read-only audit

The root agent's owner installation gate observed a discrepancy again. Source/package acceptance above **does not resolve its cause or certify owner-data preservation**. The reviewer opened only the two explicitly retained consistent `before.db` copies read-only; no live owner DB or owner app was accessed. Both copies report SQLite `integrity_check=ok`.

| Retained snapshot | SHA256 | Observed state |
| --- | --- | --- |
| `.install-check/personal-upgrade-1790939476565/before.db` | `A7D0209DB47F6E20616578712D5D80758C053535D2FD79C3143611C9F99E7007` | 1 habit, 4 curricula, 1,823 topics, 1 task, 2 saved reviews, Guard off |
| `.install-check/personal-upgrade-1790939824685/before.db` | `B4D98C1F177C06B3CEC188699638B349C12C7D81D63FA773651438454513F588` | 3 habits, 1 log, 3 curricula, 1,823 topics, 0 tasks, 1 saved review, 1 session, 2 Focus events, Guard on |

The original task is absent from the newer copy. **All 1,823 topic IDs and all four original curriculum IDs have zero overlap** with the newer snapshot. Three import source hash IDs overlap, but their payloads now reference different curriculum IDs. One saved review week is missing and the common week differs; the common habit ID also differs in content. Therefore equal topic counts establish availability of the source content, not preservation of original identities or relationships.

The newer snapshot's curricula were created on 1 October at 21:30:50 UTC, whereas the earlier copy's imported curricula were created at 20:42:36 UTC. The newer copy also contains an emergency event dated 1 October 21:49:18 UTC, plus a 2 October event. The divergence includes historical state predating today's upgrade. This limits attribution; it does not prove an external actor, a path problem or an app defect.

The relevant source/harness audit found explicit `HABIT_TRACKER_DATA_DIR` isolation or the default Electron userData path, and no automatic startup restore/reset that explains the snapshots. The installed harness clears isolation variables, verifies the actual userData path and candidate ASAR, and performs only its documented temporary task and optional source-import flows; no unexpected profile seed exists in scripts/tests/source. The repaired renderer acknowledgement issue writes productivity state and cannot by itself replace all Study IDs or habit rows. Ordinary backup import is an explicitly invoked merge API, not an automatic restart restore. SQLite integrity is not evidence of which process/path caused divergent content.

**Installed preservation remains a separate verification gate.** Root will perform the authorized non-destructive recovery while keeping current preferences, progress and session history, and verify two complete restarts. Original imported topic identities require semantic/source mapping to current imported trees if relationships must be recovered; blindly adding all missing UUIDs would duplicate all 1,823 topics. The unexplained initial discrepancy must remain recorded even if recovery and later persistence pass.

Evidence: `.review/ux-installed-snapshot-audit.json`; read-only helper `scripts/ux-installed-snapshot-audit.cjs`. No production source/package change was made by this audit.

## Builder's installed completion record

The builder subsequently retained both divergent backups, ended the old paused
phase with explicit owner permission, and performed an additive merge. That merge
created duplicate topic copies; automatic approval rejected deleting them. The
builder instead archived only the three recovery-copy curricula and verified all
1,823 original current topic rows and current curricula unchanged. No topic was
deleted. The old missing task and earlier records were recovered; current
preferences and completed sessions were kept. There are 1,823 active supplied
topics plus 1,823 archived recovery-copy topics.

The final real installed gate passes version/userData/ASAR identity, temporary
task refresh and full quit/relaunch, tray/second-instance restoration, offline
navigation, every post-recovery record and exact preferences, with zero renderer
errors and SQLite integrity OK. Evidence supplied by the builder is
`.install-check/personal-upgrade-1790940899478/acceptance.json`; archive proof is
`.install-check/archived-recovery-1790940812374/archive.json`. This is builder
installed acceptance, distinct from the reviewer's independent source/package
verdict. The historical discrepancy's cause remains unexplained. See
[release evidence](ux-release.md) for counts, safety copies and limitations.
