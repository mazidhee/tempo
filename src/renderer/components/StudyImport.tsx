import { useMemo, useRef, useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { Modal } from './ui';
import { parseStudyOutline, type StudyOutlineInput } from '../../shared/studyImport';
import software from '../assets/curricula/software-engineering.md?raw';
import mathematics from '../assets/curricula/mathematics.md?raw';
import economics from '../assets/curricula/economics-markets.md?raw';
export const providedRoadmaps = [
  { title: 'Software engineering', markdown: software },
  { title: 'Mathematics', markdown: mathematics },
  { title: 'Economics & markets', markdown: economics },
];
export default function StudyImport({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: (id: string) => void;
}) {
  const [mode, setMode] = useState('provided'),
    [selected, setSelected] = useState(providedRoadmaps.map((r) => r.title));
  const [drafts, setDrafts] = useState<StudyOutlineInput[]>([{ title: '', markdown: '' }]),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const sources =
    mode === 'provided' ? providedRoadmaps.filter((r) => selected.includes(r.title)) : drafts;
  const preview = useMemo(
    () =>
      sources.map((source) => {
        try {
          return { source, outline: parseStudyOutline(source.markdown, source.title), error: '' };
        } catch (reason) {
          return { source, outline: null, error: String(reason) };
        }
      }),
    [sources],
  );
  const ready =
    preview.length > 0 && preview.every((item) => !!item.outline && item.source.title.trim());
  return (
    <Modal title="Import study outlines" onClose={onClose}>
      <p className="muted">
        Headings become topics; checklist items become subtopics. Existing checkmarks are kept.
        Reimporting the same outline opens its existing curriculum.
      </p>
      <div className="tabs" aria-label="Outline source">
        <button
          aria-pressed={mode === 'provided'}
          className={mode === 'provided' ? 'selected' : ''}
          onClick={() => setMode('provided')}
        >
          Your three roadmaps
        </button>
        <button
          aria-pressed={mode === 'custom'}
          className={mode === 'custom' ? 'selected' : ''}
          onClick={() => setMode('custom')}
        >
          Paste or upload
        </button>
      </div>
      {mode === 'provided' ? (
        <div className="provided-outlines">
          {providedRoadmaps.map((roadmap) => (
            <label key={roadmap.title}>
              <input
                type="checkbox"
                checked={selected.includes(roadmap.title)}
                onChange={(e) =>
                  setSelected(
                    e.target.checked
                      ? [...selected, roadmap.title]
                      : selected.filter((title) => title !== roadmap.title),
                  )
                }
              />
              <FileText />
              <span>{roadmap.title}</span>
            </label>
          ))}
        </div>
      ) : (
        <div className="form-stack">
          <button className="btn-secondary" onClick={() => fileInput.current?.click()}>
            <Upload />
            Upload Markdown files
          </button>
          <input
            ref={fileInput}
            className="sr-only"
            aria-label="Upload study outlines"
            type="file"
            multiple
            accept=".md,.markdown,.txt,text/plain,text/markdown"
            onChange={async (e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = '';
              try {
                if (files.length > 10 || files.some((file) => file.size > 1000000))
                  throw new Error('Choose at most ten files, each smaller than 1 MB.');
                setDrafts(
                  await Promise.all(
                    files.map(async (file) => ({
                      title: file.name.replace(/\.[^.]+$/, ''),
                      markdown: await file.text(),
                    })),
                  ),
                );
              } catch (reason) {
                setError(String(reason));
              }
            }}
          />
          {drafts.map((draft, index) => (
            <div className="outline-draft" key={index}>
              <label>
                Curriculum title
                <input
                  className="input"
                  maxLength={200}
                  value={draft.title}
                  onChange={(e) =>
                    setDrafts(
                      drafts.map((item, i) =>
                        i === index ? { ...item, title: e.target.value } : item,
                      ),
                    )
                  }
                />
              </label>
              <label>
                Markdown outline
                <textarea
                  className="input"
                  rows={7}
                  value={draft.markdown}
                  maxLength={1000000}
                  placeholder={'## Python\n### Core language\n- [ ] Data types\n- [x] Variables'}
                  onChange={(e) =>
                    setDrafts(
                      drafts.map((item, i) =>
                        i === index ? { ...item, markdown: e.target.value } : item,
                      ),
                    )
                  }
                />
              </label>
            </div>
          ))}
        </div>
      )}
      <div className="outline-preview" aria-label="Import preview">
        {preview.map(({ source, outline, error: issue }, index) => (
          <div key={index}>
            <strong>{source.title || 'Your outline'}</strong>
            <p className="muted">
              {outline
                ? `${outline.topics.length} topics · ${outline.completed} already checked`
                : issue}
            </p>
            {outline && (
              <details>
                <summary>Preview structure</summary>
                <ul>
                  {outline.topics.slice(0, 60).map((topic) => (
                    <li key={topic.key} className={topic.parentKey === null ? '' : 'outline-child'}>
                      {topic.learned ? 'Completed: ' : ''}
                      {topic.title}
                    </li>
                  ))}
                </ul>
                {outline.topics.length > 60 && (
                  <p className="muted">Plus {outline.topics.length - 60} more topics.</p>
                )}
              </details>
            )}
          </div>
        ))}
      </div>
      {error && (
        <p role="alert" className="inline-error">
          {error}
        </p>
      )}
      <div className="modal-actions">
        <button className="btn-secondary" disabled={busy} onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn-primary"
          disabled={!ready || busy}
          onClick={async () => {
            setBusy(true);
            setError('');
            try {
              const saved = await window.workspaceAPI.invoke('study:importOutlines', sources);
              onImported(saved[0].id);
              onClose();
            } catch (reason) {
              setError(String(reason));
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? 'Importing…' : `Import ${sources.length === 1 ? 'curriculum' : 'curricula'}`}
        </button>
      </div>
    </Modal>
  );
}
