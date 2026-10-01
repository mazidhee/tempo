# Tempo user guide

Tempo keeps your workspace on this computer. Production features work offline;
there is no cloud synchronization. The original Habit Tracker database and
history remain in use. This guide describes the reviewed and installed Windows
1.2.0 release. Acceptance evidence and native verification limits are tracked in
[release readiness](release-readiness.md).

## Move around

Use the sidebar for Home, Plan, Habits, Tasks, Focus, Study, Statistics, Goals,
Review and Settings. Plan and Review also link to Journal. At narrow window sizes,
use the sidebar button to open navigation. Dense calendars and tables may scroll
inside their panels.

| Control | Action |
| --- | --- |
| Ctrl/Cmd+K | Open or close the command palette |
| Ctrl/Cmd+B | Expand/collapse the sidebar or toggle narrow-window navigation |
| Ctrl/Cmd+Shift+P | Toggle habit privacy |
| Up/Down, Home/End in sidebar navigation | Move focus between links |
| Escape | Close a dialog or leave Focus mode |
| Ctrl/Cmd+Shift+F | Global Focus start/resume/pause, using the last preset |
| Ctrl/Cmd+Shift+S | Global skip phase |
| Ctrl/Cmd+Shift+X | Global stop phase |

The last three are configurable defaults in **Settings → Focus**. They work while
Tempo is running, including in the tray. Conflicts appear in that settings section;
leave a shortcut empty to disable it. Strict mode limits pause, skip and stop.

The command palette offers navigation, Focus presets, **Add a task** and journal
search. Selecting a journal match opens its dated entry. Habit privacy masks
sensitive displayed content; it does not encrypt the database or exported files.

## Check habits and manage tasks

Home shows the annual calendar directly below your greeting. Hover or use the
calendar's keyboard controls to inspect a day. Completed work uses a lavender
ramp; freeze days are hatched, and days without due activity remain neutral.

Habits opens to the weekly grid. Open a habit for its detail drawer, history,
notes and editing controls. Today/manage and history views remain available.
Choose Check, Quantity or Avoid and a schedule when creating a habit. Quantity
uses the recorded amount and threshold; Avoid records clean days or slips with a
reason. Freezes protect continuity without counting as completed work, and
vacation pauses remove due activity during the configured period. Past dates lock
at local midnight. See [habit engine rules](habit-engine.md) for schedules,
protection limits and permitted recovery.

Tasks supports quick add and a full editor for due dates, priority, project,
tags and subtasks. Use Today, Upcoming, All or Completed, plus text and priority
filters. Complete or reopen a task from its row; use its Focus action to start
linked work. Replacing an unfinished phase requires confirmation and does not
record that phase as completed.

## Plan and reflect

In **Plan**, choose a date and add up to three priorities from tasks, habits,
Study topics or your own text. Select topics for the day's study plan, then use
**Save plan**. Mark priorities as done when appropriate. Linking a priority does
not itself complete the underlying habit, task or Study topic.

The **Evening reflection** panel accepts a sentence about your day and optional
sleep hours and energy. Use **Save evening reflection** to save it. Journal allows
longer dated entries through **Save journal**, with text search and From/Until
filters. Journal text can also appear in Home calendar tooltips.

In **Review**, choose any day in a week and open that week. Tempo saves a snapshot
of habits, focus, Study, tasks, plans and journal lines. **Refresh activity
snapshot** updates the recorded activity while preserving your written
reflections. Fill in **What got in the way?** and **One change for next week**,
then **Save reflections**. Patterns are labelled correlations, not causes.

Completed weeks are saved automatically after Sunday evening while Tempo is
running, or reconciled when it next runs. In **Settings → Reflection reminders**,
enable morning, evening or weekly notifications, set their times/day and use
**Save reminder settings**. These reminders start disabled, run while Tempo is
open or in the tray, and do not replay missed notifications.

## Focus on one phase

Choose a preset, Focus/Short break/Long break, and an optional task, habit or
Study link. Start the phase; pause/resume, skip or stop using the timer controls.
Stop the current phase before changing its rhythm or link. Presets can be created,
edited and deleted.

