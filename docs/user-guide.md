# Tempo user guide

Tempo keeps your workspace on this computer. Production features work offline;
online backup is optional and only runs when you choose it. The original Habit Tracker database and
history remain in use. This guide covers the Windows 1.5 study and daily workspace update.
Acceptance evidence and native verification limits are tracked in
[release readiness](release-readiness.md).

## Move around

For a first visit: set your name in **Settings → General**, import your outlines
in **Study → Import roadmaps**, open its curriculum page, select a topic, and choose **Track time** in its options. When you finish,
choose **Save and stop**. Your time appears beside the topic and all its parents.
Use **Statistics → Time explorer** to see the calendar and study-time sunburst.
The entire guide is available in **Settings → User guide**, with a `.md` download.

Use the sidebar for Home, Plan, Habits, Tasks, Focus, Study, Statistics, Goals,
Journal, Review and Settings. Each has its own page; contextual links connect your records. At narrow window sizes,
use the sidebar button to open navigation. Dense calendars and tables may scroll
inside their panels.

| Control                                 | Action                                                         |
| --------------------------------------- | -------------------------------------------------------------- |
| Ctrl/Cmd+K                              | Open or close the command palette                              |
| Ctrl/Cmd+B                              | Expand/collapse the sidebar or toggle narrow-window navigation |
| Ctrl/Cmd+Shift+P                        | Toggle habit privacy                                           |
| Up/Down, Home/End in sidebar navigation | Move focus between links                                       |
| Escape                                  | Close a dialog or leave Focus mode                             |
| Ctrl/Cmd+Shift+F                        | Global Focus start/resume/pause, using the last preset         |
| Ctrl/Cmd+Shift+S                        | Global skip phase                                              |
| Ctrl/Cmd+Shift+X                        | Global stop phase                                              |

The last three are configurable defaults in **Settings → Focus**. They work while
Tempo is running, including in the tray. Conflicts appear in that settings section;
leave a shortcut empty to disable it. Strict mode limits pause, skip and stop.

The command palette offers navigation, Focus presets, **Add a task** and journal
search. Selecting a journal match opens its dated entry. Habit privacy masks
sensitive displayed content; it does not encrypt the database or exported files.

## Check habits and manage tasks

Home shows the annual calendar directly below your greeting. Hover or use the
calendar's keyboard controls to inspect a day. Completed work uses your chosen accent
ramp; freeze days are hatched, and days without due activity remain neutral.

Habits opens to Today. Check habits complete with one click; notes have their own button.
Time-of-day sections expand independently. Recovery is collapsed below the daily list.
Weekly and History are separate views. Open a habit for details or use its options
to edit/archive. Delete is available on the row and detail page, with confirmation
and a local safety copy before permanent removal.
Choose Check, Quantity or Avoid and a schedule when creating a habit. Quantity
uses the recorded amount and threshold; Avoid records clean days or slips with a
reason. Freezes protect continuity without counting as completed work, and
vacation pauses remove due activity during the configured period. Past dates lock
at local midnight. See [habit engine rules](habit-engine.md) for schedules,
protection limits and permitted recovery.

Tasks supports quick add and a full editor for due dates, priority, project,
tags and subtasks. Use Today, Upcoming, All or Completed, plus text and priority
filters. Complete or reopen a task from its row; use its Focus action to start
linked work. Replacing unfinished Pomodoro work requires confirmation and does
not record that phase as completed. Replacing tracked work saves its elapsed
time before switching to the new task or habit.

## Plan and reflect

In **Plan**, choose a date and add up to three priorities from tasks, habits,
Study topics or your own text. **Add study topic** opens a searchable picker:
type words from a topic or its parent, filter by curriculum, then select a result.
Only 30 results appear at a time; use Previous/Next or narrow your search.
Arrow keys and Enter select a result; Escape closes the picker.
Only your selected topics appear in today's compact study list. Adding or removing
a study topic saves the selection automatically. Choose its **Start focus** button
to launch a linked Pomodoro; an existing active phase opens instead of being replaced.
Use **Save priorities** to save priority edits. Mark priorities as done when appropriate. Linking a priority does
not itself complete the underlying habit, task or Study topic.

