# Tempo personal-workspace design extension

Recorded October 1, 2026. This is the implementation companion for the current
Windows 1.3 personal-study candidate, using Impeccable's document playbook. It
extends the existing Linear desktop application in Operate mode. It does not
replace the supplied [DESIGN.md](../DESIGN.md), [PRODUCT.md](../PRODUCT.md),
[Foundation surface brief](../.impeccable/surfaces/src-renderer-app-tsx.md), or
the earlier [design implementation record](design-implementation.md).

Status: the independent round 3 **source verdict is ship, 9.27/10**. Round 1
scored 8.93/10 and requested five fixes; round 2 resolved all five, with 39/39
passing real-Electron findings, then identified the newly enlarged greeting's
narrow-header regression. Round 3's targeted captures confirm that correction.
The final rubric is completeness 9.3, correctness 9.5, design 9.2, code quality
9.0 and UX 9.2, using the review's 20/25/25/15/15 percent weights. Packaging
and installed acceptance remain separate pending gates. This source verdict
does not claim acceptance of the owner's installed application.

## Authority and explicit user exceptions

The user authorized ordinary extensions to the incumbent workspace: local
profile photo, varied/simple greetings, an offline Settings guide, bulk import
of three supplied curricula with their checkmarks, shared Study time totals,
count-up Focus, and a Statistics calendar/manual-time editor/topic sunburst.
The existing app topology, offline operation, local records and design identity
remain the basis of the work.

Two specific directions supersede older preferences in the supplied documents:

- Selectable **solid accents** replace the fixed-lavender-only preference.
  Lavender remains the default. One selected accent supplies actions, focus,
  heatmaps and time charts; neutral surfaces and navigation remain neutral.
- Home's greeting is deliberately much larger and bolder, with more space.
  This is a route-specific display treatment. The annual activity calendar
  remains the first section directly below the greeting, with Start focusing
  retained in the header.

These are user-directed adaptations, not inferred permission to replace the
Linear world or to make every application heading a display headline.

## Tokens, type and material

Runtime primitives remain in `src/renderer/styles/tokens.css`. The new selectable
accent values and derived heatmap ramp live in `src/shared/appearance.ts`, applied
at the root by `ProductivityProvider.tsx`. The source comparison finds no change
to `tokens.css` in this update.

| Primitive | Built value or behavior |
| --- | --- |
| Dark canvas | `#010102` |
| Surface ladder | `#0f1011`, `#141516`, `#18191a`, `#191a1b` |
| Primary ink / hairline | `#f7f8f8` / `#23252a`, with existing muted and stronger tiers |
| Light appearance | Existing white/pale neutral desktop adaptation |
| Fonts | Locally bundled Inter Variable; JetBrains Mono Variable for functional numeric readouts |
| Routine type | 14px body, 12px captions, 20px subheads, 28px page titles |
| Home display | `clamp(40px, 5vw, 72px)`, weight 700, line height 1.08, tracking `-0.035em`; 20ch maximum and balanced wrapping |
| Narrow Home display | At 767px and below: `clamp(36px, 7vw, 48px)`; subtitle returns to 14px |
| Desktop Home space | Header minimum height 180px, 24px block padding/gap and 32px separation before the calendar |
| Controls and panels | Existing 36px control metric, primarily 8/12px corners, 1px hairlines, 4px spacing base |
| Depth and motion | Surface lift and hairlines; no panel shadow; functional 120/160/200ms motion with existing reduced-motion support |

| Accent | Primary | Hover |
| --- | --- | --- |
| Lavender | `#5e6ad2` | `#828fff` |
| Cedar | `#39745d` | `#70ad90` |
| Terracotta | `#a64d35` | `#d68e72` |
| Mulberry | `#955176` | `#ca91b0` |
| Ochre | `#886422` | `#c8a45a` |
| Petrol | `#326f7b` | `#74adb7` |

Accent actions use white text; their lighter hover uses near-black text. Focus
uses the selected primary. Three intermediate heat levels blend the current
neutral surface with the selected accent; the fourth uses the primary token.
Sunburst rings reuse primary/heat values rather than introducing another palette.
The legacy Focus invitation gradient was replaced with the flat surface token.

