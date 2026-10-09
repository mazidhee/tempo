# Markdown writing workspace options

Five working alternatives for the October 8 writing request. This preview reads
no owner database, Markdown vault or installed-app preferences. Notes are
fictional. Changes persist only in this preview origin's local storage.

From the repository root:

```powershell
npm ci --prefix docs/prototypes/writing-next
node scripts/writing-preview-build.cjs
node scripts/writing-preview-server.cjs
```

Open http://127.0.0.1:5225/ . The root project's installed React, Lucide and
esbuild dependencies are also required. Generated bundles and node_modules are
ignored; the package lock pins the editor dependencies.

| Option | Arrangement |
| --- | --- |
| A — Vault desk | Compact section rail, persistent files, tabs and outline |
| B — Notebook | Familiar labelled navigation, folder tree, wider document |
| C — Reference desk | Editor beside a selectable read-only reference note |
| D — Study desk | Nested Study path, progress, recorded time and current topic |
| E — Writing room | Open document with panels available on demand |

Try typing Markdown, changing Source/Live preview/Read, switching sections and
returning, opening a deep folder, jumping through Outline, resizing the panel
with its keyboard-focusable separator, and following a wiki link in Read mode.
Ctrl B toggles files. Ctrl K opens note search. Switch light/dark from the top.
On narrow screens the file tree and context tools open as separate drawers.

CodeMirror 6 provides editing, selection, undo, Markdown parsing and code
folding. Tempo's preview adapter decorates Markdown outside the caret line;
the caret line exposes its syntax. Markdown-it renders Read mode with HTML
disabled. Graph edges represent explicit wiki links in the fictional notes.

The preview remembers each section's selected document, tabs, expanded folders,
explorer scroll, and each document's editing and reading positions. Panel
preferences persist too. Undo is kept
in memory across section and mode changes, not browser restarts.

This is a layout and interaction comparison, not the installed implementation.
The Study values are illustrative, not owner statistics. Existing production
JSON documents are untouched. File/folder rename and move, conflict handling,
attachments, robust external edits, large-note/IME acceptance, Markdown round
trips and backup migration belong to the production integration after selection.

Validation: built with esbuild; browser checks covered typing, source/live/read,
undo after a section round trip, restoring a scrolled note, file search, read
wiki navigation and visible keyboard panel resizing in the reference layout at
1440px and 1200px. The review correction checks also covered separate section
expansions, Read-position restoration, search focus containment/restoration and
the selected Study topic label. An extracted-source persistence check verified
failed storage writes and a successful retry; it was not a browser quota test.
Captures cover all five layouts,
light/dark, desktop and narrow drawers. The browser's download-event check
timed out, so downloaded-file acceptance remains unverified.

Sources: [CodeMirror](https://github.com/codemirror/dev),
[Markdown language](https://github.com/codemirror/lang-markdown),
[Markdown-it](https://github.com/markdown-it/markdown-it). Each uses MIT licensing;
dependency licenses stay in the generated bundle's linked legal file.
