# Master build: Linear design system + Focus Guard + Reflection layer

Context: our Electron productivity app (Electron + React + TypeScript + better-sqlite3 + Tailwind + Recharts + date-fns). Phases 1-2 (habit engine, study system) are already merged. Keep ALL existing features and data. Every schema change is a versioned migration. My OS: [WINDOWS / MAC / LINUX]. Design source of truth: DESIGN.md in the repo root (Linear's design system).

## Orchestration
If you can spawn sub-agents, run 3 stages. If not, run the same stages in order: 0, A, B, C, then 2.
- Stage 0 (one agent, alone, merged to main first): Foundation.
- Stage 1 (parallel, each in its own git worktree/branch): Agent A (Focus), Agent B (Reflection), Agent C (Restyle).
- Stage 2: Integration agent, then an independent Reviewer loop.
Do not start Stage 1 until Stage 0 is merged, so everyone builds on the same tokens and component kit.

Rules for every agent:
- Edit only the files/folders you own. Shared files (nav, routes, settings sections, IPC index, preload, migrations index) get additive one-line registry entries only.
- No hardcoded colours or sizes. Use tokens.
- FREE resources only (see Stage 0). If an install needs a token/subscription, skip it.
- Run tests before handing back. Commit small.

## STAGE 0: Foundation (design system + contracts)

### Source of truth
Read DESIGN.md fully. Generate design tokens (CSS variables + Tailwind theme) from it: colours, type, radii, spacing, surface ladder, hairlines.

### Adapting a marketing spec to a desktop app
- USE: colour tokens; surface ladder (canvas > surface-1..4) with hairline borders instead of shadows; the single lavender accent (#5e6ad2) only for focus rings, primary buttons and the brand mark; button/input/tab/badge/card styles; 8px/12px radii; 4px spacing base.
- SKIP: pricing/testimonial/logo/CTA/changelog/footer components and the 56-80px display sizes. Scale type to app density (13-14px base, 12px captions, 20-28px page titles) keeping the negative-tracking logic.
- KEEP THE RULES: no second chromatic accent, no decorative gradients/glows/spotlight cards, hierarchy through surface lift + hairlines.
- Fonts: bundle Inter (variable) and JetBrains Mono locally via @fontsource (offline-first, no CDN). tabular-nums for timer, stats and numbers.
- Light mode: the spec is dark-only. Dark is default and follows the spec exactly. Derive a light theme from the inverse tokens (#ffffff canvas, #f5f6f6/#f6f7f7 surfaces, near-black ink, light hairlines) with the same accent. Follow system setting with manual override. Mark every derived token "derived" in the tokens file.
- Derive minimal danger/warning tokens (flagged derived). The only other colour allowed is the spec's success green.
- Heatmaps use a lavender ramp, not GitHub green. Freeze/skip days hatched; not-due days empty.

### Free resources only
- Never use the shadcn.io MCP, Pro blocks, Pro templates, or anything needing a token/subscription (401/403 = Pro: skip).
- Use: official shadcn/ui (components, sidebar/dashboard/chart blocks) via `npx shadcn@latest add`; shadcn.io free patterns, charts, themes, easings, hooks (copy code in); 21st.dev community components; free libraries (motion, Magic UI, sonner, cmdk, vaul, TanStack Table, react-hook-form + zod, react-activity-calendar). Record each licence (MIT or similar).
- Adapt Next.js-only code to Vite + React + Electron (remove "use client", next/link, next/image, App Router assumptions).
- Icons: one set (Lucide), consistent size and stroke. Show me a preview of the sidebar icons.
- Post the list of picks (what, source, licence) BEFORE installing.

### Component families (best-looking free variant of each, restyled to tokens)
1 Sidebar (official shadcn block, collapsible to icons) | 2 Command palette (cmdk, Ctrl/Cmd+K) | 3 Data table (TanStack) | 4 Charts (shadcn Chart on Recharts, incl. radial ring for timer/goal progress) | 5 Dialog/Sheet/Drawer (vaul) | 6 Tabs and pill segmented controls | 7 Dropdown/context menus, tooltips, hover cards | 8 Toasts (sonner), skeletons, designed empty states | 9 Calendar/date picker, count-up numbers | 10 Form controls (Input, Select, Switch, Slider, Checkbox) + Badge, Progress, Kbd.

### Animation
motion + free easings. 120-200ms. Only for: sidebar collapse, tab indicator, list reorder, checkbox tick, count-up numbers, timer ring, page fade. No parallax or decorative loops. Respect prefers-reduced-motion.

### Electron polish
Hidden/custom title bar with drag region, Mica on Windows 11 / vibrancy on macOS where Electron supports it, smooth window controls.

### Contracts (so Stage 1 agents don't collide)
Create and document:
- Nav registry (one file, one entry per page). Sidebar: Home, Plan, Habits, Tasks, Focus, Study, Statistics, Goals, Review, Settings.
- Route registry, Settings-section registry, Home widget registry (named slots).
- IPC namespaces: focus:*, plan:*, journal:*, review:*, goals:*.
- Migration number ranges: Agent A 100-199, Agent B 200-299.
- A shared UI kit folder and a tokens file everyone imports.
Merge Stage 0 to main and tag it.

## STAGE 1A: Agent A, Focus (owns: timer engine, Focus/Pomodoro page, tray, shortcuts, blocker, Settings > Focus)
- Timer state lives in the Electron main process (timestamp-based), survives window close and restart. Closing the window minimizes to tray.
- Global shortcuts (Electron globalShortcut), configurable, with conflict detection; defaults like Ctrl/Cmd+Shift+P start/pause last preset, +S skip.
- Tray / menu bar: live countdown (menu-bar title on macOS; tooltip + dynamic icon on Windows/Linux). Menu: start preset, pause/resume, skip, stop, open app. Native notification at each phase end.
- Distraction blocker, active during FOCUS phases only (option to also block breaks, default off); stays on while paused; off when the session ends or stops.
  - Presets: Messaging (WhatsApp desktop + web.whatsapp.com), Social, Video, custom. Each = apps + websites. App picker lists running apps.
  - Apps: poll processes every 2-3s; blocked app running during focus is closed (graceful quit, force after a few seconds) with a notification. "Gentle" mode = notify only.
  - Websites: hosts-file blocking (127.0.0.1 and ::1) inside a clearly marked block; needs elevation (UAC / macOS admin prompt / pkexec); flush DNS. Tell me in Settings that browser "secure DNS" can bypass it and how to turn it off.
  - SAFETY (non-negotiable): always remove hosts entries when a session ends or stops, when the app quits, and after crashes (startup check + "Repair" button in Settings). Never leave the hosts file modified.
  - Emergency exit: always available, with friction (type a phrase or wait 30s); logged as a "focus break" and shown in stats.
  - Optional strict mode (no pause/skip). End-of-session summary: "You tried to open WhatsApp 6 times."
  - Per-OS implementation behind one interface. Phone blocking is out of scope.
- Tests: hosts add/remove idempotent, cleanup after simulated crash, blocklist matching, timer recovery after restart.

## STAGE 1B: Agent B, Reflection (owns: Plan, Journal, Review, Goals pages, notification settings)
- Daily plan: morning screen picks up to 3 priorities (tasks, habits, study topics or free text) plus today's study plan. Evening review: mark done/not done, one-line journal, optional sleep hours + energy (1-5). Notifications at configurable times.
- Journal: one sentence per day (longer allowed), full-text search (SQLite FTS5), browse by date. Expose a lookup API so the heatmap tooltip can show the day's journal line.
- Weekly review (auto-generated, Sunday evening by default): habits (hits vs target, misses, freezes, streak changes, missed-reason summary), focus (hours by project/curriculum/preset, best day, vs last week), study (topics learned, reviews done, retention, progress), tasks, plan completion, the week's journal lines. Prompts: "What got in the way?" (prefilled from logged missed reasons) and "One change for next week". Saved and browsable. Simple insights (no ML), labelled as correlations.
- Goals: habit frequency (run 3x/week for N weeks), focus hours on a project/curriculum/tag by a date, curriculum progress (finish Chapter 8 by date), task count. Progress is computed from existing logs, with an on-track/behind indicator. Link goals to habits/projects/chapters.
- Export widgets for the Home registry: TodayPlanWidget, GoalsWidget, ReviewsDueWidget.
- Tests: weekly review aggregation, goal progress, FTS search, plan/journal persistence.

## STAGE 1C: Agent C, Restyle (owns: Home, Habits, Tasks, Statistics, Study, Settings shell, command-palette contents)
- Rebuild these pages on the Stage 0 kit and tokens, keeping all behaviour and data.
- Home: time-based greeting (with random variants), collective year heatmap directly under it (lavender ramp, hatched freeze days, tooltip with X/Y done, missed names, freezes, journal line when available), then widget slots from the registry (render clean placeholders until Agent B's widgets land).
- Habits: weekly dot grid + habit detail drawer. Tasks: data table + quick-add. Statistics: shadcn charts. Study: curriculum tree, progress rings, review queue UI. Settings shell: sections from the registry.
- Command palette: navigate, start a focus preset, add task, search journal (once available).

## STAGE 2: Integration, then Review loop
1. Integration agent merges A, B, C into main in that order, resolves conflicts, mounts B's widgets into Home, and runs the full test suite.
2. Independent REVIEWER (not a builder) launches the real Electron app, clicks through every flow, runs tests, and screenshots every page in light and dark at two window sizes, checking each against DESIGN.md (token use, stray colours, spacing, type, hairlines instead of shadows). Must also verify: hosts file restored after a simulated crash, timer survives restart, packaged build (npm run build) works with better-sqlite3.
3. Score 1-10 with this rubric: feature completeness 20%, functionality/correctness 25%, design fidelity to DESIGN.md 25%, code quality 15%, UX/accessibility/responsiveness 15%.
4. Below 8: prioritised fix list, fix, fresh review. 8 or above: implement the top 3-5 improvements and resubmit. Stop at 9+, after 5 rounds, or after two rounds with no gain.
5. After each round show me: score, rubric breakdown, what was fixed, what remains. At the end: the final summary, the licence list for every component used, and any decisions I should know about.