# Tempo 1.7 working brief

The installed baseline is Tempo 1.6.0, tag `tempo-1.6.0`. New work is on
`codex/habits-work-1.7`. Do not overwrite owner data with older fixture snapshots.

## Confirmed direction

- Habits: A, Daily rhythm. Calm daily list, visible SVG streak, direct check-in;
  completed habits and recovery stay compact. Retain time-of-day sections,
  stacking, non-negotiables, all habit types, one weekly view and history.
- Logo: the user cancelled the proposed open-circle/check replacement. Retain
  the original waveform in the shell, installer and desktop icon, with meaningful
  dynamic tray timer indication.
- Home: user chose B, Reading page, from five interactive options. Centred serif
  text and generous space; the thought library belongs in Settings, not Home.
- Greetings: mixed choice stays fixed per local day/time-of-day period, including
  navigation and restart. Simple greeting remains. Stoic mode is optional.
- Thought library: Stoic reflections plus self-authored thoughts. Add, edit,
  reorder and pause. A day's selected text/attribution/prompt is snapshotted so
  library edits cannot change that day's reflection. Local midnight advances it.
  Journal opens on the corresponding date without overwriting existing writing.
- Work and Personal share tasks/focus/Plan. User subsequently cancelled Outlook
  and meeting integration: leave events in the existing calendar. Build local
  work projects, milestones and linked work tasks instead.
- Completed or archived tasks move to recoverable Trash after 30 days. Per-task
  Keep, configurable retention and restore. No automatic permanent purge.
  Linked historical sessions/statistics and habit data must remain intact.

## Implemented additive data changes

Migrations 207–210 are registered after 206. The registry creates one consistent
SQLite safety snapshot before a pending batch and applies each migration in its
own transaction. Already recorded versions are skipped on subsequent launches.

1. **207 — Local daily thoughts and immutable dated selections.** Local thought
   library and dated selections; preserve existing greeting choice
   and all productivity records. Backup includes library and dated selections.
2. **208 — Task areas and recoverable retention.** Task area, archived/trash
   timestamps, Keep flag and retention preferences.
   Old tasks are Personal and preserve their IDs, subtasks and completion dates.
   Cleanup moves records, it does not remove them or rewrite focus links.
3. **209 — Local work projects and milestones.** Local project and milestone
   identities, target dates and current completion timestamps.
   Existing projects on tasks remain available. No calendar account access.
4. **210 — Timestamped imported habit events.** A separate `habit_events` table
   retains local timestamps, notes, source and import time for CSV Habits /
   Relapsed rows associated with an existing Avoid habit. Multiple distinct
   same-day events remain separate. Identical timestamp/note/source entries for
   that habit are deduplicated. JSON backups export and restore these events with
   remapped habit IDs. Import creates a safety copy and writes transactionally.
   Monthly counts describe only the imported record; unknown days remain
   unclassified and daily check-ins, streak calculations and heatmaps are unchanged.

No Microsoft registration or sign-in is required under the revised scope.

## Implemented surfaces

The app keeps its established Linear/Things 3 adaptation. The source now contains
the Daily rhythm habit rows, optional centred serif Reading page, thought library
in Settings, local Work pages, area/project task filters, recoverable Trash and
Avoid event import/history. See [surface design and behavior](habits-work-design.md)
for observed dimensions, source evidence and remaining documentation drift.

Avoid slip reasons expand beneath the habit row and imported event notes use
collapsed details. Ordinary check-in notes still appear in the row footer; do not
describe every kind of note as concealed. Work milestones hold their current
completion timestamp; reopening clears it rather than creating an audit trail.

## Validation

Unit coverage: local-day/period boundaries, thought rotation and immutable day
snapshots, custom-entry validation, migration preservation, retention/Keep/
restore, project/milestone validation and backup merge.

Independent reviewer must launch actual Electron with isolated fixtures and
click through check-ins, long notes, quantity/avoid/freeze, thought editor,
dated reflection, Work filters and task Trash. Test small and medium content
widths with the sidebar expanded/collapsed, theme contrast and reduced motion.
Final design and UX must each reach the user's 9.5 gate. Source checks, package
checks and separate installed owner-data acceptance are distinct claims.

## Evidence status

Source inspected at checkpoint `6309c8e` with package version 1.7.0. This brief
records implementation, not a final review or installed-release pass. Earlier
118-test/build evidence predates subsequent corrections and migration 210; it
must not be used as acceptance evidence for the current checkpoint. Final
independent Electron review, current package checks and separate installed
owner-data acceptance remain distinct pending gates. Documentation work does
not read or modify the owner's database.
