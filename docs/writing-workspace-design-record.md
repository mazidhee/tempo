---
name: Tempo writing workspace preview
description: Extracted visual rules for the isolated five-choice Markdown workspace.
colors:
  dark-bg: "#1b1c1e"
  dark-sidebar: "#222325"
  dark-surface: "#27282b"
  dark-text: "#e4e5e7"
  dark-muted: "#aaadb4"
  dark-border: "#35373b"
  dark-accent: "#8bbdc2"
  dark-selection: "#33525e"
  dark-active: "#303236"
  light-bg: "#fff"
  light-sidebar: "#f6f6f5"
  light-surface: "#eeefef"
  light-text: "#24272b"
  light-muted: "#626870"
  light-border: "#dedfdf"
  light-accent: "#316b74"
  light-selection: "#cbe0e4"
  light-active: "#e6e8e8"
typography:
  interface:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "13px"
  label:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "12px"
  body:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "16px"
    lineHeight: 1.85
  headline:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "28px"
    fontWeight: 620
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  section:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.4
  subsection:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "18px"
    lineHeight: 1.4
  source:
    fontFamily: "JetBrains, monospace"
    fontSize: "14px"
rounded:
  inline-code: "3px"
  control: "5px"
  field: "6px"
  dialog: "10px"
spacing:
  compact: "4px"
  small: "8px"
  medium: "12px"
  regular: "16px"
  roomy: "20px"
  large: "24px"
components:
  button-ghost:
    rounded: "{rounded.control}"
    padding: "7px 9px"
  button-choice-dark:
    backgroundColor: "{colors.dark-accent}"
    textColor: "{colors.dark-bg}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  button-choice-light:
    backgroundColor: "{colors.light-accent}"
    textColor: "{colors.light-bg}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  icon-button:
    rounded: "{rounded.control}"
    padding: "6px"
    width: "30px"
    height: "30px"
  tree-search:
    rounded: "{rounded.field}"
    padding: "7px 9px"
  tree-file-dark-active:
    backgroundColor: "{colors.dark-active}"
    textColor: "{colors.dark-accent}"
    rounded: "{rounded.control}"
  tree-file-light-active:
    backgroundColor: "{colors.light-active}"
    textColor: "{colors.light-accent}"
    rounded: "{rounded.control}"
---

# Design System: Tempo writing workspace preview

## Overview

**Creative North Star: "The document and its place"**

This is an extracted record of the isolated preview in
`docs/prototypes/writing-next`, dated October 9, 2026. It describes the built
surface rather than establishing a replacement production system. The direction
authority is `docs/writing-workspace-direction.md`: Operate, with Read inside a
document. A selected note opens directly into a Markdown editor, with hierarchy,
tabs and contextual references available around it.

The five arrangements give the user working choices before production changes.
They share compact software chrome, larger document text, neutral grounds, fine
separators and a restrained teal accent. CodeMirror 6 with its Markdown language
package supplies actual editing; Markdown-it supplies Read rendering with raw
HTML disabled. Fixture documents, graph links and Study totals are fictional.

**Key Characteristics:**

- Nested file navigation and compact document tabs.
- Editable canonical Markdown with live, source and read modes.
- Per-section remembered documents, tabs, expansion and position.
- Adjustable desktop panes and reachable narrow-window overlays.
- Explicit separation between this choice preview and installed Tempo.

Evidence inspected: `app.tsx`, `app.css`, `index.html`, the preview build/server
scripts, PRODUCT.md, root DESIGN.md, the direction contract and the initial
preview review. The refreshed A dark/light desktop, C desktop, A mobile tree,
A mobile outline and A user-size images were directly viewed for this record.
The review's follow-up reports ten valid refreshed captures: A–E desktop dark
and A desktop light at 1440×1000; A mobile dark/tree/outline at 390×844; A user
at 512×571. D records a remembered Study position, not a document-top view.

The initial review identified six material fixes. The latest implementation
contains per-section expansion and explorer scroll, per-document Read scroll,
bounded pointer/keyboard pane resizing, search focus containment/restoration and
background inertness, truthful save failure/retry feedback, and an active-document
Study label. The follow-up reports F1–F5 resolved. F6 remains unresolved: an actual
downloaded Markdown file has not been accepted against the canonical source.
Export source inspection is not downloaded-file acceptance. The disposition
remains **fix**, while presenting the layout choices with that limitation is
allowed. No release readiness, production migration acceptance or 9.9 score is
certified. The unavailable quality-board card provides no scoring authority.

