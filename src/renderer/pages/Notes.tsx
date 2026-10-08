import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, FolderPlus, Search, FileText, Folder } from 'lucide-react';
import { useKnowledge } from '../hooks/useKnowledge';
import { NoteFolders } from '../components/NoteFolders';
import { NoteEditor } from '../components/NoteEditor';
import { plainJournalDocument, journalDocumentText } from '../../shared/journalDocument';
import { PageHeader } from '../components/ui';
import '../styles/knowledge.css';
export default function Notes() {
  const { snapshot, setSnapshot, error: loadError } = useKnowledge(),
    { noteId } = useParams(),
    navigate = useNavigate();
  const [folder, setFolder] = useState('*'),
    [query, setQuery] = useState(''),
    [addingFolder, setAddingFolder] = useState(false),
    [folderName, setFolderName] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [browse, setBrowse] = useState(false);
  const note = snapshot?.notes.find((n) => n.id === noteId);
  const create = async () => {
    if (!snapshot || busy) return;
    setBusy(true);
    try {
      const now = new Date().toISOString(),
        id = crypto.randomUUID();
      const next = await window.workspaceAPI.invoke('notes:save', {
        id,
        title: 'Untitled',
        folder: ['*', '@archive'].includes(folder) ? '' : folder,
        tags: [],
        document: plainJournalDocument(''),
        links: [],
        createdAt: now,
        updatedAt: now,
        archived: false,
      });
      setSnapshot(next);
      navigate(`/notes/${id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const folders = snapshot
    ? [...new Set([...snapshot.folders, ...snapshot.notes.map((n) => n.folder)])]
    : [];
  if (!snapshot)
    return (
      <div className="page" role="status">
        {loadError || 'Opening notes…'}
      </div>
    );
  if (noteId && !note)
    return (
      <div className="page">
        <h1>Note unavailable</h1>
        <button onClick={() => navigate('/notes')}>All notes</button>
      </div>
    );
  const list = snapshot.notes
    .filter((n) =>
      folder === '@archive'
        ? n.archived
        : !n.archived &&
          (folder === '*' || n.folder === folder || n.folder.startsWith(folder + '/')),
    )
    .filter((n) =>
      `${n.title} ${n.tags.join(' ')} ${journalDocumentText(n.document)}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return (
    <div className={`knowledge-page ${note ? 'is-writing' : ''}`}>
      <div className="notes-mobile-tools">
        <button className="text-button" aria-expanded={browse} onClick={() => setBrowse(!browse)}>
          <Folder />
          Browse notes
        </button>
      </div>
      <div className={`notes-layout ${browse ? 'show-folders' : ''}`}>
        <aside className="notes-index">
          <NoteFolders
            snapshot={snapshot}
            selected={folder}
            onSelect={(f) => {
              setFolder(f);
              setBrowse(false);
              navigate('/notes');
            }}
          />
          <button className="text-button" onClick={() => setAddingFolder(!addingFolder)}>
            <FolderPlus />
            New folder
          </button>
          {addingFolder && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const next = await window.workspaceAPI.invoke('notes:folder', folderName.trim());
                  setSnapshot(next);
                  setFolder(folderName.trim());
                  setAddingFolder(false);
                  setFolderName('');
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              <input
                aria-label="New folder path"
                placeholder="Engineering/SQL"
                autoFocus
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
              />
              <button className="text-button" type="submit">
                Create
              </button>
            </form>
          )}
        </aside>
        <div className="notes-content">
          {note ? (
            <NoteEditor
              key={note.id}
              note={note}
              folders={folders}
              onBack={() => navigate('/notes')}
            />
          ) : (
            <>
              <PageHeader
                title={
                  folder === '*'
                    ? 'Notes'
                    : folder === '@archive'
                      ? 'Archived notes'
                      : folder
                        ? folder.split('/').at(-1) || 'Notes'
                        : 'Unfiled'
                }
                action={
                  <button className="text-button" disabled={busy} onClick={() => void create()}>
                    <Plus />
                    New note
                  </button>
                }
              />
              <label className="note-search">
                <Search />
                <input
                  aria-label="Search notes"
                  placeholder="Search notes"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              {(error || snapshot.error) && (
                <p className="error" role="alert">
                  {error || snapshot.error}
                </p>
              )}
              <div className="notes-list">
                {list.map((n) => (
                  <button
                    className="note-list-row"
                    key={n.id}
                    onClick={() => navigate(`/notes/${n.id}`)}
                  >
                    <FileText />
                    <div>
                      <strong>{n.title}</strong>
                      <p>{journalDocumentText(n.document).slice(0, 150) || 'Empty note'}</p>
                      <small>
                        {n.folder || 'Unfiled'}
                        {n.tags.length ? ` · ${n.tags.join(' · ')}` : ''}
                      </small>
                    </div>
                    <time dateTime={n.updatedAt}>
                      {new Date(n.updatedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </time>
                  </button>
                ))}
                {!list.length && (
                  <div className="notes-empty">
                    <FileText />
                    <p>{query ? 'No matching notes' : 'No notes here'}</p>
                    {!query && (
                      <button className="text-button" onClick={() => void create()}>
                        <Plus />
                        New note
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
