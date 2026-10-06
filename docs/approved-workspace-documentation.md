# Tempo 1.8 approved workspace — implemented design record

Recorded 6 October 2026 after the bounded corrections and the separate Work/Focus
finish review. This document records the approved extensions to Tempo's existing
visual world. `PRODUCT.md` remains product truth; root `DESIGN.md` remains visual
authority; `docs/approved-workspace-design.md` records the owner's selections.
Neither root `DESIGN.md` nor `.impeccable/design.json` is replaced by this record.

## Overview

The confirmed direction is a quiet local workspace where the next action is
clear. A task moves from its compact board into the scheduled daily queue and a
real focus session; progress comes from stored records. The interface operates as
desktop software, with useful content in the first viewport and short functional
labels. The approved work extends the incumbent Linear-derived identity through
flat lists, restrained separation, readable tables and open writing canvases.

The owner selected thirteen compositions in the 75-option studio and subsequently
selected **Focus controls B — Bottom dock** in the five-option Focus preview at
`http://127.0.0.1:5221/`. The latter changes the control arrangement within Focus A
timer and queue. The preview files live in `docs/prototypes/tempo-next/focus-controls.*`.
The option round is an explicit owner-directed exception to the random concept
round; no catalog QUALITY BAR or generated comp established a measured ceiling.

Home, installed sidebar order, its top Search entry, the waveform logo and
detailed Statistics remain protected. History and Recovery stay inside Habits.
Study retains learned/total counts, recorded time, progress bars and the current
topic beneath each curriculum. The owner already imported their habit history;
this work does not authorize a CSV reimport or a database restore.

## Colors

The implementation inherits solid surfaces and the selected solid accent through
the shared appearance preferences. It does not adopt the preview's teal as a new
global accent. Default primitives are defined in
`src/renderer/styles/tokens.css`; palette and accent overrides are defined in
`src/shared/appearance.ts` and applied by `ProductivityProvider.tsx`.

| Role | Implemented use |
| --- | --- |
| Primary accent | Primary actions, keyboard focus, progress and small action emphasis. The default lavender remains available alongside Cedar, Terracotta, Mulberry, Ochre and Petrol. |
| Canvas and surfaces | Solid dark/light grounds, subtle hover and selection layers. Tempo, Graphite, Slate, Dusk and Forest remain independent of accent selection. |
| Ink hierarchy | Main content, secondary metadata and quiet labels use the existing ink roles. |
| Hairlines | Row divisions, table rules, the Focus footer and dialog boundaries. |
| Semantic states | Existing warning/danger/success roles communicate actual status rather than decorative color. |

The inspected review captures use Graphite in both themes with the inherited
lavender action. The dark ground is warm charcoal; the light ground is warm paper.
These existing preference variants are compatible with the October 3 extension
in `DESIGN.md`; its older marketing-black example does not require replacing them.

**The Stored Preference Rule.** Use the existing appearance roles and saved
preferences for all selected compositions; do not hard-code a preview palette.

## Typography

Local Inter Variable with Segoe UI/sans-serif fallback carries the interface;
local JetBrains Mono Variable with Consolas/monospace fallback remains available
for measurements and code. Global imports bundle the fonts for offline use.

| Role | Observed treatment |
| --- | --- |
| Page heading | Selected route headings commonly use 36px. Work explicitly uses the incumbent sans family, weight 600 and line height 1.25. Shared workspace headings use weight 650, line height 1.2 and tracking −0.025em. |
| Section and row titles | Sections use compact 14–16px titles; Study curriculum titles use 22px at weight 550; task/project rows retain clear title and metadata separation. |
| Working text | The incumbent body token is 14px; metadata commonly uses 11–13px. |
| Timer | Tabular numerals, weight 450, tracking −0.03em and responsive size `clamp(64px, 8vw, 96px)`. |
| Journal | Normal writing canvas uses 18px text and line height 1.9; writing is comfortable before entering Writing mode. |

These are observed source roles, not a new global type scale. Work's corrected
heading preserves the same family as the other working pages.

