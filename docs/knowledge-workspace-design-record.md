# Knowledge workspace design record

October 8, 2026. Impeccable document handoff for an ordinary extension of Tempo.
This record describes the implemented Notes A, graph, sidebar ordering, floating
Focus E and interface-scale preference after the tag-entry correction. It does
not replace the root design system or establish Windows release acceptance.

## Overview

**The Incumbent System Rule.** Actual renderer tokens, appearance preferences and
existing controls govern this extension. Notes is an Operate surface with Read
behavior inside the editor. The approved references are
`.review/knowledge-options/revision-A-notes-light.png` and
`.review/knowledge-options/revision-A-writing-light.png`. Their folder-first
library, quiet actions and wide writing column carry into production; preview
chrome, fictional content, covers and other unimplemented details do not become
requirements through this record.

Home's source and composition and the original Tempo waveform are protected.
The existing sidebar remains the shell; ordering is a preference on its real
entries. Review is absent from primary navigation, with Saved reviews retained
in Settings. Statistics remains the metrics surface. PRODUCT.md continues to own
offline operation, preservation of records and release requirements.

Source evidence inspected: `styles/tokens.css`, `styles/global.css`,
`styles/app.css`, `styles/knowledge.css`, `styles/knowledge-graph.css` and
`styles/floating-timer.css` under `src/renderer`; Notes, NoteEditor, NoteFolders,
KnowledgeGraph, Sidebar, SidebarOrder, Settings and FloatingTimer; runtime
appearance tokens and ProductivityProvider; shared graph layout and widget
preferences; main-process widget, interface-scale and note-store code; and the
vendored Yoopta toolbar CSS. The direction, source audit, finish review and
release document were also read.

The approved reference images, the supplied desktop dark writing capture and
floating E light capture were opened to ground the description. The independent
review's existing 18-capture matrix covers desktop/light/dark/390px, graph, the
owner's 1440px width and 90% scale. Its capture-validity conclusion belongs to
that review. This document did not repeat the viewport review or launch a new
QA pass.

**Existing context drift, preserved:** DESIGN.md describes the imported Linear
marketing system, including unavailable Linear font families and dark-only
guidance, while Tempo implements Inter and selectable light/dark palettes.
Some typography frontmatter lines contain multiple fields on one line. A
`.impeccable/design.json` sidecar is absent at this handoff. Neither artifact was
created, regenerated or repaired. This scoped record records current extension
facts without changing that preexisting authority mismatch.

## Colors

The table records the default renderer palette, not a new extension palette.
All surfaces below consume the named CSS properties rather than fixed copies.

| Role / renderer token | Default dark | Default light | Extension use |
| --- | --- | --- | --- |
| Canvas / `--canvas` | `#010102` | `#ffffff` | Library and writing page floor |
| First surface / `--surface-1` | `#0f1011` | `#f5f6f6` | Search, graph panel, floating timer |
| Second surface / `--surface-2` | `#141516` | `#f6f7f7` | Row hover, code, links, contextual tools |
| Third surface / `--surface-3` | `#18191a` | `#eceeef` | Folder selection and hover, record selection |
| Fourth surface / `--surface-4` | `#191a1b` | `#e4e6e8` | Existing shell/control vocabulary |
| Main ink / `--ink` | `#f7f8f8` | `#141516` | Titles, note content and selected controls |
| Muted ink / `--ink-muted` | `#d0d6e0` | `#34343a` | Excerpts, metadata and folder labels |
| Subtle ink / `--ink-subtle` | `#8a8f98` | `#62666d` | Counts, dates, save status and graph edges |
| Hairline / `--hairline` | `#23252a` | `#dce0e4` | Rows and structural divisions |
| Strong hairline / `--hairline-strong` | `#34343a` | `#b8bdc4` | Search boundaries, menus and timer outline |
| Lavender / `--primary` | `#5e6ad2` | `#5e6ad2` | Caret, search focus, note graph nodes and opacity slider |
| Action hover / `--primary-hover` | `#828fff` | `#828fff` | Existing primary-action vocabulary |
| Danger / `--danger` | `#f0a6a6` | `#9b3434` | Save/load and timer errors |
| Warning / `--warning` | `#d7bd87` | `#765a22` | Work-project graph nodes |
| Overlay / `--overlay` | `#000000b3` | `#01010266` | Narrow graph overlay shadow |

**The Preference Rule.** Runtime `themeTokens` and `accentTokens` in
`src/shared/appearance.ts` apply through ProductivityProvider and can override
these defaults. Tempo, Graphite, Slate, Dusk and Forest palettes and the existing
Lavender, Cedar, Terracotta, Mulberry, Ochre and Petrol accents remain available.
The warm neutral captures reflect an incumbent appearance preference; they do
not establish a replacement hardcoded Notes palette. Runtime accent focus uses
the selected accent color, overriding the base `--primary-focus` (`#5e69d1`).