**Close the day** keeps optional sleep and energy separate from your writing.
Open **Journal** for a full dated page: headings, bold/italic, lists, quotations and
code blocks, with optional serif reading typography. Changes save locally after a
short pause, and **Ctrl/Cmd+S** saves immediately. A local draft protects unfinished
writing during an interrupted save. Find a memory supports words and date ranges.
Old journal lines remain intact and searchable. Journal text also appears in Home
calendar tooltips. Evening saves preserve your rich journal formatting.

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
Study link using the searchable **Working on** control above the timer. Search and
curriculum filters keep large roadmaps manageable. Start the phase; pause/resume,
skip or stop using the timer controls. Buttons wait briefly for an acknowledgement
to prevent duplicate actions; background Guard work does not delay timer controls.
Stop the current phase before changing its rhythm or link. Presets can be created,
edited and deleted.

The timer runs in the desktop main process and recovers its timestamp state after
restart. Completed phases are recorded once. Skipped or stopped unfinished phases
do not become completed focus time, and the next phase waits for you to start it.
**Focus mode** reduces workspace chrome; **Exit focus mode** or Escape restores it.

Choose **Time tracking** for an open-ended session that counts up instead of ending
at a preset duration. Pause/resume excludes paused time. **Save and stop** records
the elapsed attention once; a refresh or app restart preserves it. Time is recorded
when you save, and appears in the same history as completed Pomodoro focus phases.
Use Pomodoro for structured breaks and Track for flexible study blocks.

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
If you cancel website permission, selected app checks continue independently.
Choose **Retry websites** in the concise Guard notice when ready to approve the
Windows prompt. Detailed diagnostics are available in an expandable section.
**Gentle** only notifies; choose **Close app** to enforce app closure.

**Emergency exit** is reachable from workspace chrome and the Focus page. Type
`I choose to end this focus` or wait 30 seconds, then choose **End focus**. This
stops the unfinished phase, requests Guard cleanup and records a focus break.
**Repair website blocking** releases Guard for the current phase; a new phase
can activate it again. Startup recovery and Quit also attempt cleanup. Read any
reported Guard error; a failed cleanup is not a confirmed release of blocking.

Current verification covers real Windows PowerShell against isolated hosts and
control files, watchdog cleanup fixtures, identity/session fixtures and actual
closure of a dedicated test app in Tempo's Windows session, including when website
permission fails. Live UAC, real hosts edits, owner-app closure and
physical native notification/sound delivery remain outside the certified evidence.

## Learn with Study and track goals

**Import roadmaps** includes the three outlines you supplied: Software engineering,
Mathematics, and Economics & markets. Preview and select any or all of them, or
paste/upload another Markdown outline. Headings become parent topics; indented
checklists become children. `[x]` items retain their learned state. Resource prose
is retained in the original imported source, rather than turned into extra tasks.
An identical title and outline reopens its existing curriculum without duplicating
topics or replacing your progress. Changed outlines import as a new curriculum.

Curricula initially show top-level branches. Expand one branch, **Expand all**,
or search for a topic; search reveals matching descendants and their ancestors.
**Track** starts count-up time and the timer icon starts a Pomodoro. A topic's
recorded time includes its own sessions and every descendant's sessions; curriculum
time counts each session once. Checking a topic keeps all its time. Archive a
studied topic to preserve its records. Checking children does not automatically
check the parent: mark the parent when you consider the whole topic learned.

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

## Explore and correct your time

Open **Statistics → Time explorer** or **Study → View study time**. The weekly
calendar shows your entries in local time. Use previous/next week, **This week**,
or **Session list** to find an entry. Curriculum and date filters also update the
sunburst below. The calendar can scroll within its panel on a small window.

Choose **Add session** for work you forgot to time: enter start, end, an optional
task/habit/study topic, and a note. Click a calendar entry or its pencil to edit it.
Changing start/end records the full new interval; editing only its link or note
preserves the original recorded duration, excluding pauses. Overlapping entries
require an explicit confirmation before they count. Delete removes its time from
all totals. Daily statistics use the entry's end date, even across midnight.