## Layout

The native shell, breadcrumbs, window controls and sidebar remain the orientation
frame. The selected layouts are route-scoped in `approved-workspace.css`.
Content widths vary with the task: Tasks up to 1360px, Focus 1200px, Work 1120px,
Habits/History 1100px and Plan 1000px. Common working gaps use the inherited
4px-based rhythm, with 16/24/32px separation and larger breathing room where the
timer or writing canvas needs it.

The board uses four lanes, switches to two below an 850px content container and
one below 420px. Focus gives the timer and queue a 1.35:1 desktop ratio with a
48px gap; below a 700px content container, the queue stacks beneath and receives
a top hairline. This explains the 900/600 review captures without reducing the
timer or hiding queue content. Work preserves its five data columns while
allowing toolbar/project-title wrapping.

At narrow windows, Plan rows wrap while the canonical time field retains a
nonshrinking 136px width so AM/PM stays visible. Settings navigation wraps at an
860px content-container limit, keeping all seven destinations close to the first
preference section. Study rows wrap and put progress on a full-width line. The
shared search dialog is bounded to `min(680px, calc(100vw - 40px))`.

## Elevation & Depth

Everyday content relies on solid tonal layers and hairlines. Work, Study,
Journal, Goals, Settings and Focus remove unnecessary outer panel framing within
their approved routes. Board cards use a quiet surface lift; hover uses the next
surface. The modal quick switcher retains an overlay shadow to distinguish the
temporary interaction from the underlying workspace. It is an observed exception
to the otherwise flat operational content.

Motion remains functional: the incumbent fast/normal/slow timing tokens are
120/160/200ms, with reduced-motion overrides in the global stylesheet. Static
review evidence does not independently certify motion or every assistive path.

## Shapes

Shared corners remain small and restrained: token primitives are 4/8/12/16px,
with component-layer aliases adapting those values to the existing control kit.
Search fields use gently rounded 8px corners, board cards use the existing 12px
radius, and the switcher uses the existing larger dialog radius. Open canvases
and table/list sections avoid added rounded containers. Focus phase selection
uses a modest 6px corner and its footer is defined by a hairline, not a pill shell.

## Components

| Approved surface | Implemented pattern and retained behavior |
| --- | --- |
| Tasks E — Compact board | Four workflow lanes, useful task metadata, completion, project/date/time, status selection and focus action. Keyboard lane movement complements dragging. Canonical Task records drive Plan. |
| Plan E — Focus queue | Lead task and scheduled queue; editing time or completing a task updates the canonical Task. More than three priorities remain available with autosave. Historical plan/reflection records remain. |
| Habits A — Direct list | All due periods visible together. Check-in, quantity, slip reason, notes, recovery and management remain available. |
| History B — Comparison | Two real period lines and a ledger; original timestamped events are distinct from daily completion logs. Zero recorded entries do not imply clean days. |
| Recovery A — Dated list | Date and actionable habit rows, within Habits, with a direct return link. |
| Work E — Project table | Project, milestone fraction, open tasks, next target and recorded focus time. Search, archived projects and new project remain visible; detail retains milestones and scoped task navigation. |
| Focus A + controls B | Task/link selector and readiness above the dominant timer. Stop/start/skip directly beneath it; saved duration buttons below. Pomodoro/Time tracking, phase selection and Edit presets occupy the compact bottom dock. Presets come from saved records rather than a fixed 25/50/15 list. Active-phase locking, preset management, Guard, emergency exit and session history remain. |
| Search D — Quick switcher | Top sidebar trigger, bounded results, selection and key hints. Ctrl/Cmd+K opens global search; record pickers share the dialog treatment. |
| Goals A — Progress list | Recorded progress, dates and activity first; editing, archive and calculation detail remain available. |
| Settings B — Open preferences | Flat sections and compact navigation retain existing controls; intermediate-width navigation wraps. |
| Study A — Curriculum library | Learned/total, recorded time, progress and continuation accompany each curriculum. A remaining parent/topic supplies continuation when leaf continuation is exhausted. `Learning path complete` requires a nonzero total with learned equal to total. Dedicated curriculum/topic workflows remain. |
| Journal A — Open canvas | Date, formatting and full writing area available immediately; local autosave and nested outline interactions remain. |
| Review A — Weekly report | Saved weekly totals, real daily line series and reflections. Future/unobserved focus values remain null; daily values provide an alternative to the chart. Update activity remains explicit. |

