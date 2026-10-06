# Tempo 1.7 habits, Home and Work surfaces

Source documentation for checkpoint `6309c8e`, package version 1.7.0. This is an
ordinary extension of the established Linear/Things 3 app world. `PRODUCT.md`
remains product truth and `DESIGN.md` remains visual authority. This document
captures page behavior and source-derived styles; it is not a final rendered
review, package acceptance or installed owner-data verdict.

## Direction and scope

Habits is **Operate**: direct daily check-ins in a calm compact list. Home's
optional daily thought is **Read**: a centred reading measure with a reflection
link. Work, thought editing and task cleanup are **Operate**. Retain existing
habits, tasks, focus, Study, Plan, Journal, Goals, Review, privacy, analytics and
backups. No Outlook, meeting integration or Microsoft account setup is included.
The proposed new logo was cancelled; the original waveform remains the identity.

These surfaces use incumbent text, border, surface and accent variables rather
than a separate palette. Settings continues to provide solid surface palettes,
independent accents and light/dark/system appearance. Serif text is confined to
the optional Home reading surface and its dated Journal thought. Navigation,
task controls and habit rows retain the app's sans-serif system.

## Habits: Daily rhythm

Today remains the default with Scheduled today / All habits filters, independently
expandable morning, afternoon, evening and anytime sections, non-negotiable
progress, stacking order and collapsed recovery. Weekly and History remain
separate destinations. Check, Quantity and Avoid actions, freezes, pauses,
locking, notes, edit/archive/delete and detail/history flows remain available.

The daily list is centred at a maximum 960px. Rows are transparent, square and
separated by hairlines, with 20px vertical padding. At wide container widths the
grid puts the title first, the streak in a 110px column, actions in up to 300px
and options in 32px. A container query at 760px moves actions to a full-width
second row; it responds to the actual content width when the sidebar expands.

The visible flame SVG accompanies the current streak, a unit label and seven
recent outcome dots. It uses `habitStats` and `dayOutcome` from the central habit
engine. Weekly targets report weeks; other schedules report due occurrences.
The streak link's accessible name includes current and longest counts. A 420ms
scale response occurs only when the current streak increases and is disabled by
`prefers-reduced-motion: reduce`. The visual never invents continuity from
imported event counts.

Avoid slip reasons begin concealed behind View reason and expand below the row
at a 70ch maximum measure; Edit reason remains a separate action. Ordinary
check-in notes currently render in the footer and wrap. Imported history notes
are separately concealed in native details. Preserve these distinctions when
documenting or reviewing long content.

## Home: optional Reading page

Settings → Daily thoughts → Home display offers Varied and personal, Simple
greeting, and Daily Stoic and personal thought. Only the last option uses the
Reading page. The date and Start focusing control sit above centred thought
text. Existing Home widgets, annual activity calendar and study continuity
remain below it.

The reading block has a 900px maximum width and a 64px top margin. Its heading
uses Georgia / Times New Roman / serif, weight 400, a 32–58px viewport-responsive
size, 1.19 line height, balanced wrapping and a 29ch maximum measure. Attribution
and reflection link are 13px supporting text. Below 700px the top margin becomes
44px and the tool row wraps.

Daily thoughts belongs in Settings, with a 780px maximum editing measure. Each
entry has text, attribution, an optional reflection question and active/paused
state. Add, edit, move up/down and pause/resume operate on the local library.
Included entries are original paraphrases explicitly labelled Inspired by,
with optional source-idea links; production rotation itself works offline.

Home selects an active entry using the local calendar date and ordered active
library. A dated snapshot stores text, attribution, prompt, source and identity.
Existing dates retain their snapshot after editing, reordering or pausing the
library. Navigation and restart keep the selected date's content. Home's clock
advances the date at local midnight. A date with no active thought has an empty
reading prompt and a link to Settings.

Reflect on this tonight opens Journal on that date with the thought panel
expanded. The 760px Journal measure displays the stored thought and optional
question separately from writing; it does not insert or overwrite journal text.

## Work and task lifecycle

Work is a sidebar destination with a 940px maximum page measure. Hairline project
rows show open task count and reached milestones; project pages expose purpose,
open work tasks, recorded focus time, milestone progress, next tasks and Plan
today. At widths below 700px headers/forms wrap and the 40px heading becomes 32px.
No sample activity or productivity totals are fabricated.

Projects support create, edit, archive and restore. Show archived reveals archived
projects. A project keeps stable identity when renamed and linked tasks' project
display name updates. Milestones have stable IDs, optional target dates and a
current completion timestamp. Select a milestone title to edit it; completion
can be reopened. Reopening clears its timestamp; this is not an append-only
history of milestone transitions.

