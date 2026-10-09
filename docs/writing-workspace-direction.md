# Markdown writing workspace — October 8, 2026

User rejected the installed Notes/library writing experience and supplied two
Obsidian screenshots plus Tempo's empty library. Those screenshots supersede the
prior visual approval for the writing workspace. Installed Tempo remains 1.9.0.

Mode: Operate, with Read inside a document. Build path: code first. Inherit actual
Tempo fonts, neutral surface hierarchy and waveform, with preview-specific
charcoal/teal values, rather than the preexisting
marketing DESIGN.md. Do not repair that drift or change installed Home.

Confirmed: Markdown with live preview like Obsidian. Keep the existing Study
library/time/progress/topic counts. Add persistent nested topic navigation and
remember each section's exact route, selection, expansion, tabs and scroll when
leaving and returning. Five working options precede production implementation.

Grounded compositions, ranked before selection: (1) Vault desk — rail, persistent
file tree, document tabs and outline; (2) Notebook — familiar app navigation,
folder drawer and full document; (3) Reference desk — two documents side by side;
(4) Study desk — curriculum hierarchy and connected notes; (5) Writing room —
collapsed chrome with on-demand panels; (6) Column browser — depth in adjacent
columns; (7) Switcher-first desk — keyboard-first navigation. Surface seed
4e875f22 dealt 3,5,1. Catalog was unreachable on the initial and escalated retry.
Per the user's explicit five-option requirement, show 1–5 as equally usable
working compositions, with Reference desk leading. No quality-board claims.

Preview uses actual CodeMirror 6 and its Markdown language package, not a
textarea. Markdown remains the original editing string. A small Tempo adapter
decorates syntax outside the active line; source remains reversible. Markdown-it
provides read rendering with raw HTML disabled. Existing production Tiptap/JSON
notes are not migrated here. No owner files, vault or database are read.

The preview must demonstrate persistent section navigation, tab reopening,
expanded nested trees, outline jumps, adjustable panels, source/live/read modes,
typing, undo, export, light/dark, keyboard access and a narrow layout. All content
is fictional, stored only in the preview origin's local storage.

Production engineering decisions remain separate: exact Markdown/attachment
round trips, external-edit conflict handling, rename/move/backlink identity,
backup migration, editor IME/large-document handling and session-state recovery
require real integration checks after a layout is selected.

Source references: https://github.com/codemirror/dev and
https://github.com/codemirror/lang-markdown (MIT); Markdown-it (MIT).
BlockNote's documented lossy Markdown export is the reason to avoid making block
JSON the new canonical format for this requested Markdown-first workflow:
https://www.blocknotejs.org/docs/features/export/markdown.

## Direction contract

THESIS: Keep the document and its place in the hierarchy reachable together.
Avoid a separate landing page between selecting a note and continuing to write.

OWN-WORLD: Tempo's waveform and Inter UI, neutral surfaces, one teal action
accent, 13px navigation, 16px prose, JetBrains Mono for code. Fine separators
define resizable panels; compact tabs sit directly above the document.

STORY: Find a nested file, write Markdown, consult an outline or reference,
switch to Study or Work, then return to the same document and position.

FIRST VIEWPORT: A persistent folder tree to the left, document tabs and source
controls above the editor, outline to the right. Five equally usable layouts
vary the navigation and reference placement. Typing is the primary action.

FORM: Options 1–5 on the ranked list; Reference desk leads the comparison.
Surface seed 4e875f22, dealt 3,5,1, catalog unavailable after bounded retry.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
