# Yoopta toolbar styles

Source: https://github.com/yoopta-editor/Yoopta-Editor
Revision: `070349b1cd703d05548e2db94c98b4e9622d4f07`
Licence: MIT, retained verbatim in LICENSE.

Copied without modification on 2026-10-08:

- `packages/core/ui/src/styles/variables.css` -> `styles/variables.css`
- `packages/core/ui/src/floating-toolbar/floating-toolbar.css` ->
  `floating-toolbar/floating-toolbar.css`

The original relative CSS import is preserved. The preview overrides public
theme variables in its own app.css. React behaviour and command bindings in
editor.tsx are independently authored for the existing Tiptap editor. Yoopta's
Slate engine, plugins and AI integrations are not included.
