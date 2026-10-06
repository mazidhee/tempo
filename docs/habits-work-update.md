# Tempo 1.7 working brief

The installed baseline is Tempo 1.6.0, tag `tempo-1.6.0`. New work is on
`codex/habits-work-1.7`. Do not overwrite owner data with older fixture snapshots.

## Confirmed direction

- Habits: A, Daily rhythm. Calm daily list, visible SVG streak, direct check-in;
  completed habits and recovery stay compact. Retain time-of-day sections,
  stacking, non-negotiables, all habit types, one weekly view and history.
- Logo: A, Continuity. An original open circle and check. Apply to shell,
  installer and desktop icon; retain meaningful dynamic tray timer indication.
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

## Proposed additive data changes

Use numbered migrations after 206. Each migration gets a safety snapshot and
must be idempotent under the existing registry.

1. Local thought library and dated selections; preserve existing greeting choice
   and all productivity records. Backup includes library and dated selections.
2. Task area, archived/trash timestamps, Keep flag and retention preferences.
   Old tasks are Personal and preserve their IDs, subtasks and completion dates.
   Cleanup moves records, it does not remove them or rewrite focus links.
3. Local work projects and milestone identities, dates and completion history.
   Existing projects on tasks remain available. No calendar account access.

No Microsoft registration or sign-in is required under the revised scope.

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

## Interim evidence

118 tests and production build passed before the newest correction. Reviewer
confirmed stable Home after navigation/reload and preserved slip reason editing.
Reviewer caught medium-width title squeeze at 800px with expanded sidebar;
changed responsiveness to the actual habit container width. This correction
still needs a new real-app run. No new installer has been applied.
