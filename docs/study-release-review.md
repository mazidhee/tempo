# Independent Tempo 1.5 review

## Round 1 — October 3, 2026

The reviewer independently ran the current source, rather than carrying over the
previous release score. Full tests passed **110/110**. Independent `npm run build`
passed, including TypeScript and Electron/preload bundles. Initial sandboxed
attempts failed at native spawning; the permitted outside-sandbox retry passed.
The usual bundle-size warning remains; it did not prevent the build.

Actual Electron with its real preload/SQLite passed **11/11 review flows**, using
fresh reviewer-owned databases. Evidence:
`.review/study-release-round1-1791050613967/result.json`, screenshots and layout
measurements in that directory. Every original one of the 1,823 bundled-outline
topics retained its exact ID and record. The single extra topic was created,
edited, learned/unlearned and archived/restored by reviewer UI input. The same
database was relaunched to verify saved current-topic metadata, cover and rich
journal content. No owner database was opened or changed.

Exercised flows: library/detail routes; breadcrumbs, search and bounded rows;
current topic and expiring focus window; Home linked focus start and Pause; topic
forms and review view; local cover add/remove/replace and SVG rejection; existing
plain journal conversion, bold formatting, autosave/search/date navigation; Plan
priority saving and independent weekly review generation; habit creation, direct
completion, deletion cancellation/confirmation and actual deletion safety copy;
local backup preview and explicit GitHub encryption/password confirmation.
The light/dark visual matrix covers Study, Journal, Plan, Review and Habits at
1280, 800 and 390 pixels. Screenshots were visually inspected; document geometry
showed no horizontal overflow. Corrected test-selector/timing errors from the
first attempts were not treated as app defects or omitted product failures.

A separate real-Electron exploratory run verified incorrect-password rejection,
correct encrypted-file preview and idempotent backup merge with renderer reload:
`.review/study-exploratory-1791050724207/findings.json`. GitHub transport privacy,
ciphertext-only writing, separate backup branch and safe-error behavior were
tested independently by the full unit suite's injected transports. No actual
remote upload, owner-app blocking or Windows credential sign-in was performed by
the reviewer. Source publication and installed-owner-data acceptance remain
builder release gates, not claims established by this isolated runtime review.

| Rubric | Score | Justification |
| --- | ---: | --- |
| Feature completeness (20%) | 9.3 | Requested Study/Home/backup/habit deletion/journal/navigation features exist; current data and earlier features remain available. |
| Functionality/correctness (25%) | 9.0 | Tests, real UI flows, encrypted restore and restart pass; continuation and unsaved Plan handling have meaningful edge cases. |
| Design quality (25%) | 8.7 | Clean solid palettes, consistent icons and strong document layout; selected-topic context is unnecessarily separated below the browser. |
| Code quality/structure (15%) | 9.0 | Shared typed continuity and validation, versioned migration, native encryption/credential boundary, reusable components and meaningful tests. |
| UX/accessibility/responsiveness (15%) | 8.3 | Responsive screens and labelled controls work, but silent Plan draft loss and hidden selected-topic details interrupt navigation. |

**Weighted score: 8.88/10.** Implement the three highest-impact improvements and
resubmit for a fresh review:

1. Preserve an unsaved Plan draft when changing dates or navigating away, or
   explicitly warn before discarding. Reproduction: add a priority without saving,
   change Plan date and return; it disappears without an indication. Keep saved
   server state separate from draft recovery and prevent older acknowledgements
   from replacing newer drafts.
2. Continue forward after a manually selected late topic is completed. With
   Earlier / Current late / Next still ordered in a chapter, completing Current
   late returns Home to Earlier. Prefer the next unfinished later leaf, falling
   back to earlier unfinished work after reaching the end. Preserve ID/history
   and handle archived siblings and descendants consistently.
3. Make selected-topic details immediately perceptible when a leaf is opened.
   In the exploratory 1280×860 screen, inspector bounds were y=870.6–1026.4;
   the topic click changed highlighting but left title/details/focus controls
   below the viewport. Place the inspector before the browser or use an accessible
   adjacent drawer/dialog and expose the current continuation target near its CTA.

Optional smaller polish: keep Journal's Find a memory icon and label on one row,
and reduce secondary habit-row controls without hiding recovery or deletion.

## Round 2 — October 3, 2026

Fresh independent source build passed and the final full suite passed **114/114**
(`.review/study-release-review/round2-final-tests.txt`). The initial round-2 test
run exposed a migration test fixture that omitted legacy base tables; the builder
corrected the fixture and the reviewer reran the complete suite. This failure
was not silently treated as a passing run or reported as a production migration
defect. No production implementation changed for that fixture correction.