Graph note nodes use the selected primary accent; project nodes use warning;
topic and curriculum nodes use subtle ink. Selection emphasizes the node and its
neighbors by opacity rather than filling the panel with another accent.

## Typography

| Role | Implemented measure |
| --- | --- |
| Shared interface | `'Inter Variable', 'Segoe UI', sans-serif`; body `14px`, caption `12px` |
| Code | `'JetBrains Mono Variable', Consolas, monospace`; note code blocks `13px` |
| Library heading | `36px`, weight `600`, tracking `-0.025em` |
| Note title | `40px`, weight `600`, line height `1.2`, tracking `-0.025em`; `32px` below `1000px`, `30px` below `720px` |
| Note body | `16px`, line height `1.8`, maximum `75ch`; paragraphs separated by `16px` |
| Body headings | Weight `600`, line height `1.3`, `30px` top / `10px` bottom margins |
| Library row | Title `16px` / weight `500`; excerpt `13px` / line height `1.6`; metadata `12px` |
| Folder labels | `13px`; overflow uses ellipsis |
| Graph heading / selected record title | `16px` / weight `600`; record title line height `1.5` |
| Floating timer | `clamp(30px, 12vw, 54px)`, weight `500`, line height `1.1`, tabular numerals |

Titles and body content wrap, including long unbroken text. The title is an
autosizing textarea with no permanently visible input box. Counts, timestamps
and status recede beneath the writing content. Interface scale changes Electron
zoom; it does not introduce another typography system.

## Layout

Notes uses a full-width page with `40px 32px` padding. Its centered two-column
layout is at most `1300px`, with a `210px` folder index, flexible content and a
`48px` gap. The folder index has a right hairline and `20px` inner end padding.
Writing retains this navigation context and centers an `850px` maximum canvas.
Search is bounded to `650px`, with a `42px` minimum height. Rows separate with a
hairline and `22px 8px` padding; their two-line excerpts are visually bounded.

At `1000px` and below, page padding becomes `28px 24px`, the index `170px` and
column gap `24px`. At `720px` and below, Notes becomes one column with `24px 18px`
padding. Browse notes exposes the hidden folder index and reports expanded
state; choosing a folder closes that browse state. Dates leave the narrow list,
metadata wraps, and the writing title remains multiline. The shared sidebar
continues its existing mobile behavior.

The graph is a right-hand sibling panel (`380px`, expanded `540px`), separated by
a left hairline. Its canvas is `330px` high. At `1100px` and below, both panel
sizes become a fixed right overlay at `min(420px, 100vw)`; the close control and
Escape dismiss it. Graph does not replace the main page.

**The Whole Workspace Scale Rule.** Settings offers `80`, `85`, `90`, `95`,
`100`, `110` and `125%`. The persisted scale applies with Electron
`webContents.setZoomFactor` to all application windows, including the sidebar
and floating timer. Missing or invalid preferences use `100%`. Existing profiles
retain that value until a choice; this handoff does not select another default.

Focus E defaults to an outer native window of `260 x 152px`, with resizing
bounded by `220 x 136px` and `480 x 320px`. It uses a draggable header, excludes
its controls from dragging and keeps a scrollable content region if needed.
Stored bounds are restored within a display work area; Windows frame offsets
are accounted for when persisting dimensions.

## Elevation & Depth

Page structure uses neutral tonal layering and single-pixel hairlines. Notes
adds no card grid or page-wide shadow system. The native timer has a strong
hairline, a solid first surface and no CSS shadow. The graph overlay uses
`-12px 0 35px var(--overlay)` to separate it from content at narrow widths.

The exact vendored Yoopta toolbar retains its small two-part shadow
(`0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`). Its
resting background/border/ink are reconciled with Tempo tokens in knowledge.css.
This imported contextual component is a local exception, not a new depth rule
for every page. Existing modal presentation remains shared.

## Shapes

The shared radius vocabulary remains `4`, `8`, `12`, `16px` and pill. Extension
search fields and slash menus use `8px`, folder rows and linked-record chips
`4px`, and Focus E `12px`. Shared icon buttons retain their `32px` square and
`7px` radius; graph and timer controls are `30px` squares. Folder icons are
`16px`, tree chevrons `13px`, and timer icons `16px`. The imported toolbar uses
an `8px` container radius and `6px` button radius, with `32px` minimum buttons.

These compact control sizes describe the shipped desktop composition. They do
not assert a separate comprehensive touch-target or accessibility audit.

## Components