Reusable button variants remain in the incumbent component kit: solid primary,
outlined, secondary, ghost and link. Default controls use 36px height with an 8px
corner, primary hover/focus roles, and disabled opacity. Search fields provide a
visible focus-within border/outline. Shared dialogs preserve focus restoration.

**The Canonical Task Rule.** Board, Plan and Focus refer to the same stored Task
identity; composition changes must preserve its schedule and completion.

**The Truthful Progress Rule.** Show stored counts, time and continuation together;
a tidy layout never justifies inventing completion or removing those measures.

## Do's and Don'ts

- Keep the selected flat rows, compact board, open document canvases and real charts.
- Preserve the owner's chosen Focus bottom dock and the incumbent Work heading.
- Retain every existing action and record, including archived/historical material.
- Use responsive wrapping and keyboard alternatives while keeping controls readable.
- Keep Home, sidebar order/top search, waveform and detailed Statistics protected.
- Do not rerun the owner's completed CSV import or restore an older database.
- Do not promote prototype colors or fictional fixtures into production truth.
- Do not describe tests or source screenshots as installed owner-data acceptance.
- Do not claim the requested 9.9/10 was established.

## Evidence, comparison and release gate

The documentation pass inspected `PRODUCT.md`, incumbent `DESIGN.md`, the approved
direction contract, the original and bounded verdict in
`docs/approved-workspace-review.md`, the fresh two-surface report in
`docs/focus-dock-review.md`, route-scoped CSS, shared tokens/appearance/button/dialog
components and current App/Work/Focus/Study source. Four current canonical
screenshots were opened at readable scale: Focus dark 1440, Focus light 600, Work
light 900 and Study dark 1440. They agree with the current dock, Work family,
responsive reflow, shell and Study continuation. This is a documentation pass,
not another review or new score.

Canonical evidence contains 78 PNGs and six contact sheets under
`.impeccable/review/approved-workspace/` (thirteen surfaces × two themes × three
widths, height 960). The three original material findings are resolved: Plan time
readability, truthful Study continuation/completion and compact Settings navigation.
The bounded review estimates Design **9.5/10**, UX **9.5/10** for those corrections.
The fresh Work/Focus report estimates Work **9.5/9.5** and Focus **9.5/9.4** for
Design/UX, with disposition `ship` at its stated source/capture scope. These
judgments do not establish the requested **9.9/10**.

The latest exact-package result checked here is
`.review/approved-workspace-1791325794898/results.json`: **11/11 functional groups
passed**, including a second launch; `errors` is empty. Its 72 recorded width
measurements show no document/main horizontal overflow. Search has six visual
captures but no width measurement in that JSON. The review harness uses an
isolated fixture database. The restart group asserts Task schedules, habits,
imported timestamps and Journal; it does not independently certify every Work or
Focus setting. No application test or capture run was repeated by this documenter.

Package version is **1.8.0**. Source checkpoint `fe4521b` precedes the final
correction checkpoint tagged `tempo-1.8.0`. After this documentation pass, the
parent completed the separate installed gate against a fresh consistent baseline:
every original record and exact preference survived both launches; SQLite
integrity and offline rendering passed. All 66 imported events and 1,823 active
topic identities/progress remain. See `docs/approved-workspace-release.md` for
the local evidence paths and matching packaged/installed hashes.

Preexisting documentation drift: root `DESIGN.md` retains its historical fenced
YAML/marketing specimen and October 3 desktop extension rather than the current
document reference's frontmatter shape; `.impeccable/design.json` is absent. These
facts were observed and left unchanged within this authorized extension. They do
not justify changing global authority or generating a sidecar as a side effect.