## Colors

### Primary

The theme-specific teal accents in the frontmatter identify actionable controls,
selected files, links, the caret and focus. Selection has its own darker/lighter
fill, allowing text selection to remain distinct from active navigation.

### Neutral

The document uses the background ground; navigation and context use the sidebar
ground; hover, code and control surfaces use the surface ground. Active items
have a separate fill. Main and muted text, along with fine borders, carry the
remaining hierarchy. No secondary or tertiary accent is extracted.

**The Theme Pair Rule.** Each theme switches its whole ground/text/border/accent
set through the application theme attribute. Keep selected and focused states
legible in both sets.

The actual incumbent comparison is `src/renderer/styles/tokens.css`,
`src/renderer/styles/app.css`, `src/renderer/styles/approved-workspace.css`,
`src/shared/appearance.ts` and the theme application in
`src/renderer/hooks/ProductivityProvider.tsx`. The illustrative
`src/app/styles.css` path does not exist in this checkout. Production provides
semantic surface/text/accent roles, independent palette and accent preferences,
and Inter/JetBrains fonts. This preview follows that role and font lineage, but
its exact charcoal and teal values are preview-specific: they do not equal the
production default palette or the listed Petrol accent. Treat them as extracted
preview values rather than exact production-token inheritance.

Root DESIGN.md remains a Linear marketing-oriented record with dark canvas,
lavender and custom Linear type claims. That existing context drift is reported
without repair. `.impeccable/design.json` is absent in this checkout and remains
absent. Neither is replaced or generated by this bounded record.

## Typography

Inter is self-hosted from the installed variable-font package; the server serves
it as `/inter.woff2`. JetBrains Mono is likewise self-hosted as `/mono.woff2` and
registered under the preview's `JetBrains` family name. The production token
names use `Inter Variable` and `JetBrains Mono Variable`; the font lineage is
shared even though the CSS family identifiers differ.

The interface uses the compact interface and label roles in the frontmatter;
secondary labels often step down to 11px, with the footer at 10px. Live and Read
prose use the body role. Source lines use the source role; inline and fenced code
use proportional reductions of the prose size. Headings establish document
structure rather than a marketing display hierarchy. Third-level live headings
use weight 580, while Read headings retain their stylesheet/browser heading
weight; this is an observed mode difference, not a newly unified token.

The reference pane reads at 14px with line-height 1.8. Below 600px, prose becomes
15px and live heading sizes become 25/20/17px. Active-line Markdown markers stay
visible so the user can edit syntax; inactive supported syntax is decorated.

**The Two Densities Rule.** Keep the file/tab controls compact and the document
comfortably readable. The document is the largest sustained reading surface.

## Layout

The application fills `100dvh`. A preview-choice strip sits above the workspace.
The workspace is a flex row: application rail, optional explorer, flexible
document area and optional context panel. Tabs precede breadcrumbs/modes, the
editor fills the remaining height, and save/word-count status sits at the foot.
Pane and document containers use `min-height: 0` and dedicated scroll regions.

Default measures are a 56px rail, 256px explorer, 244px context panel and a
760px maximum document width. Desktop explorer/context settings clamp to
210–380px for pointer and keyboard changes. Study adds 30px to the explorer's
saved width. The resize handles span their pane edge and expose keyboard focus.

| Choice | Built arrangement |
| --- | --- |
| A — Vault desk | Rail, persistent tree, compact tabs, editor and outline. |
| B — Notebook | Labelled 160px application navigation, tree, wider document, optional context. |
| C — Reference desk | Baseline choice; 700px document measure with a separately selected reference pane. |
| D — Study desk | Curriculum tree, fictional progress summary, Study documents and outline; 64px rail and 820px document measure. |
| E — Writing room | Labelled 140px navigation, 800px document measure and initially collapsed file/context panes. |

