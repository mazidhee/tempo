import '../../styles/approved-workspace.css';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search, Maximize2, Minimize2 } from 'lucide-react';
import { localDate } from '../../../shared/productivity';
import { validDate, shiftDay } from '../../../shared/habits';
import type { JournalEntry } from '../../../shared/reflection';
import { PageHeader } from '../../components/ui';
import { JournalWriter } from '../../components/JournalWriter';
import { LogseqJournalFrame } from '../../components/LogseqJournalFrame';
import { useReflection } from './useReflection';
import { ActionError, Field, LoadState } from './ui';
import '../../styles/document-pages.css';
import '../../styles/daily-thought.css';
import { useProductivity } from '../../hooks/ProductivityProvider';
export default function Journal() {
  const [params, setParams] = useSearchParams();
  const date = validDate(params.get('date') || '') ? params.get('date')! : localDate();
  const { snapshot } = useReflection();
  const { state } = useProductivity();
  const thought = state.settings.thoughtLibrary?.days.find((v) => v.date === date);
  const [query, setQuery] = useState(params.get('query') || ''),
    [start, setStart] = useState(''),
    [end, setEnd] = useState(''),
    [browse, setBrowse] = useState(params.has('query'));
  const [results, setResults] = useState<JournalEntry[]>([]),
    [error, setError] = useState(''),
    [page, setPage] = useState(0);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [writingMode, setWritingMode] = useState(false);
  useEffect(() => {
    if (!writingMode) return;
    const exit = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setWritingMode(false);
    };
    window.addEventListener('keydown', exit);
    return () => window.removeEventListener('keydown', exit);
  }, [writingMode]);
  useEffect(() => {
    if (!browse) return;
    let alive = true;
    const timer = setTimeout(() => {
      void window.workspaceAPI
        .invoke('journal:search', { query, ...(start ? { start } : {}), ...(end ? { end } : {}) })
        .then((rows) => {
          if (alive) {
            setResults(rows);
            setPage(0);
            setError('');
          }
        })
        .catch((e) => {
          if (alive) setError(e.message);
        });
    }, 160);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [browse, query, start, end, snapshot?.journal]);
  const open = (value: string) => {
    if (validDate(value)) setParams({ date: value });
  };
  if (!snapshot) return <LoadState />;
  const entry = snapshot.journal.find((j) => j.date === date);
  return (
    <div className={`reflection-page journal-page${writingMode ? ' writing-mode' : ''}`}>
      <div className="journal-datebar">
        <div className="row-actions">
          <button
            className="icon-button"
            aria-label="Previous journal day"
            onClick={() => open(shiftDay(date, -1))}
          >
            <ChevronLeft />
          </button>
          <input
            type="date"
            aria-label="Journal date"
            value={date}
            onChange={(e) => open(e.target.value)}
          />
          <button
            className="icon-button"
            aria-label="Next journal day"
            onClick={() => open(shiftDay(date, 1))}
          >
            <ChevronRight />
          </button>
          <button className="btn-ghost" onClick={() => open(localDate())}>
            Today
          </button>
        </div>
        <div className="journal-page-actions">
          <button className="btn-ghost" aria-expanded={browse} onClick={() => setBrowse(!browse)}>
            <Search />
            Search journal
          </button>
          <button
            className="btn-ghost"
            aria-pressed={writingMode}
            onClick={() => setWritingMode(!writingMode)}
          >
            {writingMode ? <Minimize2 /> : <Maximize2 />}
            {writingMode ? 'Exit writing mode' : 'Writing mode'}
          </button>
        </div>
      </div>
      {browse && (
        <div className="journal-browser">
          <Field label="Search journal">
            <input
              className="input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your words…"
            />
          </Field>
          <div className="reflection-grid">
            <Field label="From">
              <input
                className="input"
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </Field>
            <Field label="Until">
              <input
                className="input"
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </Field>
          </div>
          <ActionError error={error} />
          <div className="journal-search-results">
            {results.slice(page * 30, (page + 1) * 30).map((j) => (
              <button
                key={j.date}
                onClick={() => {
                  open(j.date);
                  setBrowse(false);
                }}
              >
                <strong>{j.date}</strong>
                <small>{j.text || 'Empty entry'}</small>
              </button>
            ))}
            {!results.length && <p className="muted">No entries in this search.</p>}
          </div>
          {results.length > 30 && (
            <div className="row-actions">
              <button className="btn-ghost" disabled={!page} onClick={() => setPage(page - 1)}>
                Previous
              </button>
              <span>
                {page + 1} / {Math.ceil(results.length / 30)}
              </span>
              <button
                className="btn-ghost"
                disabled={(page + 1) * 30 >= results.length}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
      <PageHeader
        title={new Date(date + 'T12:00:00').toLocaleDateString(undefined, {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}
        description={new Date(date + 'T12:00:00').toLocaleDateString(undefined, {
          weekday: 'long',
        })}
      />
      {thought && (
        <details
          className="journal-thought"
          key={`thought-${date}`}
          open={params.get('thought') === '1' ? true : undefined}
        >
          <summary>Return to this day’s thought</summary>
          <p>{thought.text}</p>
          <small className="muted">{thought.author}</small>
          {thought.prompt && <p className="reflection-question">{thought.prompt}</p>}
        </details>
      )}
      <LogseqJournalFrame key={date} date={date}>
        <JournalWriter date={date} entry={entry} />
      </LogseqJournalFrame>
      {snapshot.journal.some((j) => j.date < date) && (
        <section className="journal-recent-pages" aria-label="Recent daily pages">
          <h2>Recent daily pages</h2>
          {snapshot.journal
            .filter((j) => j.date < date)
            .slice(0, 3)
            .map((j) => (
              <details
                key={j.date}
                open={expandedDay === j.date}
                onToggle={(event) => {
                  if (event.currentTarget.open) setExpandedDay(j.date);
                  else setExpandedDay((current) => (current === j.date ? null : current));
                }}
              >
                <summary>
                  {new Date(j.date + 'T12:00:00').toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  <small>{j.text.slice(0, 100) || 'An open page'}</small>
                </summary>
                {expandedDay === j.date && (
                  <LogseqJournalFrame date={j.date}>
                    <JournalWriter key={j.date} date={j.date} entry={j} />
                  </LogseqJournalFrame>
                )}
              </details>
            ))}
        </section>
      )}
    </div>
  );
}
