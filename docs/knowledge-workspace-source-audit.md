# Knowledge workspace: source reuse and design proposal

Research date: 2026-10-08. This is a source audit and proposed direction, not an
implemented feature or a verified editor migration. Tempo application code and
owner data were not changed for this audit.

## Confirmed owner choices

- Engineering notes use pages and folders, with links and tags.
- The graph initially includes notes, study topics and work projects. Other
  record types are optional.
- No AI features are requested.
- Latest owner correction: retain the installed Home completely. A is preferred
  as the workspace foundation. Notes opens at an organised folder tree; Markdown
  storage is required for production. Graph belongs only in a collapsible right
  panel, with typed database records as nodes and actual relationships as edges.
  Sidebar order is owner-configurable. Remove Review from navigation while
  retaining saved reviews outside the metrics-only Statistics page. Keep the waveform logo.
- Show five working visual options before implementing a changed screen.

## Source inspection and reuse boundaries

The following public source revisions were resolved from GitHub's repository
and tree APIs. Listed files were read as text; no upstream application was run.
This is a bounded inspection, not an audit of every file in these repositories.

| Project | Inspected revision | Decision |
| --- | --- | --- |
| AFFiNE | `2d4f191e679a1eb95f96fe12b95060deb35668ae` (canary) | Strong candidate for shared frontend controls and token architecture. |
| Docmost | `d3a0c9bfdf3710161fe66e8de28a8d23104d54f5` (main) | Strong candidate for Tiptap editing components and document layout. |
| Anytype desktop | `d965ea28b46588fbad3aefe10e1c43e3ea921852` (develop) | Graph behaviour and object-linking reference; conditional code reuse. |
| Outline | `d4603413621b3612c2a32ff529fdb7b5f4e3ba43` (main) | Reading layout and navigation reference; assess private-use grant separately from redistribution. |
| Yoopta | `070349b1cd703d05548e2db94c98b4e9622d4f07` (master) | Exact MIT toolbar stylesheet and variables vendored in the isolated preview. Slate editor migration remains unimplemented. |
| Notesnook | `1a405554e55d3452fd6d2c9e1bea3bd6c9c15669` (master) | GPL-3.0-or-later editor/navigation candidate; inspected package and sidebar-scroller wrapper. |
| BlockNote | `be20d8b6ea9aaa8b23ae0c84397a09fe6f6b5a12` (main) | Core/react MPL-2.0; XL packages GPL-3.0. Strong block-editor candidate, not yet installed. |

### AFFiNE: common controls

