# Knowledge workspace: source reuse and design proposal

Research date: 2026-10-08. This is a source audit and proposed direction, not an
implemented feature or a verified editor migration. Tempo application code and
owner data were not changed for this audit.

## Confirmed owner choices

- Engineering notes use pages and folders, with links and tags.
- The graph initially includes notes, study topics and work projects. Other
  record types are optional.
- No AI features are requested.
- Keep the current Home, original logo and sidebar conventions protected.
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
| Outline | `d4603413621b3612c2a32ff529fdb7b5f4e3ba43` (main) | Reading layout and navigation reference; conditional code reuse. |

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
Personal-use permission does not establish compatibility with distribution of
a combined AGPL application. Prefer an independently implemented graph using a
permissively licensed graph library until that integration is resolved.
[Anytype licence](https://github.com/anyproto/anytype-ts/blob/d965ea28b46588fbad3aefe10e1c43e3ea921852/LICENSE.md).

### Outline: document reading space

Inspected [CenteredContent](https://github.com/outline/outline/blob/d4603413621b3612c2a32ff529fdb7b5f4e3ba43/app/components/CenteredContent.tsx).
It separates the full-width page shell from the constrained reading column, with
responsive padding and a shared document-width helper. Treat that structural
principle as a design reference. Current Outline uses Business Source License
1.1, with an additional use grant and a future Apache change date. Its licence
explicitly distinguishes itself from an open-source licence. It cannot simply
be relabelled AGPL. [Outline licence](https://github.com/outline/outline/blob/main/LICENSE).

## Proposed visual direction

Use an AppFlowy/Notion-style page structure with a restrained AFFiNE-like control
system. Engineering content should lead: a clear title, optional local cover,
comfortable reading width and contextual editing controls. Document pages can
fill the workspace while paragraphs retain a readable line length.

Build one coherent set of inputs, menus, icon buttons, tooltips, focus states,
spacing and typography. Match hover, keyboard focus, selected and disabled states
as carefully as the resting screenshot. Add controls should remain quiet; search
needs a real input container. Avoid explanatory filler and permanently exposed
formatting bars. Home must retain its current rendering if shared tokens change.

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
