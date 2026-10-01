import { useState } from 'react';
import { Check, Snowflake, MessageSquare } from 'lucide-react';
import { isComplete, progress, canFreeze, type FreezeReason } from '../../shared/habits';
import type { Habit, HabitLog } from '../types';
import { Modal } from './ui';
import type { HabitRecord } from '../../main/database/db';
export default function HabitAction({
  habit,
  logs,
  date,
  today,
  onChange,
  compact = false,
}: {
  habit: Habit;
  logs: HabitLog[];
  date: string;
  today: string;
  onChange: () => void;
  compact?: boolean;
}) {
  const log = logs.find((l) => l.habit_id === habit.id && l.log_date === date);
  const [dialog, setDialog] = useState<
    'quantity' | 'slip' | 'freeze' | 'clean' | 'note' | 'complete' | null
  >(null);
  const [amount, setAmount] = useState('');
  const [quantityAction, setQuantityAction] = useState<'quantity' | 'set_quantity'>('quantity');
  const [reason, setReason] = useState<FreezeReason>('rest');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const complete = isComplete(habit, log),
    locked = date !== today;
  const write = async (action: HabitRecord['action'], extra: Partial<HabitRecord> = {}) => {
    setBusy(true);
    setError('');
    try {
      await window.habitAPI.recordHabit({ habitId: habit.id, logDate: date, action, ...extra });
      onChange();
      setDialog(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const open = (value: typeof dialog) => {
    setError('');
    setNote(value === 'note' || value === 'complete' ? log?.note || '' : '');
    setAmount('');
    setQuantityAction('quantity');
    setDialog(value);
  };
  const frozen = log?.outcome === 'freeze',
    slipped = log?.outcome === 'slip';
  return (
    <div className={`habit-actions ${compact ? 'compact' : ''}`}>
      {frozen ? (
        <>
          <span className="freeze-label">
            <Snowflake /> Frozen · {log.freeze_reason}
          </span>
          {!locked && (
            <button className="btn-ghost" disabled={busy} onClick={() => write('undo_freeze')}>
              Remove freeze
            </button>
          )}
        </>
      ) : habit.habit_type === 'quantity' ? (
        <>
          <div className="quantity-progress">
            <svg
              viewBox="0 0 40 40"
              role="img"
              aria-label={`${Math.round(progress(habit, log) * 100)}% of target`}
            >
              <circle cx="20" cy="20" r="16" />
              <circle
                className="ring-fill"
                cx="20"
                cy="20"
                r="16"
                pathLength="100"
                strokeDasharray={`${progress(habit, log) * 100} 100`}
              />
            </svg>
            <span>
              <strong>
                {log?.quantity || 0} / {habit.quantity_target} {habit.quantity_unit}
              </strong>
              <small>
                {complete ? 'Done' : `Complete at ${habit.completion_threshold ?? 100}%`}
              </small>
            </span>
          </div>
          {!locked && (
            <div className="quantity-buttons">
              {[250, 500].map((n) => (
                <button
                  className="btn-secondary"
                  disabled={busy}
                  key={n}
                  aria-label={`Add ${n} ${habit.quantity_unit}`}
                  onClick={() => write('quantity', { amount: n })}
                >
                  +{n}
                </button>
              ))}
              <button className="btn-secondary" disabled={busy} onClick={() => open('quantity')}>
                Custom
              </button>
            </div>
          )}
        </>
      ) : habit.habit_type === 'avoid' ? (
        <>
          {slipped ? (
            <span className="slip-label">
              Slip logged<span className="habit-name"> · {log.slip_reason}</span>
            </span>
          ) : (
            <button
              className={complete ? 'btn-secondary' : 'btn-primary'}
              disabled={locked || busy || complete}
              onClick={() => open('clean')}
            >
              {complete ? (
                <>
                  <Check /> Stayed clean
                </>
              ) : (
                'Stayed clean'
              )}
            </button>
          )}
          {!locked && (
            <button className="btn-secondary" disabled={busy} onClick={() => open('slip')}>
              {slipped ? 'Edit slip reason' : 'Slip'}
            </button>
          )}
        </>
      ) : (
        <button
          className={`check-button ${complete ? 'checked' : ''}`}
          disabled={locked || busy}
          aria-label={`${complete ? 'Uncheck' : 'Complete'} habit ${habit.name}`}
          aria-pressed={complete}
          onClick={() => (complete ? write('uncheck') : open('complete'))}
        >
          {complete && <Check />}
        </button>
      )}
      {!locked && !frozen && (
        <button
          className="icon-button"
          aria-label={`Add note for ${habit.name}`}
          onClick={() => open('note')}
        >
          <MessageSquare />
        </button>
      )}
      {canFreeze(habit, logs, date, new Date()) && (
        <button
          className="btn-ghost"
          disabled={busy}
          aria-label={`Freeze ${habit.name} on ${date}`}
          onClick={() => open('freeze')}
        >
          <Snowflake /> Freeze
        </button>
      )}
      {error && !dialog && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      {dialog && (
        <Modal
          title={
            dialog === 'quantity'
              ? 'Log quantity'
              : dialog === 'freeze'
                ? 'Cover this occurrence'
                : dialog === 'slip'
                  ? 'Log a slip'
                  : dialog === 'clean'
                    ? 'End-of-day confirmation'
                    : dialog === 'complete'
                      ? 'Complete habit'
                      : 'Check-in note'
          }
          onClose={() => setDialog(null)}
        >
          <p className="muted">
            <span className="habit-name">{habit.name}</span> · {date}
          </p>
          <form
            className="form-stack"
            onSubmit={async (e) => {
              e.preventDefault();
              if (dialog === 'quantity') await write(quantityAction, { amount: Number(amount) });
              else if (dialog === 'slip') await write('slip', { reason: note });
              else if (dialog === 'freeze') await write('freeze', { reason, note });
              else if (dialog === 'clean') await write('clean', { note });
              else if (dialog === 'complete') await write('complete', { note });
              else {
                setBusy(true);
                try {
                  await window.habitAPI.addNote({ habitId: habit.id, logDate: date, note });
                  onChange();
                  setDialog(null);
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }
            }}
          >
            {dialog === 'clean' && (
              <p>
                Your day is finished and you stayed clean. Confirm only when you’re ready to close
                this day.
              </p>
            )}
            {dialog === 'quantity' && (
              <>
                <label>
                  Quantity action
                  <select
                    className="select"
                    aria-label="Quantity action"
                    value={quantityAction}
                    onChange={(e) => {
                      const action = e.target.value as 'quantity' | 'set_quantity';
                      setQuantityAction(action);
                      setAmount(action === 'set_quantity' ? String(log?.quantity || 0) : '');
                    }}
                  >
                    <option value="quantity">Add amount</option>
                    <option value="set_quantity">Set total / correct entry</option>
                  </select>
                </label>
                <label>
                  {quantityAction === 'set_quantity' ? 'New total' : 'Amount to add'} (
                  {habit.quantity_unit})
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="any"
                    required
                    aria-label="Custom quantity"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </label>
              </>
            )}
            {dialog === 'freeze' && (
              <>
                <p>
                  Preserves your streak without adding a completion. Uses one freeze from{' '}
                  {date.slice(0, 7)}.
                </p>
                <label>
                  Reason
                  <select
                    className="select"
                    aria-label="Freeze reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value as FreezeReason)}
                  >
                    {['sick', 'travel', 'rest', 'other'].map((r) => (
                      <option key={r} value={r}>
                        {r[0].toUpperCase() + r.slice(1)}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            {dialog !== 'quantity' && (
              <label>
                {dialog === 'slip' ? 'Slip reason' : 'Short note'}
                <textarea
                  className="input habit-name"
                  aria-label={dialog === 'slip' ? 'Slip reason' : 'Short note'}
                  value={note}
                  maxLength={500}
                  required={dialog === 'slip' || (dialog === 'freeze' && reason === 'other')}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>
            )}
            {error && (
              <p className="inline-error" role="alert">
                {error}
              </p>
            )}
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setDialog(null)}>
                Cancel
              </button>
              <button className="btn-primary" disabled={busy}>
                {busy ? 'Saving…' : dialog === 'clean' ? 'Confirm stayed clean' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
