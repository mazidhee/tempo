# Tempo personal workspace 1.3.0

Installed on 1 October 2026. Tempo is open and responding at
`C:/Users/USER/AppData/Local/Programs/Tempo/Habit Tracker.exe`; the existing
`C:/Users/USER/Desktop/Tempo.lnk` shows the running window. Application identity
and `C:/Users/USER/AppData/Roaming/habit-tracker` remain unchanged.

## Delivered

- Larger, bold, responsive Home greeting, with the annual habit calendar next.
- Bulk Markdown curriculum import, nested headings/checklists, learned state,
  original source provenance and LF/CRLF idempotence.
- Topic-linked count-up tracking and Pomodoro, cumulative subtopic/ancestor/
  curriculum time, a weekly calendar, manual session CRUD and an interactive
  curriculum/topic sunburst in Statistics → Time explorer.
- Six solid accent choices, a local thumbnail profile photo, varied or simple
  greetings, and the offline Markdown guide in Settings.
- Existing habits, schedules, freezes, privacy, tasks, Focus, planning, journal,
  goals, reviews, backups and statistics retained. No new dependency is added.
  Existing Lucide icons remain consistent.

Migration 201 adds import provenance and appearance defaults without removing
records. It joins the recorded versions 2/3/4/100/200. The installed package
uses source commit `3420fa94a2fb0a07c997b9ff38c2f397cdc3e6ea`; later release
documentation/harness edits do not change its ASAR.

## Review and validation

Independent reviewer [report](personal-update-review.md):

| Round | Score | Resolved                                                                                                       |
| ----- | ----- | -------------------------------------------------------------------------------------------------------------- |
| 1     | 8.93  | Calendar initial position, explicit tracking save action, mode footer, greeting selector and compact guide row |
| 2     | 8.95  | Larger greeting reflow at narrow width                                                                         |
| 3     | 9.27  | Eight corrected Home variants confirmed                                                                        |
| 4     | 9.27  | Windows newline import identity independently verified                                                         |

Final rubric: completeness 9.3, correctness 9.5, design 9.2, code 9.0,
UX/accessibility 9.2; weights 20/25/25/15/15. Production build and 95/95 tests
pass. Full real-Electron regression: 39/39. Exact package smoke: 5/5, including
bundled import, source repetition, guide/accent, visible tracking save and
actual packaged restart. Evidence:
`.review/personal-update-review-1790886029524/`.

| Artifact                                                  | SHA256                                                             |
| --------------------------------------------------------- | ------------------------------------------------------------------ |
| Installer `release/desktop/Habit Tracker Setup 1.3.0.exe` | `913B810F092F3B73E6FD713931DB9E42ADD815F3B90FB3DF1D63F2F06B1F6025` |
| Packaged executable                                       | `E7790820B919D91620BE83364233FBF9E45858E1A7DD7D2DF520DAE3717A5310` |
| Packaged and installed ASAR                               | `E975A77A8F2807E51DCEF32ABB61FB152FB0608A10437F09F54261C0655212A4` |

## Installed data and recovery evidence

Initial installation verification saw conflicting stored states. The independent
read-only investigation confirmed the different snapshots, valid SQLite
integrity and empty WAL files. Its cause remains unexplained; no production
defect or external cause has been established. No claim of zero bugs or a causal
fix is made. The report retains that finding rather than replacing it with the
later successful checks.

Original records were recovered from the consistent retained safety copy using
the app's non-destructive backup merge. Two historical weekly review summaries
were subsequently restored exactly after another safety copy and checks that
their user notes/edited timestamps had not changed. Current preferences were
kept, including the saved Petrol accent and local profile photo. Compared to
the older snapshot, accent/avatar/name/theme/sound/notification fields differ;
those current settings are explicitly excluded from historical equality.

The installed app then passed repeated quit/reopen checks with four curricula,
1,823 topics and three import records. Temporary tasks survived refresh and
relaunch and were removed. Tray close, second-instance show/minimized restore
and all core pages offline passed during those runs. Harness corrections use
real primary keys and explicit asynchronous polling. Final read-only preservation
is `.install-check/personal-upgrade-1790886925971/preservation.json`: all original
activity/module rows match, all six migrations are present and integrity is OK.
It does not falsely label current settings as identical to the older snapshot.

| Imported curriculum  | Topics | Original learned items retained |
| -------------------- | -----: | ------------------------------: |
| Software engineering |    984 |                               0 |
| Mathematics          |    483 |                               6 |
| Economics & markets  |    356 |                               1 |

Current counts: one habit, one task, three presets, zero recorded sessions,
the earlier SWE curriculum plus the three imports, and two saved weekly reviews.
Counts are a release snapshot, not restrictions on later owner activity.

Safety copies retained locally:

- Original record recovery source:
  `.install-check/personal-upgrade-1790886925971/before.db`.
- Before non-destructive recovery:
  `.install-check/personal-recovery-1790887353167/before-recovery.db`.
- Before exact weekly-summary recovery:
  `.install-check/personal-recovery-1790887704808/before-review-recovery.db`.
- Final complete loaded workspace:
  `.install-check/personal-upgrade-1790889846959/before.db` and `baseline.json`.

Use Settings → Data → Export JSON for an ordinary portable backup; retain these
SQLite safety files as recovery evidence. The [user guide](user-guide.md)
describes import/export and the new Study/Focus/Statistics flow. Live native
Guard elevation/hosts/app closure and physical sound/notification delivery are
unchanged and retain the earlier release's explicit verification limits.
