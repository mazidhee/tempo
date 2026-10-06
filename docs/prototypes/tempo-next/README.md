# Tempo design options — owner selection

This standalone browser prototype presents **five choices for every one of 15
screens: 75 layouts**. It is a decision artifact for the October 6, 2026 design
round. It does not implement these layouts in the Electron app.

The owner must review the five choices for every screen and explicitly approve
their selection before app implementation. Browsing a layout does not approve it;
the studio's **Choose this layout** button records a local preference for discussion.
No app-wide composition or new visual world has been approved.

The owner-directed selection round explicitly overrides the usual concept roll:
no random roll or seed was used. No catalog QUALITY BAR card was supplied. The
requested Design and UX target is **9.9/10 each**, not a score certified by this
README, the width checks, or a catalog ceiling. The fresh independent reviewer
returned **ship for owner selection**, with all five requested material fixes
resolved, as recorded in `docs/design-round-two-review.md`. That verdict applies
to this decision tool; no detector ran for this artifact.

## Run and choose

From the repository root, with Node.js available:

```powershell
node scripts/tempo-prototype-server.cjs
```

Open [the local studio](http://127.0.0.1:5220/). If that address is already serving
the studio, use the existing server. Stop a server started in the terminal with
Ctrl+C. The checked local Inter font exists at
`node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2`;
this prototype does not fetch fonts from the internet.

1. Open a screen using the sidebar. At phone widths, use **Toggle navigation**.
2. Compare its **A–E** layout buttons; the name and explanation change above the
   mock app. The strip scrolls when the five buttons do not fit.
3. Use **Choose this layout** for the preference you want to discuss. Repeating
   this on the same screen replaces that screen's choice.
4. Open **My choices** to see all 15 screens, including those not chosen.
5. Use **Copy choices**, then paste the list into the chat. If clipboard access
   fails, the dialog displays the text for manual copying.

Choices are local to this browser profile and origin. They are not sent to the
app or a remote service. Keep the same `http://127.0.0.1:5220` address when returning;
another port, hostname, browser profile, or cleared browser storage has its own
choices. The counter counts chosen screens, with a maximum of 15.

## The 75 layouts

Names below match `studio.js`; A–E map to its option indices 0–4. Each screen has
five structural presentations, sharing the same prototype shell and fictional
fixtures. They are alternatives to compare, not five separately shipped features.

| Screen | A | B | C | D | E |
| --- | --- | --- | --- | --- | --- |
| Tasks | Workflow | Schedule | Focus board | Project lanes | Compact board |
| Plan | Agenda | Time blocks | Day sheet | Now / Later | Focus queue |
| Habits | Direct list | Day rail | Week strip | Tracking table | Two-column list |
| History | Trend first | Comparison | Calendar + trend | Habit explorer | Monthly report |
| Recovery | Dated list | Review rail | Compact table | Habit workspace | Side-by-side days |
| Work | Project navigator | Project library | Milestone board | Project timeline | Project table |
| Focus | Timer + queue | Quiet centre | Task navigator | Digital desk | Session sheet |
| Search | Top field | Search + preview | Scoped search | Quick switcher | Search workspace |
| Home | Reading page | Today desk | Open greeting | Quiet margin | Day overview |
| Study | Curriculum library | Topic navigator | Learning boards | Open curriculum | Study directory |
| Statistics | Trend report | Compare periods | Activity calendar | Area explorer | Time ledger |
| Goals | Progress list | Goal navigator | Goal board | Open goal | Goal table |
| Journal | Open canvas | Date navigator | Reading measure | Outline + page | Wide journal |
| Review | Weekly report | Chart + reflection | Week explorer | Open review | Trend comparison |
| Settings | Settings navigator | Open preferences | Preference sections | Focused settings | Settings directory |

## Overview

The built preview uses solid graphite and paper surfaces, one teal accent, Inter
for the working interface, Tempo's waveform, flat habit check-ins, separate History
and Recovery destinations, task boards, and scheduled tasks in Plan. Studio
controls sit above the app shell. Journal and Review stay separate from Plan.

These observations describe the prototype only. `PRODUCT.md` remains product
truth and root `DESIGN.md` remains the incumbent visual authority. This README
does not promote any of the five compositions to the app design system.

## Colors

The following custom properties are extracted from `studio.css`. Graphite is the
initial appearance unless a saved Paper preference exists. The **Light / Dark**
studio control changes the appearance; both retain a teal accent.

| CSS token | Graphite | Paper | Built role |
| --- | --- | --- | --- |
| `--bg` | `#171b1d` | `#fafbfb` | Page canvas |
| `--surface` | `#1e2427` | `#fff` | Cards and panels |
| `--raised` | `#262e32` | `#f0f3f4` | Hover and active navigation surfaces |
| `--ink` | `#edf1f2` | `#202b30` | Primary text |
| `--muted` | `#a9b5bb` | `#596a73` | Supporting text |
| `--line` | `#354146` | `#d7dfe3` | Dividers and borders |
| `--accent` | `#82ccce` | `#276e74` | Actions, selected controls, charts and focus |
| `--on-accent` | `#10272a` | `#fff` | Text on filled accent controls |
| `--alert` | `#efb6a8` | `#914832` | Urgency and selected status cues |
| `--sidebar` | `#14181a` | `#f0f3f4` | Navigation and studio chrome |
| `--field` | `#1d2326` | `#fff` | Input surface |
| `--selected` | `#27393c` | `#e1eff0` | Selected layouts, chips and time blocks |

## Typography

Inter is loaded locally as a variable font (weights 100–900), with Segoe UI and
sans-serif fallbacks. The working body is 14px/1.5. Page headings are 32px at
weight 650 with a 1.2 line height and −0.025em tracking, reducing to 29px below
520px. Section headings are 19px/600; small labels are commonly 12px, chart axes
11px. Row titles vary with content, including 17px habit names and 18px table
habit names. Journal writing is 18px/1.9, reducing to 17px on phones.

Timers deliberately use tabular numerals and a larger 100px/400 display, with
82px and 74px responsive sizes. Home thought specimens use Georgia serif at
24–37px depending on composition; this is a prototype-specific treatment, not a
new global display-font rule. The Open greeting specimen uses a 58px headline.

## Layout

The desktop sidebar is 188px; the app top bar is 72px, with a bounded 350×38px
search field. The working page has 28px 40px 65px padding and a 1540px maximum
width. Selected habit, Plan and Recovery layouts use a 950px maximum; Home and
Journal wrappers use 1120px. Journal C centres a 720px writing measure.

Boards use four `minmax(210px, 1fr)` columns with 22px gaps. The Focus board
widens Doing; project lanes repeat a board by area. Compact board cards reduce
padding and borders. Split pages normally pair a flexible canvas with a 310px
rail and a 48px gap; reverse layouts place a 260px rail first.

At 1100px the sidebar and page spacing contract. At 800px navigation becomes a
64px icon rail, split layouts stack, the week strip beside habits hides, and
boards retain their own horizontal scrolling. At 520px the sidebar hides behind
a toggle, page padding becomes 23px 20px 40px, habit columns stack, and reflections
stack. Some project-table metadata columns hide at narrow widths. Document
overflow checks do not certify that every internal scrolling area is convenient.

Charts place their numeric and date labels in HTML beside/below a scalable SVG
plot. Plot height is 180px; axis text stays 11px and strokes do not scale. Captions
state Events, Focus · minutes, or Progress · % according to the screen. All values,
comparison lines, calendars and totals are illustrative fixtures.

## Elevation & Depth

The stylesheet uses surface tones and borders rather than box shadows or
gradients. The choices dialog has a translucent black backdrop (`#0008`). Hover,
selection, drag-over and checked states change surface, border or accent treatment.
Search border motion is 150ms and toast opacity is 160ms; the habit-check sparkle
is 480ms. Reduced-motion preferences remove animation and transitions.

## Shapes

Common buttons and fields have 7px corners, the search field 8px, task cards 9px,
panels 10px and the dialog 12px. Check controls are 23×23px with 5px corners.
Week dots and profile markers are circular. These are extracted measurements,
not an approved radius scale for the application.

## Components

- **Navigation and search:** named links expose the active page; the mobile toggle
  has an accessible label. Top search remains visible outside Search, where the
  dedicated workspace field replaces it. Ctrl/Cmd+K opens Search and focuses its
  field. Escape clears the query; arrows and Enter provide a preview selection path.
- **Actions and fields:** new-item controls use unboxed accent text with inline
  SVG icons. Primary controls use accent fill and on-accent text. Focus-visible
  uses a 2px accent outline with a 3px offset; the search container has its own
  focus-within border/outline. Inputs have explicit labels or accessible names.
- **Tasks and Plan:** task titles open an inspector with status, date, time and
  urgency. Saving updates the in-memory task; scheduled tasks appear in the
  fixed October 6 Plan fixtures. Cards drag between columns; inspector controls
  also offer status changes without dragging. Urgency is distinct from status.
- **Habits and Recovery:** visible habit names have direct check controls with
  `aria-pressed`; fictional streaks update when checked. Recovery exposes dated
  actions and a covered state in a separate destination. History opens separately.
- **Work and Focus:** projects open milestones and linked task specimens;
  milestones can be checked and added. The demo timer counts down Pomodoro or
  counts up Time tracking and supports Start, Pause and Stop.
- **Writing and choices:** Journal is an editable page with Heading, Bold and List
  controls. Review has two reflection fields or an editable report specimen. The
  choices dialog lists every screen and copies the selected layout names.

## Do's and Don'ts

- **Do** compare all five options on every screen before approving implementation.
- **Do** retain essential names, scheduled times, units and labelled actions while
  judging density. Habit check-ins must remain directly available.
- **Do** distinguish remembered browsing layouts from explicitly chosen layouts.
- **Don't** treat fixtures or mocked save messages as owner records or persistence.
- **Don't** infer release readiness or a 9.9 score from this decision artifact.
- **Don't** re-import the owner's Rehab CSV: the owner already imported it themselves.

## Storage, reset and limitations

The server binds only to `127.0.0.1:5220`. Its GET allowlist serves this HTML, CSS,
JavaScript and local Inter font; other paths and methods return 404. It does not
serve app source, briefs, SQLite files or owner documents. Prototype code does not
access the owner database. This options work does not change app source or owner
data. Existing application features still require preservation during the later
approved implementation.

Three browser-storage keys persist: `tempo-next-layouts` remembers the last
viewed layout for each screen, `tempo-next-choices` stores explicit choices, and
`tempo-next-light` stores appearance. All task, habit, project, milestone, recovery
and timer mutations are temporary browser memory. Journal and Review edits are
temporary DOM content and can disappear on navigation, a layout change or reload;
save messages do not write them to a database or browser storage.

**Reset demo** restores initial tasks, pauses the timer, sets its seconds to 1500,
and clears covered recovery days. It keeps choices, browsing preferences and theme.
It does not reset added/archived habits, projects, milestones, timer mode, or all
screen state. Reload starts the fictional data afresh while retaining the three
storage keys. To start selection afresh, clear those three keys for this local
origin using browser developer tools; this clears prototype choices only.

Other preview limits matter when comparing behavior:

- The date is fixed to October 6, 2026; date rails and period controls may change
  only a label. Plan D/E have a fixed lead-task specimen rather than a complete
  dynamic current-task engine.
- Search uses five static result fixtures, not all newly created demo records.
  Its arrow-key selection uses that full fixture list even when a query filters
  visible results. The Urgent task control uses a sample query rather than a
  general urgency predicate. These behaviors are not production contracts.
- History filters, many settings, imports, backups, cover/photo actions, archive
  access, and some creation commands are specimens or explanatory toasts. Accent
  choices other than teal are displayed but not applied. Project milestones and
  goal details reuse fixtures rather than complete relationship/persistence logic.
- Focus links demonstrate navigation; the timer is a browser interval, without
  Electron background timing, tray controls, Focus Guard or durable session logs.
- Full keyboard drag parity, screen-reader behavior, validation/error states,
  every theme/width combination, and release migrations have not been certified
  by the saved evidence. Journal formatting uses browser `execCommand`.

## Evidence and documentation boundary

The saved evidence is `.review/tempo-options-1791303384878/results.json` with
per-screen `*-options.png` contact sheets and individual desktop/phone images.
It records **225 width checks**: all 75 layouts at **1440, 800 and 390px**. Each
record has one primary heading and a document width no greater than its viewport;
the recorded error list is empty. These checks establish coverage and lack of
document overflow in that run, not an aesthetic score or a full accessibility audit.

The ten recorded interaction checks are:

1. Task inspector scheduling is reflected in Plan.
2. Time-block Plan includes initial and newly scheduled task times.
3. Flat habits check directly, without section expansion.
4. Tracking-table Habits retains every direct check-in.
5. Recovery is a distinct destination with direct actions.
6. Defined top search field filters results.
7. Narrow chart retains visible units and unscaled axis labels.
8. Kanban card drag updates the column.
9. Journal writes directly in the normal page.
10. Screen choice survives preview reload.

This documentation pass checked `index.html`, `studio.css`, `studio.js`, the
allowlisted server, `PRODUCT.md`, root `DESIGN.md`, `docs/design-round-two.md`,
`docs/design-round-two-review.md`, the recorded results, and the Tasks/Habits
contact sheets. It documents the
existing evidence rather than claiming a second interaction run. The fresh
independent review records readiness for owner selection only.

Root `DESIGN.md` is preserved. Its Linear reference and later owner refinements
remain incumbent context; this teal options palette and alternative compositions
are not canonized there. The pre-existing `.impeccable/design.json` sidecar is
missing. That documentation drift is reported, not repaired, because the owner
has not approved a new app world and this pass may write only this README.
No detector result, catalog score, raster provenance certificate, installed
all-record acceptance or new production release is asserted by this document.
