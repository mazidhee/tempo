import { Minus, Square, X } from 'lucide-react';
export function WindowControls() {
  if (!window.workspaceAPI) return null;
  return (
    <div className="window-controls no-drag" aria-label="Window controls">
      {[
        { action: 'minimize' as const, label: 'Minimize window', Icon: Minus },
        { action: 'maximize' as const, label: 'Maximize or restore window', Icon: Square },
        { action: 'close' as const, label: 'Close window', Icon: X },
      ].map(({ action, label, Icon }) => (
        <button
          key={action}
          type="button"
          className="icon-button"
          aria-label={label}
          onClick={() => void window.workspaceAPI.invoke('window:control', action)}
        >
          <Icon />
        </button>
      ))}
    </div>
  );
}
