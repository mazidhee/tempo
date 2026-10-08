import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Italic,
  Heading2,
  Code,
  ArrowLeft,
  Link2,
  Download,
  Archive,
  RotateCcw,
  X,
} from 'lucide-react';
import {
  documentMarkdown,
  noteMarkdown,
  validateNote,
  type KnowledgeNote,
  type KnowledgeGraph,
} from '../../shared/knowledge';
import { download, Modal } from './ui';
import type { JournalDocument } from '../../shared/journalDocument';
import '../vendor/yoopta/floating-toolbar/floating-toolbar.css';
export function NoteEditor({
  note,
  folders,
  onBack,
}: {
  note: KnowledgeNote;
  folders: string[];
  onBack: () => void;
}) {
  const [draft, setDraft] = useState(note),
    [status, setStatus] = useState('Saved locally'),
    [error, setError] = useState(''),
    [slash, setSlash] = useState(false);
  const [tagText, setTagText] = useState(note.tags.join(', '));
  const [linking, setLinking] = useState(false),
    [links, setLinks] = useState<KnowledgeGraph['nodes']>([]),
    [query, setQuery] = useState('');
  const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 });
  const draftRef = useRef(note),
    revision = useRef(0),
    saved = useRef(0),
    queue = useRef(Promise.resolve()),
    timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const save = () => {
    clearTimeout(timeout.current);
    const version = revision.current,
      value = draftRef.current;
    if (version === saved.current) return queue.current.then(() => true);
    queue.current = queue.current
      .then(async () => {
        if (version <= saved.current) return;
        setStatus('Saving…');
        const result = await window.workspaceAPI.invoke('notes:save', value);
        if (result.error) throw Error(`Writing saved in Tempo. ${result.error}`);
        saved.current = version;
        if (revision.current === version) {
          setStatus('Saved locally');
          localStorage.removeItem(`tempo-note-draft:${note.id}`);
        }
        setError('');
      })
      .catch((e) => {
        setStatus('Draft kept on this device');
        setError(e.message);
      });
    return queue.current.then(() => saved.current >= version);
  };
  const change = (next: KnowledgeNote) => {
    draftRef.current = next;
    setDraft(next);
    revision.current++;
    setStatus('Unsaved changes');
    try {
      localStorage.setItem(`tempo-note-draft:${note.id}`, JSON.stringify(next));
    } catch {
      setError('Draft storage is full. Use Save now.');
    }
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => void save(), 700);
  };
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: false, underline: false }),
    ],
    content: note.document,
    editorProps: {
      attributes: { role: 'textbox', 'aria-label': 'Note content', 'aria-multiline': 'true' },
      handleKeyDown: (_view, event) => {
        if (event.key === 'Escape') {
          setSlash(false);
          return false;
        }
        return false;
      },
    },
    onUpdate: ({ editor: e }) => {
      change({ ...draftRef.current, document: e.getJSON() as JournalDocument });
      const pos = e.state.selection.from;
      const show = pos > 0 && e.state.doc.textBetween(Math.max(0, pos - 1), pos) === '/';
      setSlash(show);
      if (show) {
        const caret = e.view.coordsAtPos(pos),
          box = e.view.dom.closest('.note-writer')!.getBoundingClientRect();
        setSlashPosition({
          top: caret.bottom - box.top + 6,
          left: Math.max(0, Math.min(caret.left - box.left, box.width - 220)),
        });
      }
    },
  });
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`tempo-note-draft:${note.id}`);
      if (raw) {
        const restored = JSON.parse(raw) as KnowledgeNote;
        validateNote(restored);
        if (restored.id === note.id) {
          draftRef.current = restored;
          setDraft(restored);
          setTagText(restored.tags.join(', '));
          revision.current++;
          editor?.commands.setContent(restored.document, { emitUpdate: false });
          void saveRef.current();
        }
      }
    } catch {
      setError('A local draft could not be recovered. The saved note is still available.');
    }
    const shortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void saveRef.current();
      }
    };
    window.addEventListener('keydown', shortcut);
    return () => {
      window.removeEventListener('keydown', shortcut);
      clearTimeout(timeout.current);
      void saveRef.current();
    };
  }, [note.id, editor]);
  useEffect(() => {
    let active = true;
    void window.workspaceAPI
      .invoke('notes:graph')
      .then((g) => {
        if (active) setLinks(g.nodes.filter((n) => n.id !== `note:${note.id}`));
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [note.id]);
  const insert = (kind: string) => {
    if (!editor) return;
    const pos = editor.state.selection.from;
    if (pos > 0 && editor.state.doc.textBetween(pos - 1, pos) === '/')
      editor.commands.deleteRange({ from: pos - 1, to: pos });
    const chain = editor.chain().focus();
    if (kind === 'Heading') chain.setHeading({ level: 2 }).run();
    if (kind === 'Bullet list') chain.toggleBulletList().run();
    if (kind === 'Code block') chain.toggleCodeBlock().run();
    if (kind === 'Quote') chain.toggleBlockquote().run();
    if (kind === 'Divider') chain.setHorizontalRule().run();
    setSlash(false);
  };
  const openLinks = () => {
    setLinking(true);
    void window.workspaceAPI
      .invoke('notes:graph')
      .then((g) => setLinks(g.nodes.filter((n) => n.id !== `note:${note.id}`)))
      .catch((e) => setError(e.message));
  };
  return (
    <article className="note-canvas">
      <div className="note-page-actions">
        <button
          className="text-button"
          onClick={() =>
            void save().then((ok) => {
              if (ok) onBack();
            })
          }
        >
          <ArrowLeft />
          Notes
        </button>
        <span role="status">{status}</span>
        <button
          className="icon-button"
          aria-label="Export Markdown"
          onClick={() =>
            download(`${draft.title.replace(/[<>:"/\\|?*]/g, '-')}.md`, noteMarkdown(draft))
          }
        >
          <Download />
        </button>
        <button
          className="icon-button"
          aria-label={draft.archived ? 'Restore note' : 'Archive note'}
          onClick={() => {
            change({ ...draft, archived: !draft.archived });
            void save().then((ok) => {
              if (ok) onBack();
            });
          }}
        >
          {draft.archived ? <RotateCcw /> : <Archive />}
        </button>
      </div>
      {error && (
        <div role="alert" className="error">
          {error}
          <button className="text-button" onClick={() => void save()}>
            Save now
          </button>
        </div>
      )}
      <textarea
        className="note-title"
        aria-label="Note title"
        rows={1}
        value={draft.title}
        maxLength={200}
        onChange={(e) => change({ ...draft, title: e.target.value })}
      />
      <div className="note-properties">
        <select
          aria-label="Note folder"
          value={draft.folder}
          onChange={(e) => change({ ...draft, folder: e.target.value })}
        >
          <option value="">Unfiled</option>
          {[...new Set([...folders, draft.folder])]
            .filter(Boolean)
            .sort()
            .map((f) => (
              <option key={f}>{f}</option>
            ))}
        </select>
        <input
          aria-label="Note tags"
          placeholder="Add tags"
          value={tagText}
          onBlur={() => setTagText(draftRef.current.tags.join(', '))}
          onChange={(e) => {
            // Keep unfinished separators and spaces in the editing buffer.
            setTagText(e.target.value);
            change({
              ...draft,
              tags: e.target.value
                .split(',')
                .map((x) => x.trim())
                .filter(Boolean)
                .slice(0, 30),
            });
          }}
        />
        <button className="text-button" onClick={openLinks}>
          <Link2 />
          Link record
        </button>
      </div>
      {!!draft.links.length && (
        <div className="note-links">
          {draft.links.map((id) => (
            <span key={id}>
              {links.find((n) => n.id === id)?.label || id}
              <button
                className="icon-button"
                aria-label={`Unlink ${id}`}
                onClick={() => change({ ...draft, links: draft.links.filter((l) => l !== id) })}
              >
                <X />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="note-writer">
        <EditorContent editor={editor} />
        {editor && (
          <BubbleMenu editor={editor} options={{ placement: 'top' }}>
            <div className="yoopta-ui-floating-toolbar">
              {[
                { label: 'Bold', Icon: Bold, run: () => editor.chain().focus().toggleBold().run() },
                {
                  label: 'Italic',
                  Icon: Italic,
                  run: () => editor.chain().focus().toggleItalic().run(),
                },
                {
                  label: 'Heading',
                  Icon: Heading2,
                  run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
                },
                {
                  label: 'Inline code',
                  Icon: Code,
                  run: () => editor.chain().focus().toggleCode().run(),
                },
              ].map(({ label, Icon, run }) => (
                <button
                  className="yoopta-ui-floating-toolbar-button"
                  key={label}
                  aria-label={label}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={run}
                >
                  <Icon />
                </button>
              ))}
            </div>
          </BubbleMenu>
        )}
        {slash && (
          <div className="note-slash" style={slashPosition} role="menu" aria-label="Insert block">
            {['Heading', 'Bullet list', 'Code block', 'Quote', 'Divider'].map((kind) => (
              <button
                key={kind}
                role="menuitem"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insert(kind)}
              >
                {kind}
              </button>
            ))}
          </div>
        )}
      </div>
      <footer className="note-word-count">
        {documentMarkdown(draft.document).split(/\s+/).filter(Boolean).length} words
      </footer>
      {linking && (
        <Modal title="Link a record" onClose={() => setLinking(false)}>
          <input
            className="note-search"
            aria-label="Search link records"
            placeholder="Search notes, topics, projects…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="note-link-picker">
            {links
              .filter((n) => n.label.toLowerCase().includes(query.toLowerCase()))
              .slice(0, 40)
              .map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    change({
                      ...draftRef.current,
                      links: [...new Set([...draftRef.current.links, n.id])],
                    });
                    setLinking(false);
                  }}
                >
                  <span>{n.label}</span>
                  <small>{n.kind}</small>
                </button>
              ))}
          </div>
        </Modal>
      )}
    </article>
  );
}
