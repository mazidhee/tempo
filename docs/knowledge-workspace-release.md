# Tempo 1.9.0 — knowledge workspace

October 8, 2026. Source implementation and release preparation. Installed owner
acceptance remains pending; do not claim this version is installed yet.

Notes A is a folder-first library with a wide rich-text canvas, slash commands,
tags and explicit record links. Notes are retained in SQLite and mirrored as
atomic Markdown files under the local profile's `notes` directory. Conflicting
external Markdown edits are preserved and surfaced; external files are not
automatically imported. Notes and folders join JSON backups; existing local
notes win on an import.

The right graph panel uses real notes, study topics/curricula and work projects.
Edges represent hierarchy and saved references. It supports filtering, searching,
pan/zoom and opening records. Sidebar order is persistent and accessible through
drag or arrow controls. Review leaves the sidebar; saved reviews remain in
Settings. Statistics keeps its metrics and charts. Home source and original
waveform are unchanged.

Floating timer E uses the existing authoritative Focus run. It stays above
other apps, is draggable/resizable, and offers pause/resume, Open Focus, Hide and
35–100% opacity. Hiding it does not stop the session. Windows DPI-aware bounds,
opacity and active runs survive restarts. Settings includes 80–125% whole-app
interface scale, including the sidebar. Existing profiles keep their current
100% until a selection; five scale choices are available in the preview.

Validation: 140/140 tests; production build and Windows installer; six isolated
Electron workflow groups passed on the exact packaged app in
`.review/knowledge-workspace-package-final/results.json`. They cover real
Markdown persistence, backup idempotence, graph navigation, native timer controls,
two restarts and whole-app scale. Sequential tag typing now preserves separators
and spaces through drafts, reopening, Markdown and backup export. The independent
reviewer's sole material finding F1 is resolved (ship verdict on that fix only).
All 18 refreshed required captures are valid; documentation is complete.

Installer: `release/desktop/Habit Tracker Setup 1.9.0.exe`. Fresh owner backup and
two-launch installed acceptance remain pending. The owner confirmed closure, but
Windows still showed the installed app running in the tray; no install or owner
mutation has occurred. Quit from the tray before continuing. Source checkpoint
and release preparation are not installed acceptance.

No new editor dependency or competitor engine was added. Exact Yoopta MIT toolbar
CSS and its notice are retained. No AI, network account or owner-data import.
