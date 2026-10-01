import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, Search } from 'lucide-react';
import { localDate } from '../../../shared/productivity';
import type { JournalEntry } from '../../../shared/reflection';
import { PageHeader, Empty } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useReflection } from './useReflection';
import { ActionError, Field, LoadState, Panel, ReflectionNav, useAction } from './ui';
export default function Journal() {
  const [params] = useSearchParams();
  const { snapshot } = useReflection(),
    action = useAction(),
    [date, setDate] = useState(params.get('date') || localDate()),
    [draft, setDraft] = useState(''),
    [query, setQuery] = useState(params.get('query') || ''),
    [start, setStart] = useState(''),
    [end, setEnd] = useState(''),
    [results, setResults] = useState<JournalEntry[] | null>(null),
    [searchError, setSearchError] = useState('');
  useEffect(() => {
    if (params.has('date')) setDate(params.get('date')!);
    if (params.has('query')) setQuery(params.get('query')!);
  }, [params]);
  const entry = snapshot?.journal.find((j) => j.date === date);
  useEffect(() => setDraft(entry?.text || ''), [date, entry?.updatedAt]);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      window.workspaceAPI
        .invoke('journal:search', { query, ...(start ? { start } : {}), ...(end ? { end } : {}) })
        .then((rows) => {
          if (active) {
            setResults(rows);
            setSearchError('');
          }
        })
        .catch((e) => {
          if (active) setSearchError(String(e.message || e));
        });
    }, 160);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, start, end, snapshot?.journal]);
  if (!snapshot) return <LoadState />;
  return (
    <div className="reflection-page">
      <PageHeader
        title="Journal"
        description="A sentence is enough. Keep the details that matter to you."
      />
      <ReflectionNav />
      <ActionError error={action.error} />
      <div className="reflection-layout">
        <Panel title="Write a journal line">
          <div className="reflection-stack">
            <Field label="Entry date">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Your entry">
              <textarea
                className="reflection-textarea"
                rows={8}
                maxLength={20000}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="What happened today?"
              />
            </Field>
            <div className="reflection-actions">
              <Button
                disabled={action.busy}
                onClick={() =>
                  void action.run(
                    () => window.workspaceAPI.invoke('journal:save', { date, text: draft }),
                    'Journal saved',
                  )
                }
              >
                Save journal
              </Button>
              {entry && (
                <span className="reflection-caption">
                  Saved {new Date(entry.updatedAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </Panel>
        <Panel
          title="Find a memory"
          description="Search words and phrases in your journal, or browse a date range."
        >
          <div className="reflection-stack">
            <Field label="Search journal">
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your words…"
              />
            </Field>
            <div className="reflection-grid">
              <Field label="From">
                <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
              </Field>
              <Field label="Until">
                <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
              </Field>
            </div>
            <ActionError error={searchError} />
            {results === null ? (
              <p role="status">Searching…</p>
            ) : results.length ? (
              <ul className="reflection-list">
                {results.map((j) => (
                  <li key={j.date} className="reflection-row">
                    <div className="reflection-grow">
                      <Button variant="ghost" onClick={() => setDate(j.date)}>
                        <BookOpen />
                        {j.date}
                      </Button>
                      <p className="reflection-journal-line">{j.text || 'Empty journal line'}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty
                icon={<Search />}
                title={query ? 'No matching entries' : 'Your journal starts here'}
                description={
                  query
                    ? 'Try another word or a wider date range.'
                    : 'Write something you would like to remember, then save it.'
                }
              />
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
