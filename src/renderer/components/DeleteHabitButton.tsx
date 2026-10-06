import { useRef, useState, type ReactNode } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from './ui';
import { habitDataChanged } from '../hooks/useHabitData';
import { usePrivacy } from '../hooks/PrivacyContext';
export default function DeleteHabitButton({
  id,
  name,
  onDeleted,
  compact = false,
  renderTrigger,
}: {
  id: number;
  name: string;
  onDeleted?: () => void;
  compact?: boolean;
  renderTrigger?: (open:()=>void)=>ReactNode;
}) {
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const working = useRef(false),
    privacy = usePrivacy();
  return (
    <>
      {renderTrigger ? renderTrigger(()=>{setError('');setOpen(true);}) : <button
        className={compact ? 'icon-button' : 'btn-secondary'}
        aria-label="Delete habit"
        title="Delete habit"
        onClick={() => {
          setError('');
          setOpen(true);
        }}
      >
        <Trash2 />
        {!compact && 'Delete habit'}
      </button>}
      {open && (
        <Modal
          title="Delete this habit?"
          onClose={() => {
            if (!busy) setOpen(false);
          }}
        >
          <p>
            Permanently delete {privacy ? 'this private habit' : `“${name}”`} and its check-in
            history?
          </p>
          <p className="muted">
            Archive it instead to keep its history. A local safety copy is saved before deletion.
          </p>
          {error && (
            <p role="alert" className="inline-error">
              {error}
            </p>
          )}
          <div className="modal-actions">
            <button className="btn-secondary" disabled={busy} onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              disabled={busy}
              onClick={async () => {
                if (working.current) return;
                working.current = true;
                setBusy(true);
                try {
                  await window.habitAPI.deleteHabit(id);
                  habitDataChanged();
                  setOpen(false);
                  onDeleted?.();
                } catch (e) {
                  setError(String(e));
                } finally {
                  working.current = false;
                  setBusy(false);
                }
              }}
            >
              {busy ? 'Deleting…' : 'Delete permanently'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
