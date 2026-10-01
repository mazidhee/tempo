# Foundation contracts for the master build

This is the implementation contract for Stage 0, derived from the complete
[master brief](master-build-brief.md) and the preserved root `DESIGN.md`.
It is a plan, not a claim that Stage 0 has been implemented. Stage 1 must wait
for the tested Foundation commit and tag.

## Design system

The Foundation owns `src/renderer/styles/tokens.css`, Tailwind's theme mapping,
local font imports, `src/renderer/components/ui/`, and common formatting helpers.
All subsequent modules import the kit and token values rather than inventing
another visual language. Existing `components/ui.tsx` exports keep compatibility
wrappers while pages migrate, preserving accessibility and current flows.

Dark tokens come directly from DESIGN.md: canvas `#010102`, surface ladder
`#0f1011`, `#141516`, `#18191a`, `#191a1b`, ink `#f7f8f8`, muted ink `#d0d6e0`,
subtle ink `#8a8f98`, hairlines `#23252a`, `#34343a`, `#3e3e44`, and lavender
`#5e6ad2` with the documented hover/focus values. Derived light, heatmap,
danger/warning and accessible contrast adaptations are labelled in the tokens
file. Other semantic colour is limited to the spec's success green.

App type uses bundled Inter variable at 14px body, 12px caption and 20–28px title,
with negative title tracking; JetBrains Mono and tabular numerals cover timers and
numbers. Use a 4px spacing base and predominantly 8/12px radii. Surface lift and
hairlines supply hierarchy. Motion lasts 120–200ms for the permitted functional
transitions only and respects reduced motion.

Shared families: Sidebar, Command, Table, Chart, Dialog/Sheet/Drawer, Tabs/
segmented controls, menus/tooltips/hover cards, toast/skeleton/empty, calendar/
date picker/count-up and form controls/Badge/Progress/Kbd. The free-source picks
and licences are recorded in [component sources](component-sources.md). Resolve
and pin installed versions, retain notices, and adapt source to Vite/Electron.

## Registries

The Foundation establishes `src/renderer/registry/` with these contracts:

- `navigation.ts`: one typed entry per primary page, ordered Home, Plan, Habits,
  Tasks, Focus, Study, Statistics, Goals, Review, Settings. Journal remains an
  accessible route/search action beneath Plan/Review. A registered page becomes
  navigable only when its implementation is mounted; do not expose dead links.
- `routes.tsx`: route definitions and lazy page imports. Retain `/weekly`,
  `/history`, `/habits/:id` and `/analytics` compatibility routes. Focus receives
  its existing focus-mode controls through an explicit route context.
- `settings.tsx`: section descriptors with a stable ID, label, order and renderer.
  The shell owns section selection. Modules contribute their own section views.
- `home.tsx`: named slots `today-plan`, `goals`, `reviews-due`, with typed widget
  contributions. Existing habit/task/focus summaries remain present. Stage C can
  render intentional empty states until Stage B mounts real widgets.

Stage 1 modules edit their own modules. Shared registry changes are additive
registrations. Changes to kit/tokens/shared schemas go through the integrator.

## Main process, IPC and data

Keep Electron's bundled `node:sqlite` and its existing facade. Foundation provides
a typed IPC registration index and explicit preload APIs, retaining `habitAPI`
compatibility for existing pages. Channel namespaces: `focus:*`, `plan:*`,
`journal:*`, `review:*`, `goals:*`, plus `study:*` for the missing Study module.
Validate untrusted renderer/import arguments at the main-process boundary.

Versioned migration ownership:

| Range | Owner | Data |
| --- | --- | --- |
| 1–3 | Existing app | Original habits/logs; productivity; Phase 1 habit engine |
| 4 | Foundation | Curriculum, ordered topics, spaced-review state/log |
| 100–199 | Focus | Focus/Guard settings and blocklists; focus-break events; timer ownership migration |
| 200–299 | Reflection | Daily priorities/reviews, journal/FTS5, saved weekly reviews, goals and reminders |

Migrations run transactionally in numerical order with persistent markers. Keep
existing identifiers/records and back up before schema changes. Backups grow to
include new modules and remap linked identifiers where necessary; formats 1/2
remain importable. The exact format upgrade is integrator-owned.

Study contracts provide a curriculum ID/title, ordered topics with optional
parent topic/chapter, learned timestamp, review due date, review interval and
graded review history. Define grade meanings and scheduling rules before testing.
Plan/Goals/Review read the same Study snapshot through typed APIs; they do not
create competing Study tables. The Study system remains within the minimal scope
specified in [release readiness](release-readiness.md).

Focus migration must preserve the current timer and completed-session snapshots.
After ownership moves to main, renderer persistence cannot overwrite main-owned
timer/sessions. The independent timer clock remains scoped to timer displays.
Ctrl/Cmd+Shift+P is already Privacy; use a conflict-free Focus default instead.

## Foundation validation and handoff

Before Stage 1 begins: type check, run the full existing suite, test migration 4
preservation/idempotency/rollback in isolated SQLite, build, launch Electron and
check existing workflows under the new kit/theme. Check that fonts and app
resources work offline. Verify registry links, dark/light inheritance, keyboard
controls, focus visibility, and reduced motion. Capture the Lucide sidebar preview.

Commit Foundation to main and tag the passing revision. Only then create isolated
Focus, Reflection and Restyle worktrees from that tag. Integrate A, B, C in order
and apply the release acceptance checks; the original user required a separate
reviewer that actually launches the app.