Tasks has Personal, Work and Study areas alongside All areas. Work tasks can
link to a specific local project. Project task links open All with both the Work
area and project filter set; new tasks created there inherit that association.
Task focus links carry area/project context. Work totals sum saved focus-session
durations linked to that context, including retained historical session links.
The next-task section shows up to eight active linked tasks.

Tasks adds Archived and Trash views. Default cleanup moves completed or archived
tasks to recoverable Trash after 30 days, measured from the later completion or
archive timestamp. It runs through workspace lifecycle handling, not a promised
background deletion schedule. Settings → Task cleanup can disable this behavior
or change the period to 7, 14, 30, 60, 90, 180 or 365 days. The task editor's Keep
checkbox exempts an item. Restoring sets Keep and clears the corresponding Trash
or archive state; a completed restored task remains completed. Trash restoration
preserves an earlier archive state, so that item appears in Archived until also
restored there.

Manual deletion first moves a task to Trash after confirmation. Deleting an item
already in Trash requires a separate permanent-deletion confirmation. That removes
the task and its completion record; saved focus sessions remain. Cleanup never
permanently purges Trash or modifies habits or project milestones.

## Avoid: recorded event history

Only an existing Avoid habit exposes Recorded events in its detail page. Import
slip history accepts a selected CSV or pasted text with Category, Event,
Occurrence and Note columns. Only Habits / Relapsed rows are selected. Local
`YYYY-MM-DD HH:mm:ss` timestamps, quoted commas/newlines and notes are preserved.
The preview reports selected entries, distinct days and unrelated rows skipped;
the result reports inserted entries, duplicates and skipped rows.

The separate event table retains multiple distinct occurrences on one day.
Identical timestamp/note/source entries for the same habit are skipped on
reimport. Selected invalid rows abort the import. Limits are 5 MB input, 20,000
selected events per import and 10,000 characters per event note. The import
creates a local database safety copy before its transaction.

The 220px chart plots monthly counts with the chosen accent, integer axis and no
line animation. Missing months between the first and last record display zero
recorded events, which does not establish clean days. Its accessible description
lists the monthly counts. Timestamped history is newest first, initially ten
entries with Show more adding 25; notes expand independently.

Imported events do not rewrite daily habit logs, streaks, locking or heatmaps.
Unknown dates remain unclassified. Format 3 JSON backup includes the event table
and merges it using remapped habit IDs; the existing backup format remains
compatible with earlier exports where this field is absent.

## Migration and evidence map

| Implementation | Source |
| --- | --- |
| Daily rows, SVG and collapsed slip reasons | `src/renderer/components/HabitCard.tsx`, `HabitStreak.tsx`, `HabitAction.tsx`; `src/renderer/pages/Today.tsx`; `src/renderer/styles/habit-daily.css` |
| Reading page and library | `src/renderer/components/HomeThought.tsx`, `ThoughtSettings.tsx`; `src/renderer/pages/Home.tsx`; `src/shared/thoughts.ts`; `src/renderer/styles/daily-thought.css` |
| Dated reflection link | `src/renderer/modules/reflection/Journal.tsx` |
| Work and task controls | `src/renderer/pages/Work.tsx`, `Tasks.tsx`; `src/renderer/components/TaskSettings.tsx`; `src/shared/taskLifecycle.ts`; `src/renderer/styles/work-page.css` |
| Imported Avoid record | `src/renderer/components/HabitEventHistory.tsx`; `src/renderer/pages/HabitDetail.tsx`; `src/shared/habitEvents.ts`; `src/renderer/styles/habit-events.css` |
| 207 thoughts, 208 task lifecycle, 209 work projects | `src/main/database/personalWorkspaceMigration.ts` |
| 210 timestamped habit events | `src/main/database/habitEventMigration.ts` |
| Batch safety snapshot / atomic versions | `src/main/database/migrationRegistry.ts` |
| Export, validation and mapped merge | `src/main/ipc/backup.ts` |

## Pre-existing authority drift and release limits

The requested `.impeccable/design.json` sidecar is absent at this checkpoint.
Root `DESIGN.md` still contains imported Linear marketing language, proprietary
font names, a dark-only description and compressed frontmatter, followed by
October 3 app refinements. The actual app has local Inter, light/dark themes,
solid palette/accent choices and desktop-specific controls. The existing
`.impeccable/surfaces/src-renderer-app-tsx.md` is still a Foundation-era shell
brief. These are recorded drift, not authority to replace the chosen world.
Root authority, sidecar and existing surface files are untouched by this docs pass.

Final independent design/UX review, current package validation and installed
owner-data acceptance remain pending. This source inspection used no owner data
and establishes no final score or native/installed verification claim. Release
evidence must cover actual Electron interactions, narrow/medium content widths,
expanded/collapsed sidebar, themes, keyboard access, long text and reduced motion.