The timer runs in the desktop main process and recovers its timestamp state after
restart. Completed phases are recorded once. Skipped or stopped unfinished phases
do not become completed focus time, and the next phase waits for you to start it.
**Focus mode** reduces workspace chrome; **Exit focus mode** or Escape restores it.

Closing the window keeps Tempo in the tray. The tray menu offers presets,
Start/Resume or Pause, Skip phase, Stop, **Open Tempo / Emergency exit** and
**Quit Tempo**. Quit runs Guard cleanup before closing. Phase notifications and
sound follow your settings and Windows notification/audio permissions.

## Optional Focus Guard

Open **Settings → Focus**. Select Messaging, Social, Video or a custom list.
Enter plain website domains, one per line; include each subdomain you use, such
as `www.youtube.com`. **Refresh running app picker** lists eligible apps from
Tempo's own Windows session. Add the apps you want to discourage, choose a mode,
enable Guard, then **Save Focus settings**.

- **Gentle** notifies when a selected app opens.
- **Close app** requests graceful closure, then can force closure. Unsaved work
  in a selected app can be lost.
- Guard normally applies during Focus, remains active while paused, and releases
  during breaks. **Also block during breaks** changes that behavior.
- **Strict mode** requires Emergency exit to end an active phase.

Website blocking requests administrator permission and adds a marked section to
the hosts file. Browser secure DNS can bypass it; the Focus settings panel shows
the relevant browser controls. Guard does not block a phone.

**Emergency exit** is reachable from workspace chrome and the Focus page. Type
`I choose to end this focus` or wait 30 seconds, then choose **End focus**. This
stops the unfinished phase, requests Guard cleanup and records a focus break.
**Repair website blocking** releases Guard for the current phase; a new phase
can activate it again. Startup recovery and Quit also attempt cleanup. Read any
reported Guard error; a failed cleanup is not a confirmed release of blocking.

Current verification covers real Windows PowerShell against isolated hosts and
control files, watchdog cleanup fixtures, identity/session fixtures and read-only
own-session app enumeration. Live UAC, real hosts edits, user-app closure and
physical native notification/sound delivery remain outside the certified evidence.

## Learn with Study and track goals

In **Study**, create a curriculum, then add ordered topics or nested chapters.
Mark a topic learned to schedule review. **Study with focus** links work to Study.
Archive studied topics to retain history; deletion is restricted to unstudied
topics. **Show archived** exposes restore controls.

The review queue offers **Again** (1 calendar day), **Hard** (previous interval
× 1.2), **Good** (× 2) and **Easy** (× 3). Intervals round up and cap at 3,650 days.
This is the confirmed minimal curriculum/topic/progress/review scope. Review
grades reflect your recorded assessment; they are not a validated retention test.

In **Goals**, choose habit frequency over a number of weeks, focus hours by a
date, chapter/curriculum completion or a task count. Select the linked record
and dates, then **Save goal**. Progress and on-track status come from recorded
activity. Archive and restore goals as needed. Statistics provides date-filtered
summaries and **Export sessions** for CSV.

## Appearance, backups and recovery

Settings General offers your greeting name, system/light/dark appearance,
sound/notifications and the existing end-of-day habit reminder. Fonts and Lucide
icons are packaged locally.

1. Use **Settings → General → Export JSON backup** before a major change. Keep
   the downloaded `tempo-backup-YYYY-MM-DD.json` somewhere safe.
2. To restore, use **Import backup**, select the JSON file, read the confirmation,
   then choose **Merge backup**. The picker accepts files up to 20 MB.
3. Check the result message and the affected records. CSV exports are useful for
   analysis; use JSON for a complete workspace backup.

Format 3 includes habits, archived history, logs/pauses, tasks, presets,
preferences, completed sessions, Study, Focus and Reflection. Legacy formats 1/2
remain importable. Import validates before writing, creates a consistent SQLite
safety copy, then merges in one transaction. Existing records and a current timer
take precedence. A pristine workspace restores preferences/presets with an idle
timer and Guard disabled. Linked identifiers are remapped when necessary.

The database stays in the original Electron user-data location as `habits.db`.
Schema/import safety copies are saved alongside it with `.bak` suffixes. Retain
those copies if recovery is needed. Before any manual database recovery, use
**Quit Tempo** and preserve the current database and its companion files. Prefer
the in-app JSON merge when the app can open; do not overwrite a running database.
