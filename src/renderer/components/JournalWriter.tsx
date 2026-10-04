import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, Quote, Code, Undo2, Redo2, Plus } from 'lucide-react';
import { JournalOutline } from './JournalOutline';
import type { JournalEntry } from '../../shared/reflection';
import {
  plainJournalDocument,
  journalDocumentText,
  validateJournalDocument,
  type JournalDocument,
} from '../../shared/journalDocument';
export function JournalWriter({ date, entry }: { date: string; entry?: JournalEntry }) {
  const key = `tempo-journal-draft:${date}`;
  const initial = useRef(
    entry?.document ||
      (entry?.text
        ? plainJournalDocument(entry.text)
        : {
            type: 'doc',
            content: [
              {
                type: 'bulletList',
                content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }],
              },
            ],
          }),
  );
  const recovered = useRef(false);
  if (!recovered.current) {
    try {
      const draft = localStorage.getItem(key);
      if (draft) {
        const value = JSON.parse(draft);
        validateJournalDocument(value);
        initial.current = value;
      }
    } catch {
      /* A damaged local draft never replaces the saved journal. */
    }
    recovered.current = true;
  }
  const document = useRef<JournalDocument>(initial.current),
    revision = useRef(0),
    savedRevision = useRef(localStorage.getItem(key) ? -1 : 0);
  const saving = useRef(false),
    timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const saveRef = useRef<() => Promise<void>>(async () => {});
  const [status, setStatus] = useState(
      savedRevision.current < 0 ? 'Recovered local draft' : 'Saved locally',
    ),
    [error, setError] = useState(''),
    [serif, setSerif] = useState(() => localStorage.getItem('tempo-journal-serif') === 'true');
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: false, listItem: false }),
      JournalOutline,
    ],
    content: initial.current,
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-label': 'Daily journal',
        'aria-multiline': 'true',
        'aria-placeholder': 'Start writing. One thought is enough.',
      },
    },
    onUpdate: ({ editor: current }) => {
      document.current = current.getJSON() as JournalDocument;
      revision.current++;
      try {
        localStorage.setItem(key, JSON.stringify(document.current));
      } catch {
        setError('Local draft storage is full. Save your journal now.');
      }
      setStatus('Unsaved changes');
      clearTimeout(timeout.current);
      timeout.current = setTimeout(() => void saveRef.current(), 800);
    },
  });
  const selection = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      empty: !!current?.isEmpty,
      bold: !!current?.isActive('bold'),
      italic: !!current?.isActive('italic'),
      bullet: !!current?.isActive('bulletList'),
      ordered: !!current?.isActive('orderedList'),
      quote: !!current?.isActive('blockquote'),
      code: !!current?.isActive('codeBlock'),
      heading: current?.isActive('heading') ? String(current.getAttributes('heading').level) : '0',
    }),
  });
  // Serialize saves. Typing during an IPC write queues the latest revision, never stale content.
  saveRef.current = async () => {
    if (saving.current || savedRevision.current === revision.current) return;
    saving.current = true;
    const version = revision.current,
      value = document.current;
    setStatus('Saving…');
    try {
      validateJournalDocument(value);
      await window.workspaceAPI.invoke('journal:save', {
        date,
        text: journalDocumentText(value),
        document: value,
      });
      savedRevision.current = version;
      setError('');
      if (version === revision.current) {
        localStorage.removeItem(key);
        setStatus('Saved locally');
      } else setStatus('Unsaved changes');
    } catch (e) {
      setError((e as Error).message);
      setStatus('Draft kept on this device');
    } finally {
      saving.current = false;
      if (savedRevision.current === version && revision.current !== version) void saveRef.current();
    }
  };
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void saveRef.current();
      }
    };
    window.addEventListener('keydown', shortcut);
    return () => {
      window.removeEventListener('keydown', shortcut);
      clearTimeout(timeout.current);
      void saveRef.current();
    };
  }, []);
  const icons = [
    {
      label: 'Bold',
      icon: Bold,
      active: selection?.bold,
      run: () => editor?.chain().focus().toggleBold().run(),
    },
    {
      label: 'Italic',
      icon: Italic,
      active: selection?.italic,
      run: () => editor?.chain().focus().toggleItalic().run(),
    },
    {
      label: 'Bullet list',
      icon: List,
      active: selection?.bullet,
      run: () => editor?.chain().focus().toggleBulletList().run(),
    },
    {
      label: 'Numbered list',
      icon: ListOrdered,
      active: selection?.ordered,
      run: () => editor?.chain().focus().toggleOrderedList().run(),
    },
    {
      label: 'Quote',
      icon: Quote,
      active: selection?.quote,
      run: () => editor?.chain().focus().toggleBlockquote().run(),
    },
    {
      label: 'Code block',
      icon: Code,
      active: selection?.code,
      run: () => editor?.chain().focus().toggleCodeBlock().run(),
    },
    { label: 'Undo', icon: Undo2, active: false, run: () => editor?.chain().focus().undo().run() },
    { label: 'Redo', icon: Redo2, active: false, run: () => editor?.chain().focus().redo().run() },
  ];
  return (
    <div
      className={`journal-document ${serif ? 'serif' : ''}${selection?.empty ? ' is-empty' : ''}`}
    >
      <div className="journal-toolbar" role="group" aria-label="Journal formatting">
        <select
          aria-label="Paragraph style"
          value={selection?.heading || '0'}
          onChange={(e) => {
            const level = Number(e.target.value);
            if (level)
              editor
                ?.chain()
                .focus()
                .setHeading({ level: level as 1 | 2 | 3 })
                .run();
            else editor?.chain().focus().setParagraph().run();
          }}
        >
          <option value="0">Text</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
        </select>
        {icons.map((item) => (
          <button
            key={item.label}
            className="icon-button"
            title={item.label}
            aria-label={item.label}
            aria-pressed={item.active}
            onClick={item.run}
          >
            <item.icon />
          </button>
        ))}
        <button
          className="btn-ghost"
          aria-pressed={serif}
          onClick={() => {
            setSerif(!serif);
            localStorage.setItem('tempo-journal-serif', String(!serif));
          }}
        >
          Serif
        </button>
        <span className="journal-toolbar-status" role="status">
          {status}
        </span>
      </div>
      <EditorContent
        editor={editor}
        onClick={() => {
          if (editor?.isEmpty) editor.commands.focus('start');
        }}
      />
      <div className="journal-outline-help">
        <button
          className="btn-ghost"
          onClick={() =>
            editor
              ?.chain()
              .focus('end')
              .insertContent({
                type: 'bulletList',
                content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }],
              })
              .run()
          }
        >
          <Plus /> Add a block
        </button>
        <span>Enter · new block&nbsp; / &nbsp;Tab · indent&nbsp; / &nbsp;Shift+Tab · outdent</span>
      </div>
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      <div className="journal-save">
        <span>
          {error ? 'Your draft is kept on this device.' : 'Your words stay on this device.'}
        </span>
        <button className="btn-secondary" onClick={() => void saveRef.current()}>
          Save journal
        </button>
      </div>
    </div>
  );
}
