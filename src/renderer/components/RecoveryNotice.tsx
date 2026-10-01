import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Snowflake, X } from 'lucide-react';
import { useHabitData } from '../hooks/useHabitData';
import { canFreeze, dayOutcome, shiftDay } from '../../shared/habits';
export default function RecoveryNotice() {
  const { habits, logs, today, now, loading } = useHabitData(),
    navigate = useNavigate(),
    location = useLocation();
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => setDismissed(false), [today]);
  const count = useMemo(
    () =>
      habits
        .filter((h) => !h.is_archived)
        .reduce(
          (n, h) =>
            n +
            [1, 2, 3]
              .map((offset) => shiftDay(today, -offset))
              .filter(
                (date) =>
                  dayOutcome(h, logs, date, today) === 'missed' &&
                  canFreeze(h, logs, date, new Date(now)),
              ).length,
          0,
        ),
    [habits, logs, today, now],
  );
  if (loading || dismissed || !count || location.pathname === '/focus') return null;
  return (
    <aside className="recovery-notice" aria-label="Recent missed habits">
      <Snowflake />
      <p>
        {count} recent {count === 1 ? 'miss' : 'misses'} can still be covered with a freeze.
      </p>
      <button className="btn-ghost" onClick={() => navigate('/habits')}>
        Review recovery
      </button>
      <button
        className="icon-button"
        aria-label="Dismiss recovery prompt"
        onClick={() => setDismissed(true)}
      >
        <X />
      </button>
    </aside>
  );
}