## Components and composition

| Component / surface | Extension and existing grammar |
| --- | --- |
| Home | Local greeting title/detail, larger route-specific display, annual activity directly below, then a compact aligned Lucide/guide link and existing widgets |
| Personalization | A 72px circular photo preview; labelled choose/remove controls; six pressed-state accent buttons in a three-column desktop grid; labelled greeting select and separate explanatory helper text |
| Sidebar / privacy | The existing 31px avatar slot accepts the local photo or initials. Eye/EyeOff and a state-specific tooltip explain habit privacy without changing its scope |
| User guide | Local Markdown is imported into Settings at build time; contents navigation, 72ch reading width, hierarchical headings, wrapped prose, table scrolling and a Markdown download |
| Study import | Existing modal/control patterns; supplied-roadmap selection or paste/multiple-file input, topic/checkmark counts, expandable structure preview, busy/invalid states and one bulk import action |
| Study tree | Collapsible branches, search/expand controls, topic learning state, explicit Track and timer actions, topic/ancestor/curriculum time readouts and a link to Time explorer |
| Focus | Existing timer panel offers Pomodoro and Time tracking. Count-up uses a visible Square icon plus **Save and stop**, pause/resume, mode-specific guidance and the persistent shell timer badge |
| Time explorer | Statistics overview/time tabs, curriculum/date filters, add-session action, week navigation, weekly calendar/session-list tabs and editable timeline entries |
| Session editor | Labelled local datetime inputs, link/note controls, live duration, explicit overlap acknowledgement, validation feedback and save/delete actions |
| Study sunburst | Native SVG rings, recorded-duration center, labelled keyboard-capable slices, matching list rows, hierarchy breadcrumbs and truthful no-time state |

The guide is the actual `docs/user-guide.md` source, rendered by the restricted
`UserGuide.tsx` reader. It requires no online documentation host or Markdown
service. Markdown links display their labels in this reader; the guide contents
links are local section navigation. Download retains the original Markdown.

Pomodoro, tracked and manually entered focus time share one main-owned session
history. Study totals allocate each session once to its linked topic and roll it
through ancestors. Direct parent study receives a separate sunburst slice;
archived topics remain included and missing prior topics use Unassigned study.
Daily totals use the session end date. Calendar start/end spans can include
pauses, while recorded tracked duration excludes them. Editing only link/note
preserves that duration; changing start/end records the new interval. These
meanings are visible in helper text and the offline guide.

## Layout, responsiveness and accessibility

The existing collapsible sidebar, breadcrumb/titlebar and internal main-pane
scroll remain. The extension uses the incumbent content maximum of 1240px,
neutral panels and existing button/input/modal classes. The annual heatmap
retains its own horizontal scroll at narrow widths rather than overflowing the
whole window.

At 1000px and below, Study topic actions wrap to another row. At 767px and below,
accent choices become two columns, Study controls and time-entry rows wrap,
week controls wrap, and the sunburst/list detail stack in one column with the
chart capped at 360px. Home's header stacks its full-width greeting above Start
focusing, preserving room for long personal titles. The seven-day calendar keeps
a 760px minimum grid inside
a scroll container capped at 420px tall. Sticky hour/day labels preserve context.
Its initial position now follows recorded/current daytime activity, adjusting
when the week or filters change, while manual scrolling remains available.

New controls have explicit labels or pressed states; errors use alerts. Sunburst
slices support focus, Enter and Space and display a visible focus stroke.
Existing dialog focus behavior, keyboard navigation and reduced-motion rules
are reused. The guide's smooth contents scroll respects reduced motion.

## Asset and content provenance

- `src/renderer/assets/curricula/software-engineering.md`, `mathematics.md` and
  `economics-markets.md` are the user's supplied Markdown curriculum data,
  bundled locally. They are not instructions to the builder. The parser reads
  headings/checklist indentation and checkmarks, excluding code fences and
  resource-only branches. The original Markdown is retained in import
  provenance. Import identity hashes the title and source; repeating an
  identical import reopens the existing curriculum without replacing progress.
