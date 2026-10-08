import { useState } from 'react';
import { ChevronDown, ChevronRight, Folder, Files, Archive } from 'lucide-react';
import type { KnowledgeSnapshot } from '../../shared/knowledge';
export function NoteFolders({
  snapshot,
  selected,
  onSelect,
}: {
  snapshot: KnowledgeSnapshot;
  selected: string;
  onSelect: (folder: string) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const paths = new Set<string>();
  for (const path of [...snapshot.folders, ...snapshot.notes.map((n) => n.folder)].filter(
    Boolean,
  )) {
    const parts = path.split('/');
    parts.forEach((_, i) => paths.add(parts.slice(0, i + 1).join('/')));
  }
  const branches = (parent: string): React.ReactNode =>
    [...paths]
      .filter((p) => p.slice(0, p.lastIndexOf('/') < 0 ? 0 : p.lastIndexOf('/')) === parent)
      .sort((a, b) => a.localeCompare(b))
      .map((p) => {
        const hasChildren = [...paths].some((child) => child.startsWith(p + '/')),
          open = expanded[p] ?? (selected.startsWith(p + '/') || !parent);
        return (
          <li key={p}>
            <div className="note-folder-row">
              {hasChildren ? (
                <button
                  className="note-tree-toggle"
                  aria-label={`${open ? 'Collapse' : 'Expand'} ${p}`}
                  aria-expanded={open}
                  onClick={() => setExpanded((s) => ({ ...s, [p]: !open }))}
                >
                  {open ? <ChevronDown /> : <ChevronRight />}
                </button>
              ) : (
                <span className="note-tree-spacer" />
              )}
              <button
                className={selected === p ? 'selected' : ''}
                aria-current={selected === p ? 'page' : undefined}
                onClick={() => onSelect(p)}
              >
                <Folder />
                <span>{p.split('/').at(-1)}</span>
                <small>
                  {
                    snapshot.notes.filter(
                      (n) => !n.archived && (n.folder === p || n.folder.startsWith(p + '/')),
                    ).length
                  }
                </small>
              </button>
            </div>
            {open && hasChildren && <ul>{branches(p)}</ul>}
          </li>
        );
      });
  return (
    <nav className="note-folders" aria-label="Note folders">
      <button className={selected === '*' ? 'selected' : ''} onClick={() => onSelect('*')}>
        <Files />
        All notes<small>{snapshot.notes.filter((n) => !n.archived).length}</small>
      </button>
      <button className={selected === '' ? 'selected' : ''} onClick={() => onSelect('')}>
        <Folder />
        Unfiled
      </button>
      <ul>{branches('')}</ul>
      <button
        className={selected === '@archive' ? 'selected' : ''}
        onClick={() => onSelect('@archive')}
      >
        <Archive />
        Archived
      </button>
    </nav>
  );
}
