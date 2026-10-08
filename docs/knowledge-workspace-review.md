# Knowledge workspace finish review

October 8, 2026. Independent, read-only finish review of the current code-led
extension. This review does not establish a numeric design score.

## 1. Disposition

**ship — verdict pass on F1 only.** The sole material finding from the initial
full review is **resolved**. No further F1 correction is owed. This continuation
scores that finding, not a new whole-surface audit or installed release. The
initial full-review disposition was **fix**; the selected Notes A and timer E
compositions did not require a rebuild.

## 2. Evidence inspected

Read the Impeccable skill, its `new-work.md` finish contract and `craft-floor.md`,
and ran context once for `src/renderer/pages/Notes.tsx`. Read
`docs/knowledge-workspace-direction.md` and the source audit. The incumbent app
tokens and rendered surfaces govern this extension; the known DESIGN.md/sidecar
mismatch is outside the repair scope.

Opened every required capture under
`.review/knowledge-workspace-1791483489574/captures/`:

- `notes-library-desktop-light.png`, `notes-library-desktop-dark.png`
- `notes-writing-desktop-light.png`, `notes-writing-desktop-dark.png`
- `notes-writing-mobile-dark.png`
- `notes-library-mobile-dark.png`, `notes-library-mobile-light.png`
- `notes-folders-mobile-dark.png`
- `notes-graph-desktop-light.png`, `notes-graph-mobile-dark.png`
- `notes-library-user-1440-light.png`
- `floating-E-light.png`

Opened every required scale capture under
`.review/knowledge-workspace-1791483567043/scale-captures/`:

- `writing-90-desktop-light.png`, `writing-90-mobile-light.png`
- `notes-90-desktop-light.png`, `settings-90-desktop-light.png`
- `scale-control-90-desktop-light.png`, `sidebar-order-90-desktop-light.png`

All 18 show the named settled surface, with rendered content and no blank or
half-loaded regions. Did not inspect `failure.png`. Also opened
`.review/knowledge-options/revision-A-writing-light.png` and
`revision-A-notes-light.png` as critique references, not pixel-match targets.

Read Notes, NoteEditor, NoteFolders, KnowledgeGraph, SidebarOrder, their styles,
FloatingTimer, floating-timer.css, the native widget and interface-scale modules,
shared knowledge and graph-layout code, knowledge store/backup/module, App,
navigation, and the relevant Settings controls. Checked the vendored Yoopta MIT
notice and toolbar stylesheet. The changed-file list contains no Home page edit.

Read `.review/knowledge-workspace-1791483567043/results.json`: all six native
harness groups pass, including restart persistence, shared timer controls,
Markdown/graph behavior and interface scale. The handoff reports 140/140 npm
tests and an initial detector result of `[]`; neither was rerun here. No second
detector was run. A deterministic trace of the exact tag normalization used by
the controlled input confirms F1 without modifying source or owner data.

For the verdict pass, inspected the corrected NoteEditor raw text state,
restored-draft initialization and tag-input bindings. Read the sequential typing,
draft, save, reopen, Markdown and backup assertions at
`scripts/knowledge-workspace-review.cjs:209–247`, and the passing six-group result
at `.review/knowledge-workspace-final-tags/results.json`. Opened all 12 required
same-named recaptures in `.review/knowledge-workspace-final-tags/captures/` and
all six same-named scale recaptures in its `scale-captures/` directory. All 18
refreshed required captures are valid and show the named settled state. The
extra restart and scale captures were not required or inspected. No additional
defect hunt or detector was performed.

## 3. Material findings

### F1 — P2: Preserve unfinished text while entering tags — resolved

**Initial source:** `src/renderer/components/NoteEditor.tsx:249–262`, especially the
controlled value at line 252 and immediate split/trim/filter at lines 256–260.

**Trigger and impact:** Type `sql,python` in the Note tags input. After the comma,
the change handler produces `['sql']`, and the controlled value becomes `sql`
again. Subsequent letters append to that same tag, producing `sqlpython`.
Likewise, the space in `data engineering` disappears as it is entered, producing
`dataengineering`. Pasting a complete value can work, but ordinary typing cannot
create these intended tags. This is a real metadata-editing failure that the
populated screenshots and existing test groups do not expose.

**Required correction:** Keep the raw input text while the owner edits it;
normalize the saved tag array at a suitable commit point without rewriting
unfinished separators or spaces. Retain the existing tag limits, autosave and
draft recovery. The visual design need not change.

**Acceptance:** Enter two tags by typing, enter a tag containing a space, edit an
existing multi-tag value, and confirm the intended array survives leaving the
note and reopening it. Confirm recovery/export still use the same semantic tags.

**Verdict:** **resolved**. The input now uses an independent `tagText` buffer;
every typed separator and space remains until blur normalizes the display. The
semantic tag array still updates draft storage and autosave. Local draft
restoration also initializes the text buffer. The passing native harness types
`sql,python,data engineering`, checks the raw input and normalized local draft,
saves and reopens it, appends `warehouse` to that existing multi-tag value, and
checks the Markdown mirror and exported backup. The saved array is
`['sql', 'python', 'data engineering', 'warehouse']`. These checks directly cover
the original failure and required editing/persistence acceptance. No visual or
layout change was needed.

## 4. Contract and quality assessment

The first viewport communicates the approved mechanism: folders beside a clear
note list, a bounded top search and quiet creation actions. The writing canvas
keeps formatting contextual, metadata restrained and the title readable. Both
themes preserve the incumbent palette and icon language. Narrow captures wrap
the title and expose Browse notes without crowding the writing surface. The
1440px capture confirms the desktop library at the owner's named width.

The real-record graph occupies the collapsible right panel, with search, type
filtering, zoom, pan, selection and an accessible record-button list in source.
Its dense all-record image reflects the captured 1,804-record fixture; search,
type filtering and selected-neighbor emphasis provide the navigation path. This
review does not claim that every graph density is visually readable unaided.

Sidebar ordering has persistent settings, drag controls and labelled keyboard
alternatives. Review is absent from primary navigation; Settings retains a
Saved reviews link. The original waveform remains visible. Home is protected
from composition changes in this review scope.

Timer E has the intended compact session-card hierarchy and real native
always-on-top, resize, hide, shared pause/resume and 35–100% opacity paths. Its
preferences and bounds persist in the inspected implementation and passing
harness evidence. Interface scale applies through Electron zoom to all windows,
including the sidebar, and older profiles fall back to 100%. The captured 90%
writing, Settings and sidebar-order surfaces remain coherent. A different default
percentage remains an owner choice.

The extension respects the craft floor through restrained copy, genuine content,
Lucide controls, semantic editing, clear search bounds and readable body measure.
No wholesale fidelity failure or speculative aesthetic redesign is justified.
F1 initially prevented a ship verdict because the metadata control was not usable
through ordinary text entry. The verdict pass scores that correction resolved.

## 5. Scope and limitations

This is one initial full review and one subsequent verdict pass limited to F1.
The verdict pass does not reopen the full quality matrix. It is not a
browser replay, a complete accessibility audit, a performance benchmark, or
installed-owner-data acceptance. Native behavior conclusions rely on the supplied
purpose-built harness evidence; the reviewer did not manipulate the native app.
The screenshot matrix demonstrates the captured themes, widths and scale, not
every window size or every scale preference.

Only the knowledge extension, its sidebar/review access changes, native timer E
and optional interface scale were assessed. Home, Statistics and other existing
screens are not redesign targets. Source, data, DESIGN.md and
`.impeccable/design.json` were not modified. Only this review document was written.
No AI capability, editor-engine migration, or 9.9 claim is inferred.
