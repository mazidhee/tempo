# Tempo design implementation

This records the finished source against the already adopted Linear system.
It is an implementation companion, not a replacement design authority.
The user-supplied [DESIGN.md](../DESIGN.md), [master brief](master-build-brief.md),
[PRODUCT.md](../PRODUCT.md) and Foundation
`.impeccable/surfaces/src-renderer-app-tsx.md` direction contract remain the
authority. This work extends and refines that world in Operate mode.

## Token comparison

Runtime primitives are defined in `src/renderer/styles/tokens.css`; Tailwind
aliases are in `global.css` and `tailwind.config.mjs`. The following source
comparison was made against the frozen candidate `1433cb46`.

| Area | Adopted authority | Implemented source |
| --- | --- | --- |
| Dark canvas | `#010102` | Exact match |
| Surface ladder | `#0f1011`, `#141516`, `#18191a`, `#191a1b` | Exact match, levels 1–4 |
| Ink | `#f7f8f8`, `#d0d6e0`, `#8a8f98`, `#62666d` | Exact match |
| Hairlines | `#23252a`, `#34343a`, `#3e3e44` | Exact match |
| Lavender | Primary `#5e6ad2`, hover `#828fff`, focus `#5e69d1` | Exact match; readable dark hover ink is explicitly derived |
| Success | `#27a644` | Exact match; additional danger/warning states are labelled derived |
| Light appearance | Brief authorizes inverse-token derivation | White canvas, pale neutral surfaces/hairlines and near-black text; same lavender |
| Typography | Brief substitutes free fonts and scales marketing type down | Bundled Inter/JetBrains Mono; 14px body, 12px captions, 20/28px headings and negative title tracking |
| Functional timer | Desktop readout, distinct from marketing headings | Explicit derived 64px timer token and tabular numerals |
| Shape/spacing | Primarily 8/12px corners, 4px spacing base | Shared control/card mappings and spacing variables follow those values |
| Motion | Functional 120–200ms and reduced motion | 120/160/200ms tokens; reduced-motion rules in global/app/module styles |
| Depth | Surface lift and hairlines | `--shadow: none`; shared Button/Card use `shadow-none` |
| Icons | One Lucide family | Shared 18px/1.75-stroke token treatment; preview in Settings and `docs/sidebar-icons.png` |

Light surfaces, semantic danger/warning, backdrop opacity, lavender heatmap ramps,
readable hover ink and desktop control/layout metrics are extensions documented
in the token file. They do not change the supplied marketing spec. The 56–80px
marketing hierarchy and pricing/testimonial/footer components are not adopted
as application page patterns.

## Shared composition and controls

The collapsible sidebar, breadcrumb/titlebar and window controls anchor the
workspace. Neutral selected navigation, charcoal panels, hairlines and restrained
primary actions carry hierarchy. On Home, the annual activity calendar sits
immediately below the greeting. Freeze hatching describes recorded protection;
it is a functional texture rather than a decorative gradient.

The kit in `src/renderer/components/ui/` contains Button, Card, Input and form
controls, Sidebar, cmdk Command, TanStack-backed table integration, Recharts
wrappers, Dialog/Sheet/Drawer, tabs, menus/tooltips/hover cards, Sonner toasts,
calendar, progress and keyboard labels. Compatibility wrappers in `ui.tsx`
retain existing flows. The application mounts one shared Toaster and uses typed
navigation, route, Settings and Home widget registries.

Locally bundled fonts require no CDN. Number displays use tabular numerals;
timer displays scope their clock separately from history-heavy pages. The sidebar
becomes a sheet at narrow widths; page layouts stack and dense data regions
scroll within panels. Keyboard navigation, visible focus, labelled controls,
dialog restoration and reduced-motion behavior are part of the intended system.

The final integration fixes specifically restore readable Reflection reminder
rows, align Focus setting switches and make narrow Task actions usable. Independent
round 2 confirmed all three through actual clicks and fresh packaged/native
capture matrices. The accepted weighted result is 9.18/10, including 9.3/10 for
design fidelity. Installed Windows acceptance also passed and is recorded
separately in [release readiness](release-readiness.md).

## Preserved artifacts and pre-existing drift

The supplied `DESIGN.md` is preserved verbatim. It stores its tokens in a fenced
YAML block and contains collapsed lines in typography, radius, spacing and
component entries. That differs from Impeccable's current frontmatter schema.
Normalizing it would modify the user's authority, so this pass does not do so.

`.impeccable/design.json` does not exist in this checkout. There is therefore no
incumbent sidecar token/component snapshot to compare. This is recorded as
pre-existing tooling drift; this pass neither creates a new sidecar nor treats
its absence as permission to rewrite `DESIGN.md`. Runtime CSS remains the
implementation record alongside the preserved authority.

Source inspection also finds legacy `.focus-invitation` gradient styling in
`app.css` and a literal shadow in `.modal-content` within `global.css`'s component
layer. Shared and current page styles contain flat overrides; these remnants
alone do not establish a visible regression. Likewise, older CSS has literal
layout metrics alongside newer tokens. They are recorded without repair because
this task's scope is documentation. Rendered review and CSS specificity determine
whether a remnant affects a mounted surface.

This comparison makes no new visual-world decision, fabricates no missing
component snapshot and leaves production CSS and design authority unchanged.
The [independent master review](independent-master-review.md) owns screenshot
inspection and the final fidelity verdict.

## Sources and licences

All adopted components and dependencies use free sources. Shared shadcn/Radix,
cmdk, TanStack, Recharts, motion, vaul and Sonner use MIT licences; Lucide uses
ISC, and bundled Inter/JetBrains Mono use SIL OFL 1.1. The full component picks
and notices are in [component sources](component-sources.md),
[the licence manifest](license-manifest.json) and
[THIRD-PARTY-NOTICES.txt](../THIRD-PARTY-NOTICES.txt).