The current real-Electron full matrix again passed **11/11**, including all
1,823 exact original topic records, rich legacy journal, covers, habit deletion,
Home focus, local preview and relaunch. Evidence:
`.review/study-release-round1-1791053151552` (the harness prefix is unchanged,
but this directory is the new round-2 candidate).

Additional new runtime evidence is in
`.review/study-round2-additional-1791053443862/findings.json` and visually
inspected screenshots. It verifies all three requested round-1 changes:

- Completing a pinned later leaf advances Home to the next unfinished leaf.
- Added priorities and unadded title drafts survive date switches, navigation,
  Save followed by a newer edit, and full application relaunch.
- Selected inspector is now above the browser; measured desktop bounds are
  y=390.5–546.2 inside the 860px viewport, with focus/current controls visible.

The new nested journal uses real keyboard input for Enter, Tab and Shift+Tab,
fold/unfold buttons, hidden-child search, continued typing after empty Enter,
inline editing of a prior daily page and full relaunch. Folding preserves the
hidden text and stored document. Existing prose and the current day's entry
remain intact while a past day is edited. New compact cover controls measure
32px and become fully visible while keyboard focused. The licence/source modal
actually opens and shows the distributed AGPL licence. Find a memory icon and
label now align on one row. The extra screenshots cover desktop, narrow outline
and prior-day editing. Fresh renderer errors remain empty.

| Rubric | Score | Justification |
| --- | ---: | --- |
| Feature completeness (20%) | 9.4 | Full requested scope plus new outline/past-day/compact-cover work is integrated and preserved across restart. |
| Functionality/correctness (25%) | 9.3 | 114 tests, full real-Electron matrix and new draft/continuation/folding regressions pass. |
| Design quality (25%) | 9.1 | Inspector placement fixes the primary visual discontinuity; clean date-page outlines and compact covers fit the design system. |
| Code quality/structure (15%) | 9.2 | Additive migrations, typed documents, protected credentials, synchronous draft recovery and recorded source/licence provenance. |
| UX/accessibility/responsiveness (15%) | 9.2 | Required controls are discoverable, drafts survive navigation, outlined blocks support keyboard/folding, and visual matrix fits. |

**Weighted score: 9.24/10.** The requested stopping threshold is met. There are
no additional required implementation changes from this review. Exact package
smoke and installed-owner-data acceptance are subsequent release gates. Actual
GitHub uploads and Windows credential sign-in remain outside this review's
fixture-based network evidence; do not claim those were exercised by the reviewer.

Future optional polish: sticky compact Journal toolbar/status for long entries;
a route-level topic drawer on very narrow screens if the library grows further;
clearer per-day Plan dirty/saved indication without changing draft preservation.

## Exact Windows package acceptance — October 3, 2026

The independent reviewer launched the actual `release/desktop/win-unpacked/Habit
Tracker.exe` twice against isolated data. All **5/5** packaged checks passed in
`.review/study-package-1791053815593/result.json`, with desktop Study, Journal,
Backups and 390px Journal screenshots visually inspected. The packaged UI matches
the accepted source design and the narrow Journal fits without horizontal overflow.

- Frozen stage `1791053541014` matches all 27 current `dist`/`dist-electron` files
  by SHA-256; stage version is 1.5.0. The ASAR contains `LICENSE.md` and
  `THIRD-PARTY-NOTICES.txt`, and the actual packaged licence modal opens.
- All 1,823 supplied topics import; repeated import is idempotent. Curriculum
  navigation stays bounded and Home Start focus/Pause work in the actual package.
- Real Enter/Tab input creates a nested journal child. Fold/save and full process
  relaunch retain the hidden child and folded state; unfolding reveals it.
- Local snapshot/preview shows the full imported workspace. No HTTP resources or
  renderer errors were observed. No reviewer owner-database writes or GitHub
  uploads occurred.
- A second full packaged launch retains all 1,823 topics and current study focus.

Package ASAR SHA-256:
`6160c2d2198d145bbeb906d5530bf2f6a1b8efdbc2bba725105b83cc181cd9a9`.
Executable SHA-256:
`0e5b405379235cd2da5359af9266de343e98be655eba77faac3bb25edaa41dfe`.
Completed NSIS installer SHA-256, independently read from disk:
`8b4342ff5b65bebfa20ef572c2c325fd4978b963425f073a2be351d54af2dac4`.

The package gate passes. The builder's subsequent installed-owner-data acceptance
remains a distinct release gate; this isolated package review does not claim the
owner upgrade or a real remote backup was exercised.
