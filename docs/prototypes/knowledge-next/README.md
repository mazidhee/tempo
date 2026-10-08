# Tempo knowledge workspace options

This is an isolated, unapproved five-option design-selection prototype using
fictional records. A is the owner's preferred foundation; final selection and
production integration remain pending. The studio bar's **Choose** button saves
a local preference, not production approval. The owner app and database are
untouched by this preview. No completed migration or 9.9 quality score is claimed.

The latest brief protects the installed Home completely, including its thought
design. The five alternatives now compare Notes and navigation. Notes opens a
folder library; the sidebar is reorderable; the graph belongs only in a
collapsible right panel; weekly reflection belongs in Statistics rather than a
standalone Review route. Every graph node represents a typed fixture record and
edges represent declared relationships. Preserve the waveform and owner records;
no AI is requested. See [the current direction contract](../../knowledge-preview-direction.md).
Its latest corrections supersede the earlier Home redesign proposal in
[the source audit](../../knowledge-workspace-source-audit.md).

The preview Home is a bounded fixture illustration of the protected surface,
not evidence that the installed screen was reproduced or changed. Its waveform
is a hand-drawn SVG rendering, not verified byte-identical to the production logo
asset; the production logo remains unchanged. Production `DESIGN.md`, its
Impeccable sidecar and `PRODUCT.md` are outside this README's write boundary.

## Build and run

Run from `C:\Users\USER\Documents\Habit-Tracker` in PowerShell with the repository's
Node dependencies installed:

```powershell
node scripts/knowledge-preview-build.cjs
node scripts/knowledge-preview-server.cjs
```

