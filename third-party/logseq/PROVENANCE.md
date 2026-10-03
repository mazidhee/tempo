# Logseq journal source

Upstream: https://github.com/logseq/logseq
Commit: 22a29b30dee3b3930cf49bba50454650c31d2a07
Source: src/main/frontend/components/journal.cljs
Licence: GNU AGPL version 3 (../../LICENSE.md).

The journal-item height cache and ResizeObserver lifecycle are adapted into React in src/renderer/components/LogseqJournalFrame.tsx on October 3, 2026. Tempo's outline editor is built on Tiptap, with separate original keyboard/folding integration; Logseq's graph, plugins and sync engine are not embedded. Existing Tempo journal records remain in SQLite.
