import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { localDate } from '../../../shared/productivity';
import { validDate, shiftDay } from '../../../shared/habits';
import type { JournalEntry } from '../../../shared/reflection';
import { PageHeader } from '../../components/ui';
import { JournalWriter } from '../../components/JournalWriter';
import { useReflection } from './useReflection';
import { ActionError, Field, LoadState } from './ui';
import '../../styles/document-pages.css';
export default function Journal() {
  const [params, setParams] = useSearchParams();
  const date = validDate(params.get('date') || '') ? params.get('date')! : localDate();
  const { snapshot } = useReflection();
  const [query, setQuery] = useState(params.get('query') || ''),
    [start, setStart] = useState(''),
    [end, setEnd] = useState(''),
    [browse, setBrowse] = useState(params.has('query'));
  const [results, setResults] = useState<JournalEntry[]>([]),
    [error, setError] = useState(''),
    [page, setPage] = useState(0);
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
    <div className="reflection-page journal-page">
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
        <button className="btn-ghost" aria-expanded={browse} onClick={() => setBrowse(!browse)}>
          <Search />
          Find a memory
        </button>
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
        description="A little space for your thoughts."
      />
      <JournalWriter key={date} date={date} entry={entry} />
    </div>
  );
}