Inspected [button styles](https://github.com/toeverything/AFFiNE/blob/2d4f191e679a1eb95f96fe12b95060deb35668ae/packages/frontend/component/src/ui/button/button.css.ts)
and [theme styles](https://github.com/toeverything/AFFiNE/blob/2d4f191e679a1eb95f96fe12b95060deb35668ae/packages/frontend/component/src/theme/theme.css.ts).
The button implementation uses shared variables for dimensions, typography,
spacing and states, backed by vanilla-extract and a theme package. This offers a
concrete basis for consistent controls rather than copying unrelated CSS per
screen. Its frontend licence is MIT; backend and native directories and embedded
third-party components have separate terms. Retain notices and inspect each
dependency before extraction. [Licence boundary](https://github.com/toeverything/AFFiNE/blob/canary/LICENSE).

### Docmost: editing and page composition

Inspected the page editor, full editor, bubble menu and
[core typography](https://github.com/docmost/docmost/blob/d3a0c9bfdf3710161fe66e8de28a8d23104d54f5/apps/client/src/features/editor/styles/core.css).
Page width and toolbar preference are separated from editing. The bubble menu
uses Tiptap, as Tempo does. The complete page editor also imports authentication,
network collaboration and enterprise AI components. Adapt small core components
to Tempo's local save API; copying that whole component unchanged would bring
unwanted dependencies. Core code is AGPLv3; enterprise directories are separately
licensed. [Core/enterprise boundary](https://github.com/docmost/docmost#license).

### Anytype: graph implementation

Inspected [graph provider](https://github.com/anyproto/anytype-ts/blob/d965ea28b46588fbad3aefe10e1c43e3ea921852/src/ts/component/graph/provider.tsx).
It uses React, D3, canvas and a worker, with application-specific storage,
settings and previews. This supports the feasibility of the requested graph in
TypeScript; it is not a portable widget without its dependencies. The client uses
Any Source Available License 1.0, including use and redistribution restrictions.
The owner clarified that this is a private personal build, with no intended
distribution. Assess that permitted private use on its own terms; do not make a
distribution compatibility question a blanket prohibition on private changes.
Keep original notices and separately licensed source identifiable. The preview
graph is independently authored, with explicit fictional links, not Anytype's
worker imported into Tempo.
[Anytype licence](https://github.com/anyproto/anytype-ts/blob/d965ea28b46588fbad3aefe10e1c43e3ea921852/LICENSE.md).

### Outline: document reading space

Inspected [CenteredContent](https://github.com/outline/outline/blob/d4603413621b3612c2a32ff529fdb7b5f4e3ba43/app/components/CenteredContent.tsx).
It separates the full-width page shell from the constrained reading column, with
responsive padding and a shared document-width helper. Treat that structural
principle as a design reference. Current Outline uses Business Source License
1.1, with an additional use grant and a future Apache change date. Its licence
explicitly distinguishes itself from an open-source licence. It cannot simply
be relabelled AGPL. Its additional use grant permits personal local use; that
differs from distributing a combined product. No Outline source has been
vendored in this preview. [Outline licence](https://github.com/outline/outline/blob/main/LICENSE).

### Yoopta, Notesnook and BlockNote

Read Yoopta's MIT licence, shared UI variables and floating-toolbar stylesheet.
The latter two are copied unchanged under
`docs/prototypes/knowledge-next/vendor/yoopta/`, with the original MIT notice.
The React control bindings are Tempo-authored and use the already installed
Tiptap editor; this is literal stylesheet reuse, not a Yoopta-engine installation.
Yoopta's official README describes a Slate-based editor and block plugins.
[Source](https://github.com/yoopta-editor/Yoopta-Editor/tree/070349b1cd703d05548e2db94c98b4e9622d4f07/packages/core/ui/src).

Notesnook's editor package declares GPL-3.0-or-later, React >=18 peers and
Tiptap 2.6.6 dependencies. Tempo currently uses Tiptap 3.31.4, so an unchanged
editor substitution is not verified. Its inspected sidebar-scroller delegates
to Notesnook's own ScrollContainer with a narrow track and suppressed horizontal
scroll. This is a small wrapper inspection, not a full design-code audit.
[Editor package](https://github.com/streetwriters/notesnook/blob/1a405554e55d3452fd6d2c9e1bea3bd6c9c15669/packages/editor/package.json).

BlockNote core and React packages declare MPL-2.0. The repository licence
excludes `packages/xl-*`, which use GPL-3.0 with a commercial alternative.
The core supplies block-based editing on ProseMirror/Tiptap and is a strong
candidate for the requested Notion-like behaviour without AI. Existing Tempo
documents still require explicit conversion/round-trip and local-save checks
before changing engines; sharing an underlying framework is not drop-in data
compatibility. No BlockNote package was installed for the preview.
[Licence boundary](https://github.com/TypeCellOS/BlockNote/blob/be20d8b6ea9aaa8b23ae0c84397a09fe6f6b5a12/LICENSE.txt).

## Proposed visual direction

Use an AppFlowy/Notion-style page structure with a restrained AFFiNE-like control
system. Engineering content should lead: a clear title, optional local cover,
comfortable reading width and contextual editing controls. Document pages can
fill the workspace while paragraphs retain a readable line length.

Build one coherent set of inputs, menus, icon buttons, tooltips, focus states,
spacing and typography. Match hover, keyboard focus, selected and disabled states
as carefully as the resting screenshot. Add controls should remain quiet; search
needs a real input container. Avoid explanatory filler and permanently exposed
formatting bars. Home and sidebar are now eligible for the owner's chosen
replacement design. No production token or Home change is made at preview stage.

Literal reuse is appropriate for licensed, isolated components. Each imported
file needs its original notice, fixed source revision and a record of changes.
Adapt only dependencies, data bindings and behaviour needed by Tempo. Shared
appearance must be reconciled across components from different projects.

## Notes and graph engineering proposal

Keep Electron, React, TypeScript and local SQLite. A language rewrite is not
required by these features. Tempo already uses Tiptap; compare selected Docmost
extensions with an isolated AppFlowy editor prototype before switching engines.
Changing engines requires conversion and round-trip tests on existing documents.

Add versioned tables for notes, folders, tags, attachments, stable block IDs and
relationships. Reference existing project/topic IDs rather than copying their
records. Save note content and its relationship index in the same transaction.
Use indexed search, autosave with explicit saved/error states, local attachments,
document revisions, Trash and portable export. Backups must include the new
records and assets. Revisions and save behaviour need acceptance tests.

The graph is a view over stored relationships, not the source of truth. Links
come from explicit references or known project/topic membership. Graph controls
should support search, zoom, pan, type/tag filters, selected-node neighbours and
opening a note in a side preview. Provide a keyboard-accessible relationship
list. Use a worker for layout, bounded rendering and reduced-motion support.
Keep layouts stable across reopening and stop simulation when it settles.
Graph performance is a benchmark requirement, not a claim established here.

Suggested engineering-note templates: concept/explanation, experiment/debugging,
project decision and reading/source note. Desired blocks include code, tables,
mathematics, callouts, local images and diagrams. No AI service is required for
manual references, backlinks or graph layout.

## Delivery sequence and unresolved choices

1. Five interactive page/notes concepts using realistic engineering content,
   local-graph and full-graph states, both themes and realistic window sizes.
2. Select the page composition and graph interaction before application UI edits.
3. Prototype licensed source adaptations on an isolated branch and fixture data.
4. Implement additive note/link storage and verify old records and document export.
5. Validate offline packaging, then fresh owner backup and two installed restarts.

Editor engine choice, exact imported file set, dependency compatibility and the
final composition remain unverified. No new design score is claimed.

October 8 correction: A Classic workspace is approved. Remove reflection prompts from Statistics; preserve saved review data. New request: a tiny always-on-top Focus timer with pause/resume outside Tempo; five visual control options must precede implementation.