The sunburst's inner ring shows curricula and the outer rings show nested topics.
Select a slice or list row to drill deeper; the breadcrumbs return to a parent.
Direct study on a parent has a separate slice so children never double-count it.
Archived topics remain included. Entries whose old topics are no longer present
appear under **Unassigned study**. The calendar spans a session's start/end;
recorded duration excludes timer pauses and may therefore be shorter than its span.

## Appearance, backups and recovery

Settings General offers your greeting name, system/light/dark appearance,
sound/notifications and the existing end-of-day habit reminder. Fonts and Lucide
icons are packaged locally.
Choose a separate solid surface palette: **Tempo, Graphite, Slate, Dusk or Forest**.
Graphite uses warm charcoal; Slate cool mineral surfaces; Dusk subtle plum tones;
Forest deep green. Each supports light and dark appearance, independently of your
accent. Previews show dark mode; choose **Dark** for the dark surfaces or **System**
to follow Windows. These palettes use no gradients.

Choose a solid accent: **Lavender, Cedar, Terracotta, Mulberry, Ochre or Petrol**.
It applies to actions, charts and calendars in either theme. Upload a local JPG,
PNG or WebP profile photo; Tempo crops it square and saves a small local copy in
preferences and JSON backups. **Remove profile photo** restores your initials.
Home greetings can mix friendly prompts, humour and explained language greetings,
or use the simple time-of-day option. No online service generates them.

If habit names look blurred, check the eye icon in the top bar or press
**Ctrl/Cmd+Shift+P**. This is Privacy mode for screen sharing; toggling it restores
names immediately. Privacy mode does not change the underlying habit data.

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

## Continue studying

Study opens as a library. Each curriculum has a dedicated page with chapter
breadcrumbs, searchable topics, progress, recorded time and due reviews. Select a
chapter to drill down; a topic opens its details and Start focus control. Large
collections show 30 results per page. Archives remain available through Show archived.

Turn on **Current study focus** for SWE and Mathematics; keep finance ready in the
library for later. **Edit curriculum** lets you set an optional focus-until date.
Choose **Make current topic** on an unfinished leaf to pin where you are working.
Home shows those subjects, the current topic, last recorded study and the next
unfinished topic. Start focus resumes the existing linked phase or starts a new
Pomodoro. Changing to a different active topic asks before replacing unfinished work.
No session learning log is required.

Use **Add cover** on a curriculum page to choose a local JPEG, PNG or WebP under
10 MB. Tempo crops it to a banner and stores the image in your local database;
it is included in complete backups. Change or remove it whenever you like.

## Back up to another computer

Open **Settings → Backups**. Daily local snapshots are automatic; **Save local
snapshot now** captures your latest edits. Preview a snapshot before merging.
Merging adds missing records and preserves existing records, preferences and an
active timer; it is not a rewind of existing edits.

For GitHub, save `mazidhee/tempo` as the connection. Use your existing Git sign-in,
or a fine-grained token limited to this private repository with Contents read/write.
Choose **Back up to GitHub**, enter and confirm a password of at least 12 characters,
then encrypt/upload. Nothing uploads until you explicitly choose that action.
Keep the password safely outside GitHub. A forgotten password cannot be recovered.

On another computer, install/build Tempo, download the desired `.tempo-backup`
file from the `tempo-backups` branch, then **Restore encrypted file**. Unlock it,
review the record counts and merge. Tokens and your backup password are never
part of your exported workspace. The source repository does not contain your data.

## Daily outlines

New journal days begin with a bullet block, like Logseq. Press Enter for another block, Tab to indent under the previous block, and Shift+Tab to move back out. Click a parent bullet to fold or expand its children; Ctrl+Shift+. also toggles folding. Folded text stays saved and searchable. The toolbar still supports headings, bold, lists, quotes and code. Add a block continues the outline at the end. Existing prose entries keep their formatting.

Recent daily pages appear below the current journal. Expand one to write directly into that day; only one previous editor is open at a time. All journal edits autosave locally.

Plan drafts stay on this device when switching dates or pages, including unfinished priority text, sleep and energy. Use Save priorities to include priorities in database backups; use Save evening reflection for sleep and energy.

Once a curriculum has a cover, its small corner controls fade back until you hover or use the keyboard. The image icon changes the cover and the cross removes it.
