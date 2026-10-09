# Writing preview checks — October 9, 2026

Scope: isolated localhost 5225 preview with fictional notes. No production app
files, owner database, Markdown vault or installed preferences were exercised.

The browser checks used the in-app browser through CUA. Screenshots under
`.impeccable/review/writing-next/` show all five layouts, light/dark and narrow
writing/tree/outline states. Desktop captures are 1440×1000; narrow captures
390×844; actual sidebar-browser capture 512×571.

The initial interaction pass covered typing Markdown, Source/Live/Read,
undo continuity after changing section, editor position restoration, outline
jumps, search, Read wiki navigation and keyboard resizing.

The independent review's correction pass checked:

- Notes Read scroll 1110 survived switching to Work and back; Work retained its
  separate top position. Explorer Control+Home position 0 survived the same
  round trip; Notes had expanded folders while Work retained collapsed folders.
  Control+End scroll observations before settling are not exact-position proof.
- Actual context widths in C changed 228→244 at 1440px and then to 260 at 1200px.
  Keyboard changes use the same 210–380px bounds as pointer resizing.
- Search's Shift+Tab reached its last result, Tab returned to the input,
  background was inert, and Escape restored the opening Search control.
- The actual `persist` function was extracted from the source into an isolated
  Node VM with a throwing storage stub. Failure returned false and dispatched
  an unsuccessful save event; retry returned true and stored the exact supplied
  body. This establishes function behavior, not a browser quota-failure capture.
- Selecting Mutability and identity in D changed the displayed Current label
  from Names and objects to Mutability and identity.

The reviewer scored F1–F5 resolved. **F6 remains unresolved:** the browser's
download-event check timed out and no exported Markdown file was obtained or
compared with canonical source. Export must not be called validated. The final
review disposition is `fix`, with presentation allowed for layout selection
only; no whole-surface score or production certification is implied.

The current preview builds with esbuild. Installed app tests and migrations
have not been rerun for this preview because production files are unchanged.
