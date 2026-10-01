import { useState } from 'react';
import { ShieldOff } from 'lucide-react';
import { emergencyPhrase } from '../../../shared/focus';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Modal } from '../../components/ui';
import { useClock } from '../../hooks/useClock';
import { useFocus } from './useFocus';
import './focus.css';
/** Integrator mounts this in app chrome, keeping exit reachable on every page. */
export function FocusEmergency({ compact = false }: { compact?: boolean }) {
  const { snapshot, error, run } = useFocus(),
    [open, setOpen] = useState(false),
    [phrase, setPhrase] = useState('');
  const now = useClock(),
    readyAt = snapshot?.emergencyReadyAt;
  const seconds = readyAt ? Math.max(0, Math.ceil((readyAt - now) / 1000)) : 30;
  const canExit = phrase === emergencyPhrase || seconds === 0;
  if (!snapshot) return null;
  return (
    <>
      {snapshot.guard.error && (
        <span className="focus-warning small" role="alert">
          {snapshot.guard.error}
        </span>
      )}
      <Button
        variant="outline"
        size={compact ? 'icon' : 'sm'}
        aria-label="Emergency exit"
        title="Emergency exit"
        onClick={() => {
          setPhrase('');
          setOpen(true);
          void run(window.workspaceAPI.invoke('focus:emergencyBegin'));
        }}
      >
        <ShieldOff />
        {!compact && 'Emergency exit'}
      </Button>
      {open && (
        <Modal title="End focus and release Guard" onClose={() => setOpen(false)}>
          <p className="muted">
            Type “{emergencyPhrase}” or wait {seconds} seconds. An unfinished phase is not logged as
            completed; this exit is recorded as a focus break.
          </p>
          <label className="focus-field">
            Exit phrase
            <Input value={phrase} onChange={(e) => setPhrase(e.target.value)} autoFocus />
          </label>
          <p className="muted" role="status">
            {seconds ? `${seconds} seconds until exit is available` : 'You can exit now.'}
          </p>
          {error && <p role="alert">{error}</p>}
          <div className="focus-actions">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Keep focusing
            </Button>
            <Button
              disabled={!canExit}
              onClick={async () => {
                try {
                  await window.workspaceAPI.invoke('focus:emergencyExit', { phrase });
                  setOpen(false);
                  setPhrase('');
                } catch (e) {
                  void run(Promise.reject(e));
                }
              }}
            >
              End focus
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