| Component | Resting / interactive / recovery states |
| --- | --- |
| Folder tree | All notes, Unfiled, nested paths and Archived; expandable branches with labelled chevrons; selection/hover uses third surface; subtree counts derive from active notes; selected nested folder exposes its ancestors |
| Library | New folder / New note are labelled quiet actions; newest-updated notes first; search matches title, tags and semantic content; no-content and no-match states use distinct copy; opening/load errors remain visible; creation disables while busy |
| Search | First surface, strong hairline, `8px` corners; focus-within uses a `2px` primary outline (`2px` offset in Notes); controls have explicit accessible names |
| Writing canvas | Editable wrapping title; folder selector, tags and Link record; semantic Tiptap document; contextual Bold / Italic / Heading / Inline code toolbar; slash inserts Heading / Bullet list / Code block / Quote / Divider; Escape hides the slash menu |
| Tags after F1 | Raw `tagText` controls the input while typing; separators and in-progress spaces stay visible. Draft/save tags independently split on commas, trim, remove empties and retain at most 30 tags. Blur displays the normalized list. Draft restoration resets text from semantic tags |
| Saving | Change reports Unsaved changes and keeps a local semantic draft; `700ms` debounce saves through the existing API; Saving… / Saved locally status is announced; failed save reports Draft kept on this device with Save now; Ctrl/Cmd+S saves; Back waits for a successful save |
| Links / export / archive | Real record picker searches current graph records; saved IDs appear as removable chips; Markdown export uses current semantic draft; Archive / Restore changes the record state and waits for save before leaving |
| Graph | Header toggle opens/closes the right panel; expanded state, type filter, search results, selected record, pan and `0.25–8` zoom; record buttons provide the non-canvas selection/opening path; empty matches and errors remain visible; graph routes open actual records |
| Sidebar arrangement | Existing waveform and navigation components retained; persistent order by stable entry ID; drag handle plus labelled Move up/down controls; first/last moves disabled; Reset order returns registry order; unknown stored IDs ignored and missing current entries appended |
| Focus E | Same authoritative Focus snapshot and commands; running Pause and paused Resume; busy/no-timer/strict states disable the control; Open Focus reveals the main route; Hide leaves the session running; appearance expands opacity control with labelled `35–100%` range; errors use alert copy |

Shared icon hover uses neutral `--accent-soft` and `--accent-text`. Global
keyboard focus is visible, using a `2px` accent outline; the base layer also
provides the focus token and `3px` offset. Shared disabled buttons use opacity
`0.45` and a not-allowed cursor. The toolbar retains its upstream HSL hover and
focus variables and `150ms` transition; its imported active-state selector is
not bound to `data-active` by NoteEditor, so this record does not claim a
persistent selected-format indication.

The graph loads genuine nodes and hierarchy/saved-reference edges, refreshes on
workspace events and compares graph signatures before replacing its model. The
deterministic initial layout runs at most 150 settling steps. Reduced motion
settles synchronously; there is no idle perpetual animation. Theme and resize
changes redraw the canvas. Search narrows the record list; type filtering changes
the rendered layout. Selected-neighbor emphasis assists a dense full graph but
does not make every all-record fixture independently legible.

Focus E is frameless, resizable, always-on-top and excluded from the taskbar.
Active runs show it without stealing activation; hiding dismisses it for that
run. Opacity and bounds persist in the local widget preferences. Privacy hides
a linked habit name when enabled. No separate timer or editor engine was added.
Yoopta stylesheet reuse retains the MIT notice; document semantics stay in
Tiptap and SQLite, with stable-ID atomic Markdown mirrors. External conflicting
Markdown remains preserved, and existing notes win on backup import.

## Do's and Don'ts

- **Do** resolve appearance from the existing semantic tokens and runtime preferences.
- **Do** retain folder navigation, a bounded search and the constrained writing measure when extending Notes.
- **Do** preserve raw editing text separately from normalized semantic data where separators can be unfinished.
- **Do** retain labelled graph record controls, keyboard reorder alternatives, visible save/error states and the shared native Focus authority.
- **Don't** treat preview-only content or screenshots as production database records.
- **Don't** alter Home, replace the waveform, invent graph relationships or impose a new interface-scale default through this extension.
- **Don't** repair DESIGN.md or generate its sidecar as a side effect of this scoped record.

Extension checks read for this handoff: the corrected tag-entry source and the
fresh `.review/knowledge-workspace-final-tags/results.json` report all six
isolated workflow groups passing, with no harness errors. The harness now types
`sql,python` and `data engineering`, checks semantic draft tags, autosave,
reopening, further multi-tag editing, Markdown and backup tags. Native controls,
restart persistence, sidebar order, Markdown/graph behavior and whole-app scale
are included in those reported groups. These are inspected harness results,
not tests rerun by the documenter.

The independent finish review now records **ship** for the extension after its
F1-only verdict pass: the tag-entry defect is resolved, and all 18 refreshed
required captures under `.review/knowledge-workspace-final-tags/captures/` and
`scale-captures/` are valid. That verdict does not reopen the full quality audit
or establish installed release readiness.
Packaging, owner backup and installed two-launch acceptance belong to the release
handoff. This document establishes neither installed acceptance nor a numeric
design score. It is not a full accessibility audit, graph performance benchmark
or an assertion about every width, scale or record density. The only file written
by this documentation handoff is this record.