The reference pane occupies 40% of the document region with a desktop minimum
width of 260px, reduced to 240px below 1250px. Below 850px it is hidden, while
context becomes a fixed-width overlay and the explorer narrows. Opening one
auxiliary panel on narrow screens closes the other. Below 600px the rail is
45px, the tree overlays from that rail edge, the context overlay fits the remaining
width, the choice strip wraps, and only the active document tab is shown.
Breakpoint behavior intentionally overrides desktop resize values in these
overlay layouts. The 512×571 user capture documents the compact writing state.

**The Return to Place Rule.** Notes, Study and Work each keep their own active
document, tabs, expansion and explorer scroll. Document positions include editor
caret, editor scroll and Read scroll. This is preview local-storage behavior,
not proof of production route/session recovery or database integration.

## Elevation & Depth

Resting desktop panes use tonal layering and fine one-pixel separators rather
than card shadows. Depth is reserved for search and mobile overlay panels. Search
uses a translucent black backdrop and a soft shadow (`0 18px 50px #0004`); mobile
context/tree overlays use directional diffuse shadows. Resize hover uses a
partially transparent accent on the narrow handle.

**The Pane Edge Rule.** Use separators to show editable workspace boundaries;
reserve shadows for content temporarily above that workspace.

No animation system is extracted. The reduced-motion rule disables smooth
scroll behavior. Focus styling uses a visible two-pixel accent outline with a
three-pixel offset; search fields also respond through their border.

## Shapes

The workspace's large panes are rectangular. Soft corners belong to compact
controls, fields and the search dialog, using the extracted radius roles.
Inline code has the smallest radius; fenced code uses the field radius. Tabs
share the control radius. This is a software-pane form language without physical
texture, ornamental bevels or rounded cards wrapping the whole editor.

## Components

### Buttons

Ghost controls inherit text and receive a themed surface on hover. Icon controls
use Lucide stroke SVGs and explicit accessible labels; general glyphs are not
substituted for icons. Pressed icon states pair the active ground with the accent.
The choice action uses accent/background inversion, with a local selection
confirmation. Choosing an option records a preview preference; it does not
approve or install production changes.

### Inputs / Fields

File search has a fine border, inset SVG icon and compact text. Search focus
changes the border to the accent. The global note switcher uses a larger search
input with matching results and folder context. The modal traps Tab at its
boundaries, makes the underlying choice/workspace inert, closes with Escape and
restores prior focus or a usable fallback.

### Navigation

The tree uses expandable folders, fine guide lines and indented child rows.
Active files pair fill and accent text. Tabs include selection, close and create
controls. Outline buttons move to headings in the live editor. The context pane
switches between Outline, Links and Graph; graph edges come from explicit wiki
links in fixture Markdown, not invented semantic associations.

### Markdown Document

The editing string is canonical in this preview. Live mode decorates supported
syntax away from the active line; Source exposes the Markdown and gutters; Read
uses Markdown-it. The editor retains undo state across document switches while
the running preview session exists. A reference document provides adjacent Read
content. This record does not extend those claims to attachments, external edits,
IME behavior, large documents or migration from production editor JSON.

### Save / Study Status

Successful local-storage writes produce Saved in preview. Failed writes produce
an alert and Retry save, retaining the unsaved editing state in memory and
suggesting export as a recovery route. Export is implemented through a Markdown
Blob/download link, but downloaded-file acceptance remains unverified. The Study
summary derives its Current label from the active document; totals remain
fictional demonstration values and are not owner progress.

## Do's and Don'ts

### Do:

- **Do** use these extracted tokens only for the isolated preview until a layout
  and production integration are approved.
- **Do** keep Markdown editable and keep navigation/context controls reachable
  when panels collapse.
- **Do** retain theme-specific focus, selection, text and surface pairings.
- **Do** distinguish fictional preview state from installed owner records.
- **Do** obtain and compare an actual downloaded Markdown file before claiming
  export acceptance.

### Don't:

- **Don't** turn the choice preview into a production migration or change installed
  Home, logo, Study counts/time, database or owner files through this record.
- **Don't** claim its palette values exactly reproduce production tokens.
- **Don't** overwrite root DESIGN.md or create the absent sidecar as a side effect.
- **Don't** claim release readiness or a numerical finish score from these captures.

**Not canonized or repaired:** the existing root marketing-context drift and
missing sidecar remain outside this preview's write boundary. Unverified export
acceptance remains a material limitation, not a design-system rule or an implied
pass. No craft-floor violation is promoted into this record as future house style.