Open [the local preview](http://127.0.0.1:5222/). Stop the server with Ctrl+C.
Use `?option=A` through `?option=E` to open a particular option, for example
[option A](http://127.0.0.1:5222/?option=A). The query takes precedence over the
saved option; an invalid option falls back to A. Startup opens the Notes library.

The build bundles `editor.tsx` into `editor.bundle.js` with esbuild and emits
linked legal comments in `editor.bundle.js.LEGAL.txt`. Rebuild after changing
TSX. `app.js`, `graph.js` and `app.css` are served directly. These are standalone
Node commands, not package.json scripts; Electron and Vite are not required.

The server binds `127.0.0.1:5222` and serves an allowlist of prototype assets and
the installed Inter font with `Cache-Control: no-store`. Its content security
policy disallows connections (`connect-src 'none'`) and permits local/data/blob
images. Use the server rather than opening index.html as a file, because asset
paths are rooted at `/`.

## Five alternatives

All alternatives share records and interactions; switching changes composition
rather than creating a separate data set. Installed Home is protected in all five.

| Option | Implemented Notes/navigation composition | Tradeoff |
| --- | --- | --- |
| A · Classic workspace | Familiar full sidebar, expandable folder tree beside a compact note list, open writing canvas. | Preferred foundation; direct and familiar. |
| B · Folder table | Full sidebar, expanded folder strip above a compact note table. | More title space; taller library header. |
| C · Compact navigator | Icon rail and a dedicated folder navigator, full-width note list. | More writing room; icons require familiarity. |
| D · Tabbed notebook | Compact full sidebar, fixed route tabs and tree beside the note list. | Quick switching; another control row. |
| E · Visual library | Full sidebar, folder tree and note cards with short content previews. | More context; lower density. |

These provisional styles use self-hosted Inter, neutral light/dark surfaces,
petrol accents, vector controls and an open writing canvas; Georgia is available
through the serif toggle. They are not new production tokens. Compact layouts
use an icon rail, stack library content, hide the writing index and expose Browse
notes as a folder drawer. The graph stays a right-side overlay at compact widths.
The studio option row scrolls. Reduced-motion users receive a settled graph
without animated layout, and CSS removes transitions.

## Actual upstream reuse

- **Tiptap is the engine.** `editor.tsx` uses the existing React/Tiptap packages
  and StarterKit; repository packages pin Tiptap to 3.31.4. Shell, graph, Markdown
  serializer and React command bindings are authored locally. Lucide React
  supplies vector icons; the waveform is local SVG markup.
- **Yoopta reuse is literal stylesheet reuse.** The unchanged UI variables and
  floating-toolbar CSS from revision `070349b1cd703d05548e2db94c98b4e9622d4f07`
  remain under `vendor/yoopta/`, with the original relative import and MIT notice.
  `app.css` overrides public theme variables. See [NOTICE.md](vendor/yoopta/NOTICE.md)
  and [LICENSE](vendor/yoopta/LICENSE). Yoopta's Slate engine, plugins and AI
  integrations are not included.
- **AFFiNE, Docmost, Anytype, Outline, Notesnook and BlockNote are evaluated
  candidates.** Their engines/components are not imported into this preview.
  Notion/AppFlowy is the owner's design reference family, not an installed
  engine. The source audit records inspected revisions and licence boundaries;
  it does not establish drop-in compatibility, document conversion or a combined
  editor installation.

## Working interactions

**Navigation and choice.** The sidebar opens Home, Plan, Habits, Tasks, Work,
Focus, Study, Notes, Statistics, Goals, Journal and Settings. History/Recovery
are reachable from Habits. Review and Graph are absent from main navigation.
The topbar Graph control opens/closes only the right panel. Sidebar collapse,
option/theme switching and local choice retention work. Arrange sidebar opens
a dialog with drag/drop and up/down controls; main-page order persists. Settings
also exposes Arrange. Fixed Settings/Arrange entries and folder structure are
not part of the main-page reorder list. D's tabs are route shortcuts, not dynamic
open-note tabs.

**Folders and notes.** Notes initially opens the library. Folder trees expose
nested paths with expandable branches; folder tiles filter the library by its
top-level folder and All clears that filter. Library Find a note filters visible
note entries; the writing navigator's filter matches titles or paths. Open a
note from the list/tree, and use All notes to return. At compact widths or with
the graph open, Browse notes provides a folder drawer.

New note accepts a title and an existing folder path, expands the relevant
branches and opens the writing canvas. New folder accepts a slash-separated
path, retains it and opens New note. New notes and empty paths persist in preview
storage. Titles, tags and existing folder placement have no rename/move/delete
controls yet. Folder paths here are metadata, not directories created on disk.

**Writing and Markdown.** Notes and Journal use Tiptap. Selecting text exposes
bold, italic, level-two heading and inline-code controls. Typing `/` exposes
heading, bullet list, code block, quote and divider commands. Choosing a command
removes the slash and applies it; this is a small insertion menu rather than a
complete keyboard-operated block browser. Fixture links and Linked pages open
notes or Work. Wide/serif toggles affect the writing canvas.

Editor updates save Tiptap JSON and derive Markdown for notes in localStorage.
Page options → Export note as Markdown opens a read-only generated-content
preview and a **Download .md** link. It includes frontmatter with note ID, title,
folder and tag, then title/body. The serializer handles the preview's headings,
paragraphs, lists, quotes, fenced code, dividers, hard breaks and selected marks
including links. Export requires an open note; it is not a Journal or bulk export.
Automatic filesystem-backed Markdown saving, production folder mapping,
attachment export and conversion/round-trip compatibility are still pending.
Generated Markdown content has been verified in the browser; an actual download
event was not received in the in-app-browser check, so file download completion
is not claimed.

Add cover accepts local PNG/JPEG/WebP up to 2 MiB and stores a data URL. Change
opens Change cover/Remove cover controls. Saved in preview/Saved locally is a
preview status, not a transactional production guarantee. Storage-full handling
displays a toast; there is no revision recovery system.

**Tasks, projects, focus and reflection.** Add/filter tasks, move them among
Later/Today/Done by select or drag/drop, complete/reopen them, or schedule Later
tasks from Plan. A task's play button opens Focus with its title. The timer has
15/25/50-minute presets and start/pause/reset/completion behavior; it continues
during navigation within the session but resets on reload and logs no session.
New project adds a persisted preview project. Habit check-ins persist, while
streaks, totals and charts remain fixtures. Statistics includes Weekly reflection;
Save persists its text in the main preview key. Preservation of existing owner
reviews remains a later production migration requirement, not a completed test.

**Search.** Search buttons and Ctrl/Cmd+K open the modal. Case-insensitive title
matching covers notes, projects, tasks and main pages. Arrow Up/Down selects,
Enter/click opens, and Esc closes. Notes open the document; task/project results
open their route. No-match queries show No results. This is not indexed body,
tag or relationship search.

**Right-side graph.** The graph has typed IDs for notes, topics, projects and
curricula. Fixture curricula each declare 30 topics. Edges come from declared
curriculum membership, topic sequence, note references, note/topic explanations
and project/topic/curriculum associations. Local `#note/...` references in edited
Markdown also contribute links. New notes/projects become record nodes. Links
are not generated from proximity, and this graph reads no production records.

`graph.js` independently renders a canvas force layout bounded to 240 steps,
then fits the view. Positions are cached in memory by record ID for reopening
within the session, not persisted to storage. Drag pans; wheel and +/- buttons
zoom; Fit resets the view. Focused canvas supports arrow-key panning, +/− zoom
and 0 to fit. Type controls filter records and their incident edges; record
search filters the accessible button list. Clicking a canvas node or list/link
button selects its detail and declared relationships. Open record opens a note
or an inspector for a project/topic/curriculum. The panel can expand/collapse;
it never becomes a standalone central route. This fixture-sized layout is not a
production performance benchmark or Anytype worker integration.

## Storage and remaining boundaries

The isolated main key is `tempo-knowledge-design-demo-v1`. It retains option,
theme, writing preferences, Tiptap edits/derived note Markdown, covers, notes,
empty folders, folder expansion, tasks, projects, habit check-ins, main-page
order, choice and reflection. Retention depends on browser origin/profile.
Startup opens the Notes library. Route, sidebar collapse, active folder/filter,
graph visibility/types/selection, graph positions and timer are session state.
There is no Electron bridge, owner SQLite access, account connection or telemetry.

Settings Reset preview clears the main key and reloads `/`, removing the option
query and resetting retained fixture changes. The previous revision's separate
`tempo-knowledge-design-demo-v1-reflection` key is unused by this revision and
is not cleared by that reset. Use disposable text/images: deleted browser storage
has no Trash or recovery. Settings Export downloads `tempo-design-choice.json`
with choice/theme/preferences; it is not a notes export or owner-data backup.

- Production Home must stay exactly as installed. This prototype's Home
  illustration does not establish installed-screen fidelity.
- Record data, dates, chart values, goals, progress and habit history are fictional.
  New habit/goal/curriculum, import, day/week navigation and other secondary
  actions show layout-preview messages. Freeze is transient. Pomodoro/Track time
  messages do not implement those modes.
- Relationship editing, backlinks as stored transactions, full graph persistence,
  indexed search, tables/math, attachment management, revisions, portable bulk
  export and production Markdown saving require implementation and acceptance.
- Existing owner documents and saved reviews have not been migrated or tested by
  this preview. Neither a build nor source review establishes installed-data
  preservation, final design quality or Windows release readiness.

## Verification and manual smoke path

Preview builds have succeeded. The browser pass reported no browser errors and
checked nested folder drawer expansion/opening, note creation in Learning/Python,
slash heading insertion, reload retention, generated Markdown frontmatter/heading/
paragraph, sidebar up/down reordering and retention, search empty/arrow/Enter,
and graph opening the correct note and exact project inspector. These checks
do not establish every interaction or production compatibility. Browser QA is
ongoing; actual Markdown download completion remains unverified.

Revised captures are under `.review/knowledge-options/`: A–E Notes light/mobile,
A graph dark, A writing light, sidebar order and Statistics reflection, using
the `revision-` filename prefix. [revision-checks.json](../../../.review/knowledge-options/revision-checks.json)
records no overflow in the checked A–E light views and folder-navigator visibility
at 390px. These are bounded snapshots. This README's source review did not run
owner-data tests. The following is a manual smoke path for disposable fixtures,
not a claim that all steps passed:

1. Build/start the server. Inspect A–E Notes at desktop width and 390px, both
   themes, a writing canvas and Settings. Check overflow and reachable controls.
   Capture the views required by the direction contract, including A dark with
   graph open and the sidebar-order dialog. Keep installed Home out of redesign.
2. Expand nested folder branches, filter the library, create a disposable nested
   path and note, and reload to inspect retention. Open it through the tree/list,
   insert a slash heading, select/format text, and return through All notes.
3. Inspect generated Markdown frontmatter/body. Try Download .md in a browser
   that reports/downloads files, and inspect the saved file before claiming
   download completion. Test temporary covers plus wide/serif preferences.
4. Reorder sidebar pages by drag and up/down buttons, reload and check order.
   Save a Statistics reflection, navigate away/back and reload to check retention.
5. Add/move/filter/reopen a task, schedule it in Plan, create a project, and
   reload. Try timer presets/start/pause/reset and observe reload reset.
6. Search with Ctrl/Cmd+K, arrow keys/Enter, click, an empty-result query and Esc.
   Open the graph only from its right-panel control. Pan/zoom/fit, toggle types,
   search/select records through the list, inspect declared links and open records.
   Check keyboard controls and compact overlay collapse.
7. Choose/export an option preference and reset disposable preview data when
   finished. Selection and production owner-data acceptance remain pending.

October 8 correction: A Classic workspace is approved. Remove reflection prompts from Statistics; preserve saved review data. New request: a tiny always-on-top Focus timer with pause/resume outside Tempo; five visual control options must precede implementation.