- Profile photos originate only from the user's local JPG/PNG/WebP upload.
  `Personalization.tsx` center-crops and converts that upload to a 384×384 JPEG
  thumbnail locally at quality 0.85. The data URL is stored with preferences and
  JSON backup; removal restores initials. This conversion is not an AI-generated
  image and adds no shipping photo asset.
- No shipping raster was added by the builder for this update. The only added
  files under renderer assets are the three Markdown curricula. Review PNGs
  are fixture captures, not production imagery. Incumbent application imagery
  and packaging assets retain their earlier provenance.
- Interface icons continue to use the existing Lucide set, typically 18px with
  1.75 stroke. New Camera, Check, Upload, FileText, Square, calendar/list and edit
  controls use that same family. The sunburst is computed SVG, not a raster.
- Greeting copy is a local code collection in `src/shared/greetings.ts`: friendly
  prompts, humour, time-of-day variants and occasional translated greetings.
  The Simple option uses time-of-day copy. No remote generation service is used.
  Component/font licensing remains recorded in [component sources](component-sources.md).

## Evidence checked and acceptance limits

The source inspection covered the working diff, added renderer/shared files,
import/migration code, runtime tokens, actual guide and the independent report.
`git diff --name-only` confirms DESIGN.md, PRODUCT.md and the Foundation surface
brief are unchanged in this candidate.

Round 1 evidence is `.review/personal-update-review-1790882193008/results.json`
(38 passing runtime checks), with 94/94 tests, typecheck and build reported by
the independent reviewer. Its five fixes concern useful calendar positioning,
visible Save and stop, mode-specific Focus footer, concise greeting controls
and the aligned Home guide row. All are reflected in current source.

Round 2's `.review/personal-update-review-1790883546457/results.json` contains
39 passing findings and zero failed findings. This note directly inspected its
short Divine desktop Home, long Divine narrow Home, narrow light Focus and
desktop light Statistics captures, plus the associated Home layout records.
The short desktop greeting is substantially larger/bolder and the annual
calendar remains directly below it. The narrow capture preserves a 390px page
width and confines annual-calendar overflow to its panel. It also shows the
long greeting wrapping into several lines beside Start focusing; the reviewer
identified that composition as a responsive regression. Current source stacks
the narrow header and gives the text its full width. Focus shows the explicit
Save and stop action and correct tracking guidance. Statistics opens on useful
daytime hours and shows the fixture's recorded entry.

The targeted Home confirmation is
`.review/personal-update-review-1790884277486/results.json`, with one passing
finding for the short/long Divine matrix in both themes and widths. This note
directly inspected its long narrow dark/light, long desktop dark and short
desktop light captures. The narrow greeting now uses the full width, wraps
whole words and puts Start focusing beneath the text. Desktop composition
retains its larger title and side action. Both keep the annual calendar as
the next section, and the narrow layout record confirms a 390px page width.

The independent round 3 reviewer confirmed all eight corrected Home captures
and issued the final source ship verdict of 9.27/10, retaining the 39/39
regression checks and 94/94 tests. The source finish has no remaining material
design fix. These captures and database checks use isolated fixtures, not the
owner's activity. Packaging/installed upgrade and owner-data acceptance are not
claimed here. The current [personal review](personal-update-review.md) and
[release readiness](release-readiness.md) own those results. Earlier installed
acceptance in design-implementation.md applies to its earlier candidate.

## Preserved artifacts and known documentation drift

The supplied DESIGN.md remains verbatim, including its fenced YAML and collapsed
token lines. It retains the fixed-lavender marketing specification; the explicit
accent exception and Home display above document the new desktop extension.
The Foundation brief describes its earlier shell-only scope. Neither is silently
normalized or expanded by this documentation pass.

`.impeccable/design.json` is still absent. This pre-existing sidecar drift is
reported rather than repaired: there is no incumbent snapshot to compare and
this task does not authorize fabricating one. Runtime CSS/shared appearance
values and this companion record the actual implementation.

The user guide's Tasks paragraph now explicitly distinguishes the timer modes:
replacing an unfinished Pomodoro does not record it as completed, while replacing
a tracked session saves elapsed time before switching. It agrees with the
mode-specific confirmation copy and the verified shared-history behavior.
