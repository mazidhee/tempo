# Restyle handoff

Stage C implements the authorized Linear restyle on Foundation `33f3c19`, with the integrator's Tailwind 4 utility and accessible hover fixes included. DESIGN.md remains the visual authority. No dependencies, main-process data stores or production user data were changed.

## Implemented

- Official collapsible shadcn Sidebar, Ctrl/Cmd+B, mobile sheet, arrow-key navigation, compact titlebar and window controls that fit 390px. Local Inter/JetBrains Mono remain bundled. Shared Sonner Toaster is mounted once.
- Home greeting and canonical collective annual heatmap immediately below it. Due denominators, missed habits, hatched freezes and neutral days come from the existing engine. Tooltips accept optional `journal: Record<string,string>`; privacy masks names and journal content. Heatmap keyboard navigation is preserved; narrow calendars begin at the recent end.
- Registry Home slots render module contributions or clear placeholders. Existing habit/task/focus summaries and actions remain.
- Habits opens to the weekly dot grid. Detail Sheet contains the full canonical habit detail, editing, current check-ins, annual history, protection, recent recovery and prospective pause controls. Today/manage, weekly and history routes remain available; quantity/Avoid/notes/schedules/stacks/non-negotiables use unchanged engine components.
- Tasks uses installed TanStack Table v9 `useTable`/feature declarations. Quick add, four views, project/tag search, completion/reopen, edit/delete confirmation, subtasks and linked focus are retained.
- Statistics uses shadcn Chart on Recharts 3, with canonical habit rates/streaks, period/date filters, group totals, CSV export and legacy advanced analytics. Curriculum focus grouping uses `Link.curriculumId`.
- Study provides curriculum/topic create/edit, hierarchy/order, learned state, radial/bar progress, archive/restore, guarded deletion of unstudied topics, linked focus and due review grades. Studied topics are archived to preserve history. Grades follow the existing transparent calendar scheduler.
- Settings renders module registry sections alongside all existing General controls, themes, notifications, backups/CSV and keyboard/icon information. cmdk palette supports navigation, focus presets and adding tasks.
- Removed obsolete sidebar/brand/navigation/command CSS; replaced stray literal colours and shadows with shared tokens. Portalled legacy dialog actions and privacy inherit the global styles.

## Verification

- Typecheck and production build passed. Existing 40 logic tests passed.
- Actual Electron smoke: `scripts/restyle-smoke.cjs`; isolated directory `.review/restyle-1790857283474`. No production data was opened or edited.
- Real clicks cover habit Sheet + nested edit dialog, Today/manage, task quick-add/completion/reopen/edit/subtasks, Study curriculum/topic creation/learning/archive/restore, all four grade controls, command-palette add, Ctrl+B, persistence after renderer reload and compact window controls.
- All four grades use a deliberately synthetic due-date fixture in the isolated SQLite database so the real queue controls can be tested today. Records are never represented as the owner's activity.
- Six owned pages captured in dark/light at 1280×860 and 390×860: 24 PNGs plus four contact sheets in that directory. `result.json` records zero renderer errors and zero HTTP requests.
- The screenshot batch showed a narrow Study title being squeezed by metadata/actions. The final correction gives the title its own row. Obsolete CSS cleanup, Toaster mount and this correction occurred after the screenshot batch; the final build passed, and the independent integrated review must recapture them.
- Impeccable launcher could not initialize its global cache under the sandbox. PRODUCT.md, DESIGN.md, new-work and craft-floor were read directly per its documented fallback. No detector/finish-review score is claimed here; integration owns the required independent reviewer.

## Integration hooks

1. B's registry contributions render automatically in Home. Root should fetch `journal:lookupDates(Object.keys(details))` and pass the resulting map as Home's `journal` prop (or add a typed wrapper after Reflection contracts merge).
2. Root should add the Journal search command group using B's `journal:search` and route. C does not copy B's augmentation into this branch.
3. Statistics leaves `data-focus-break-slot` for A's typed event summary. Root should mount the global `FocusEmergency` in compact topbar chrome after A merges.
4. A's provider compatibility adapter receives existing configure/start requests from Home, Tasks, Study and cmdk. Study links use `curriculumId`. Root should verify these flows against main-owned timing after merge.
5. `habitDataChanged()` now emits `workspace-data-changed` after the canonical habit API write. A should emit that event after successful productivity saves, allowing B's computed widgets/goals to refresh.
6. Root owns registry merge resolution, new-module backup coverage, packaged release validation and the independent score/fix loop. Keep compatibility routes `/weekly`, `/history`, `/habits/:id`, `/analytics`, and new `/habits/today`.

All reused component/library sources and licences are already recorded in `docs/component-sources.md`; Stage C installs no additional resources.
