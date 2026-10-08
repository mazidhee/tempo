# Knowledge workspace preview review

2026-10-08. **PASS for visual selection**, following one bounded fix-and-recapture
round. This is not a production release verdict or a numerical design score.

The latest owner brief protects installed Home, prefers A as the foundation,
requires a folder-first Notes library, Markdown files in production, a graph-only
right panel, configurable main sidebar order, and removal of Review from navigation.
The later owner correction keeps Statistics metrics-only and retains saved reviews
outside it.
See [the preview contract](knowledge-preview-direction.md).

## Independent visual review

The reviewer inspected all five revised Notes desktop-light views and all five
390px views, plus A's writing canvas, dark graph panel and sidebar-order dialog.
The first revised verdict required two corrections: C's folder row display and
clipped labels, and a blurred sidebar-order evidence capture. The source now
restores flex alignment and text ellipsis in C. Both affected captures were
replaced, independently rechecked, and passed. No findings remain from that
selection-scope review. The earlier prototype's folder, creation, Mathematics
routing, static outline, compact folder access and code-size findings were fixed
or superseded by the revised owner scope.

Required evidence is local under `.review/knowledge-options/`:
`revision-A..E-notes-light.png`, `revision-A..E-notes-mobile.png`,
`revision-A-writing-light.png`, `revision-A-graph-dark.png`,
`revision-sidebar-order.png`, and `revision-checks.json`.

## Functional evidence

Browser interaction verified:

- New note creation in `Learning/Python`, real slash heading insertion, writing
  a paragraph, and retention after reload.
- Generated Markdown output containing stable note ID, title, folder, tag,
  heading and paragraph. A download link is offered. The in-app browser did not
  supply a download completion event, so a saved `.md` file is not verified.
- Retained empty folder creation; nested folder expansion and opening a note
  through the compact writing-page folder drawer.
- Sidebar up/down ordering and retention after reload. Drag handlers are present
  in source; physical drag interaction was not separately verified.
- Empty search, arrow/Enter selection, graph search, correct note navigation,
  and inspection of the selected project ID and its tasks.
- Reflection saving and display after leaving and returning to Statistics.
- No horizontal overflow in all ten measured revised Notes layouts. No browser
  console errors were observed during the revised workflows.

The editor bundle builds successfully. Syntax checks pass for app and graph
scripts. The contrast detector's light hover finding was corrected by darkening
secondary text. The font rule has one documented, file-scoped Inter exception to
preserve Tempo's incumbent typography; no broad detector rules were disabled.

## Integration boundary

The preview uses fictional records and an isolated browser storage key. Its
typed graph has explicit membership, sequence and reference relationships, with
a bounded settling force layout. It does not read the owner's database. Actual
filesystem-backed Markdown storage, database record-link indexing, migration of
saved reviews, backup integration and installed acceptance remain pending until
the owner chooses the revised design. Production Home, original logo, application
code and owner data were not modified. The prototype waveform is hand-drawn;
byte-identical production logo fidelity is not established.

Literal upstream reuse consists of two unmodified Yoopta MIT toolbar/style files
with their licence and pinned source notice. The running editor is Tiptap. This
does not claim that BlockNote, Notesnook, AFFiNE, Docmost, Outline or Anytype engines
have been merged into Tempo.
