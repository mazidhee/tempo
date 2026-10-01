import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useHabitData } from '../hooks/useHabitData';
import { dayOutcome } from '../../shared/habits';
import MissedReasonModal from '../components/MissedReasonModal';
import { PageHeader } from '../components/ui';
export default function History() {
  const { habits, logs, today, mutate, error } = useHabitData();
  const [reason, setReason] = useState<{
      habitId: number;
      habitName: string;
      logDate: string;
    } | null>(null),
    [actionError, setActionError] = useState('');
  const dates = [...new Set(logs.map((l) => l.log_date))].sort().reverse();
  return (
    <div className="page habit-history">
      <PageHeader
        eyebrow="THE DAYS BEHIND YOU"
        title="Habit history."
        description="Notes, slips, freezes and missed reasons stay with their original dates."
      />
      {(error || actionError) && (
        <p className="inline-error" role="alert">
          {error || actionError}
        </p>
      )}
      {!dates.length && <p className="muted gentle-empty">No check-ins recorded yet.</p>}
      {dates.map((date) => (
        <details className="panel history-day" key={date} open={date === today}>
          <summary>
            {date}
            <span className="muted small">{date < today ? 'Locked day' : 'Today'}</span>
          </summary>
          {logs
            .filter((l) => l.log_date === date)
            .map((l) => {
              const h = habits.find((h) => h.id === l.habit_id);
              if (!h) return null;
              const status = dayOutcome(h, logs, date, today);
              return (
                <article className="history-row" key={l.id}>
                  <div>
                    <Link className="habit-name habit-title" to={`/habits/${h.id}`}>
                      {h.name}
                    </Link>
                    <span className="history-status">
                      {status.replace('_', ' ')}
                      {h.is_archived ? ' · archived' : ''}
                    </span>
                    {h.habit_type === 'quantity' && (
                      <p className="muted small">
                        {l.quantity} {h.quantity_unit}
                      </p>
                    )}
                    {l.note && <p className="habit-name muted">{l.note}</p>}
                    {(l.missed_reason || l.slip_reason || l.freeze_reason) && (
                      <p className="habit-name muted small">
                        {l.outcome === 'freeze'
                          ? `${l.freeze_reason} · ${l.freeze_note || ''}`
                          : l.slip_reason || l.missed_reason}
                      </p>
                    )}
                  </div>
                  {date < today && ['missed', 'slip'].includes(status) && (
                    <button
                      className="btn-secondary"
                      onClick={() => setReason({ habitId: h.id, habitName: h.name, logDate: date })}
                    >
                      {l.missed_reason ? 'Edit reason' : 'Add missed reason'}
                    </button>
                  )}
                </article>
              );
            })}
        </details>
      ))}
      {reason && (
        <MissedReasonModal
          habitName={reason.habitName}
          logDate={reason.logDate}
          onClose={() => setReason(null)}
          onSave={async (value) => {
            try {
              await mutate(() => window.habitAPI.addMissedReason({ ...reason, reason: value }));
              setReason(null);
            } catch (e) {
              setActionError((e as Error).message);
            }
          }}
        />
      )}
    </div>
  );
}
