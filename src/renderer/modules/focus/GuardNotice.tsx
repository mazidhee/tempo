import type { FocusSnapshot } from '../../../shared/focus';
import { Button } from '../../components/ui/button';
import { useFocus } from './useFocus';
/** One concise error surface, with bounded, opt-in diagnostics. */
export function GuardNotice({
  guard,
  error = '',
}: {
  guard: FocusSnapshot['guard'];
  error?: string;
}) {
  const { run, busy } = useFocus();
  if (!error && !guard.error)
    return guard.pending ? (
      <p className="muted small" role="status">
        Guard is applying your settings. Timer controls remain available.
      </p>
    ) : null;
  return (
    <div className="focus-warning">
      <p role="alert">{error || guard.error}</p>
      {!!guard.error && (
        <div className="focus-actions">
          <Button
            size="sm"
            variant="outline"
            disabled={busy || guard.pending}
            onClick={() => void run(() => window.workspaceAPI.invoke('focus:retryWebsites'))}
          >
            Retry websites
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy || guard.pending}
            onClick={() => void run(() => window.workspaceAPI.invoke('focus:repair'))}
          >
            Repair / release
          </Button>
        </div>
      )}
      {guard.diagnostics && (
        <details>
          <summary>Technical details</summary>
          <pre>{guard.diagnostics}</pre>
        </details>
      )}
    </div>
  );
}
