# Free component sources

Foundation picks were published before installation. Installed versions are pinned
in package.json and package-lock.json. Official shadcn CLI 4.21.1 installed the
free new-york components from official registry JSON retrieved using Windows
networking (the CLI's direct fetch timed out). The local source matches the
official registry; no paid registry or subscription was used.

| Family | Source | Licence | Verified version / use |
|---|---|---|---|
| Shared components, sidebar, forms, menus, chart wrappers | https://ui.shadcn.com / https://github.com/shadcn-ui/ui | MIT | shadcn CLI 4.21.1; official copied sources, adapted for Recharts 3 and local themes |
| Command palette | https://github.com/dip/cmdk | MIT | cmdk 1.1.1 |
| Drawer | https://github.com/emilkowalski/vaul | MIT | vaul 1.1.2 |
| Toasts | https://github.com/emilkowalski/sonner | MIT | sonner 2.0.8 |
| Table | https://github.com/TanStack/table | MIT | @tanstack/react-table 9.2.4 |
| Charts | https://github.com/recharts/recharts | MIT | existing Recharts 3.10.1 |
| Transitions | https://github.com/motiondivision/motion | MIT | motion 13.4.6 |
| Icons | https://lucide.dev/license | ISC | existing lucide-react 1.49.0 |
| Inter variable font | https://fontsource.org/fonts/inter/about | SIL OFL 1.1 | @fontsource-variable/inter 5.3.0 |
| JetBrains Mono variable font | https://fontsource.org/fonts/jetbrains-mono/about | SIL OFL 1.1 | @fontsource-variable/jetbrains-mono 5.3.0 |

The proprietary Linear fonts are not bundled. Inter and JetBrains Mono are
offline substitutes. No subscription, token, Pro registry, shadcn.io MCP or
Next.js runtime is required. Supporting dependencies added by the official CLI
will be enumerated from their installed metadata and their licence notices
included before packaging.

Existing React, React DOM, React Router, date-fns, Electron, Tailwind and Vite
remain in place. SQLite is the Node/Electron bundled implementation; no
better-sqlite3 native module or external database service is introduced.

Supporting Radix primitives, react-day-picker, class-variance-authority, clsx and
tailwind-merge use MIT licences. Installed dependency notices and font OFL text
are retained in THIRD-PARTY-NOTICES.txt. Next.js theme dependencies were removed.
