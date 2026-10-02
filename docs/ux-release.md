# Tempo 1.4 UX release — October 2, 2026

The release addresses the owner's large study-library, timer responsiveness,
Focus Guard error/partial-failure, collapsed navigation and surface-palette requests.
The Electron/React stack and existing workspace remain in place. Migration 202
adds only the default surface-palette preference to stored productivity settings.

## Delivered behavior

- Plan displays only selected study topics, saves selection changes automatically,
  and launches linked Pomodoro work from each selected row.
- Plan and Focus share searchable, curriculum-filtered, keyboard-operated pickers
  with at most 30 results per page. Focus selection sits above the timer controls.
- Native Guard operations have their own serialized background queue. Timer actions
  return promptly; website permission failures do not suppress selected app checks.
  Friendly notices offer website retry, release repair and bounded diagnostics.
- Queued saves retain newer optimistic edits while native timer/session state stays
  authoritative, including when disk acknowledgements arrive during typing.
- The 76px collapsed sidebar centers all controls. Settings adapts to its available
  pane, including intermediate widths with the expanded application sidebar.
- Tempo, Graphite, Slate, Dusk and Forest are solid surface palettes; light/dark/system
  and six accents remain independent. The offline downloadable guide describes 1.4.

## Review and candidate

Independent review: round 1 **8.62**, round 2 **9.27/10** after the three requested
material improvements. Full breakdown and evidence are in [UX review](ux-update-review.md).
Independent **101/101 tests**, type checking and production build pass.
Real Electron uses all 1,823 imported topics; native tests close only a dedicated
reviewer-owned app and use isolated website fixtures. Actual UAC and owner-app
closure are not automated release claims. Native closure throughput remains slower
than timer actions and is a documented future improvement.

Installer: `release/desktop/Habit Tracker Setup 1.4.0.exe`, 111,994,949 bytes.
SHA256: `45FB100378DB9CD90485EF2AA19CDC52B4369054E852D9843A4361501C36DBED`.
ASAR SHA256: `1E573B34991D8F4AF336773422C12FD99F975C39FBE6ACF3229F6FEDB38B611B`.
Every staged dist/dist-electron file matches the final independently built candidate.

Exact package smoke passed **5/5**; the reviewer checked and recorded each artifact
fingerprint. Installed version **1.4.0** uses the same reviewed ASAR and original
`AppData/Roaming/habit-tracker` path. Final installed task CRUD, renderer refresh,
tray/second-instance restoration, full quit/relaunch, offline navigation, every
original row and exact preferences pass, with no renderer errors and SQLite
integrity OK. Evidence: `.install-check/personal-upgrade-1790940899478/acceptance.json`.

## Data discrepancy and recovery

The first installed restart exposed two valid but divergent historical datasets.
The pre-upgrade copy had older preferences and topic identities; the newer copy
had Mazi/Ochre preferences, more habit/session activity and independently imported
topic IDs. The three outline content hashes matched, but all 1,823 topic IDs
differed. No cause is established; the source/package score does not certify that
discrepancy's cause as fixed. Both consistent backups remain retained:
`.install-check/personal-upgrade-1790939476565/before.db` and
`.install-check/personal-upgrade-1790939824685/before.db`.

The owner explicitly authorized ending the old paused phase. Completed sessions,
tasks and preferences were retained. An additive backup merge recovered the missing
task and older records, but its curriculum identity rules created duplicate topic
copies. Automatic review rejected deleting these additions as destructive. The
safe alternative archives only the three added duplicate curricula, labelled
“Recovery copy”, without deleting any records. Their original 1,823 live topic
identities/progress and original curricula are verified unchanged. The visible
three supplied roadmaps still contain **1,823 active topics**. The earlier empty
SWE curriculum is also retained. “Show archived” reveals the recovery copies.

Archive proof: `.install-check/archived-recovery-1790940812374/archive.json`.
The final merged safety copy is
`.install-check/personal-upgrade-1790940899478/before.db` (4 habits, 1 log, 1 task,
1 completed session, 3 presets, 2 saved reviews; 7 curricula/3,646 total topics,
including the 3 archived recovery curricula/1,823 archived-copy topics).
The final installed check compares every record against this merged safety copy,
including all archived copies and exact current preferences. It proves current
post-recovery persistence, not the initial discrepancy's cause.
