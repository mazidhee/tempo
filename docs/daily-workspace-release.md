# Tempo 1.6.0 daily workspace

The user chose Daily Plan A: a calm inline list inspired by Things 3. This
release carries that same measured spacing and restrained controls through
Tasks, Journal, Review, Goals and the shared search dialogs. The existing
Electron/React/SQLite stack, Lucide icons, local data location and theme choices
are retained. No short study learning log is added.

## Changes

- Daily Plan supports more than three priorities, inline edits, reordering,
  completion and serialized autosave. Date navigation flushes the captured day;
  unfinished input remains a local draft. Selected study topics stay bounded and
  can start linked focus. Home previews four priorities and links to the rest.
- Tasks use compact actionable rows grouped by date or project. Click the title
  to edit; expand subtasks in place. All original dates, priorities, tags,
  projects, completion and deletion controls remain. Starting focus uses the
  main-process commands and preserves an already running identical link.
- Journal uses the full main workspace with a readable paragraph measure and
  quieter toolbar, 18 px writing text, a helpful empty-page prompt and live local-save status. These refinements apply in normal view. Writing mode hides the sidebar and its spacer without
  changing the saved sidebar preference; Escape restores navigation. The
  existing rich nested daily outlines, folding, search and autosave remain.
- Review shows a seven-day focus-time line chart, readable daily values, a
  compact week navigator and a separate Browse weeks dialog. Recorded session
  dates supply the daily totals; observed zero and unobserved days are distinct.
  Older totals-only snapshots offer Update activity instead of an invented line.
  Reflections stay as per-week local drafts during navigation, and activity
  refresh preserves writing.
- Goals show recorded progress first; New goal and Edit open a focused dialog.
  Linked records use the shared search picker. All four goal types, fractional
  focus hours, archive and restore remain available.
- Search uses one clean input surface, bounded results, quiet metadata and
  keyboard hints throughout. The in-app Markdown guide describes the controls.

## Data compatibility

Migration **206** adds an explicitly unknown daily trend to older weekly review
summaries, preserving their saved totals, timestamps and written reflections.
New snapshots save seven consecutive daily values. Backup import validates their
order and total while continuing to accept older snapshots without a trend.
Unobserved future days are null; an observed day without sessions is zero. Focus
time follows the session's recorded date, so paused elapsed intervals are not
misrepresented as studied time across midnight.

Plans already store arrays in versioned JSON records; this update relaxes the
validation limit from 3 to 1,000 items, including evening completion IDs, local
drafts and backup import validation. Existing records retain their IDs and
content. The cap is an input safety bound, not a recommendation to plan 1,000
daily priorities.

Previous releases remain tagged for source rollback. A 1.6 backup containing
more than three priorities needs 1.6 or later to import; keep a pre-upgrade data
snapshot alongside the older source tag if reverting both code and data.

## Review and release gates

Independent round 1: **8.87/10**, **115/115 tests**, production build and 11/12
runtime groups. Required refinements: functional Writing mode, row-sized charts
and a quiet archive control. All three were implemented. Further checking found
and fixed the browser's inconsistent focus-hours input step.

Round 2 scored **9.20/10** and passed 13/13 actual Electron workflow groups.
The later line-chart and normal-journal requests supersede that acceptance.
Fresh review must reach **9.5 in both design and UX**; final independent review,
exact-package verification and installed owner-data acceptance are pending. See
[the independent report](daily-workspace-review.md) for fresh results.

The Impeccable documenter checked the shipped source patterns and preserved the
incumbent design system. Existing specification drift was reported rather than
turned into new design rules.

## Limits

This UI update does not expand the earlier native Focus Guard certification.
Live UAC, real hosts-file changes and physical notification/audio delivery retain
the limits documented in the user guide. The historical owner-database
discrepancy has no established cause; this release must verify its fresh baseline
separately and must not claim that source tests explain or repair that history.
The existing main renderer bundle still triggers Vite's size warning; the build
passes, and the journal/chart pages remain loaded separately.
