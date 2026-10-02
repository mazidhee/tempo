import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { FocusSettings as Settings, RunningApp } from '../../../shared/focus';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Switch } from '../../components/ui/switch';
import { FocusEmergency } from './EmergencyExit';
import { useFocus } from './useFocus';
import { GuardNotice } from './GuardNotice';
import './focus.css';
export function FocusSettings() {
  const { snapshot, error, run } = useFocus(),
    [draft, setDraft] = useState<Settings | null>(null),
    [apps, setApps] = useState<RunningApp[]>([]),
    [pickerError, setPickerError] = useState(''),
    [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (snapshot && !dirty) setDraft(snapshot.settings);
  }, [snapshot, dirty]);
  if (!draft || !snapshot) return <p role="status">{error || 'Loading Focus settings…'}</p>;
  const change = (value: Settings) => {
    setDirty(true);
    setDraft(value);
  };
  const updateBlock = (id: string, value: Partial<Settings['blocklists'][number]>) =>
    change({
      ...draft,
      blocklists: draft.blocklists.map((b) => (b.id === id ? { ...b, ...value } : b)),
    });
  return (
    <section className="focus-settings form-stack" aria-label="Focus settings">
      <div className="section-heading">
        <h2>Focus Guard</h2>
        <FocusEmergency />
      </div>
      <p className="muted">
        Choose distractions, then opt in. Website blocking requires an administrator prompt. Guard
        stays active while paused and normally releases during breaks. Closing Tempo keeps your
        timer in the tray.
      </p>
      <p className="muted small">
        Gentle mode only notifies you. Choose Close app to enforce app blocking. App checks do not
        require administrator permission and keep working if website permission is declined.
      </p>
      <GuardNotice guard={snapshot.guard} error={error} />
      <p className="muted small">
        Repair releases Guard for the current phase. It can activate again when a new phase starts.
      </p>
      {(['enabled', 'blockBreaks', 'strict'] as const).map((key) => (
        <label className="focus-setting-row" key={key}>
          <span>
            {key === 'enabled'
              ? 'Enable Focus Guard'
              : key === 'blockBreaks'
                ? 'Also block during breaks'
                : 'Strict mode: use Emergency exit to end a phase'}
          </span>
          <Switch
            checked={draft[key]}
            onCheckedChange={(checked) => change({ ...draft, [key]: checked })}
          />
        </label>
      ))}
      <label className="focus-field">
        When a chosen app opens
        <select
          className="input"
          value={draft.mode}
          onChange={(e) => change({ ...draft, mode: e.target.value as Settings['mode'] })}
        >
          <option value="gentle">Gentle — notify only</option>
          <option value="close">Close app — graceful close, then force if needed</option>
        </select>
      </label>
      <p className="muted small">
        Closing apps can discard unsaved work. Only apps on selected lists are closed; system
        processes and Tempo are excluded. Websites match exactly: include www and other subdomains
        you use.
      </p>
      <Button
        variant="outline"
        onClick={async () => {
          setPickerError('');
          try {
            setApps(await window.workspaceAPI.invoke('focus:runningApps'));
          } catch (e) {
            setPickerError((e as Error).message);
          }
        }}
      >
        Refresh running app picker
      </Button>
      {pickerError && <p role="alert">{pickerError}</p>}
      <div className="focus-blocklists">
        {draft.blocklists.map((b) => (
          <fieldset className="focus-blocklist" key={b.id}>
            <legend>
              <label>
                <input
                  type="checkbox"
                  checked={draft.selected.includes(b.id)}
                  onChange={(e) =>
                    change({
                      ...draft,
                      selected: e.target.checked
                        ? [...draft.selected, b.id]
                        : draft.selected.filter((x) => x !== b.id),
                    })
                  }
                />{' '}
                {b.name}
              </label>
            </legend>
            <label className="focus-field">
              List name
              <Input value={b.name} onChange={(e) => updateBlock(b.id, { name: e.target.value })} />
            </label>
            <label className="focus-field">
              Website domains, one per line
              <textarea
                className="input"
                rows={3}
                value={b.websites.join('\n')}
                placeholder="web.whatsapp.com"
                onChange={(e) =>
                  updateBlock(b.id, {
                    websites: e.target.value
                      .split(/\n|,/)
                      .map((s) => s.trim().toLowerCase())
                      .filter(Boolean),
                  })
                }
              />
            </label>
            <label className="focus-field">
              Add a running app
              <select
                className="input"
                value=""
                onChange={(e) => {
                  if (e.target.value && !b.apps.includes(e.target.value))
                    updateBlock(b.id, { apps: [...b.apps, e.target.value] });
                }}
              >
                <option value="">Choose an app</option>
                {[...new Set(apps.map((a) => a.name))].sort().map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
            <div className="focus-actions">
              {b.apps.map((name) => (
                <Button
                  size="sm"
                  variant="secondary"
                  key={name}
                  onClick={() => updateBlock(b.id, { apps: b.apps.filter((x) => x !== name) })}
                >
                  {name}
                  <Trash2 aria-label={`Remove ${name}`} />
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                change({
                  ...draft,
                  blocklists: draft.blocklists.filter((x) => x.id !== b.id),
                  selected: draft.selected.filter((x) => x !== b.id),
                })
              }
            >
              <Trash2 />
              Remove list
            </Button>
          </fieldset>
        ))}
      </div>
      <Button
        variant="outline"
        onClick={() =>
          change({
            ...draft,
            blocklists: [
              ...draft.blocklists,
              { id: crypto.randomUUID(), name: 'Custom', apps: [], websites: [] },
            ],
          })
        }
      >
        <Plus />
        Add custom list
      </Button>
      <div className="focus-warning">
        <strong>Browser secure DNS can bypass hosts blocking.</strong>
        <p>
          In Chrome or Edge, open Settings → Privacy and security → Security, then turn off “Use
          secure DNS”. In Firefox, open Settings → Privacy & Security → DNS over HTTPS and select
          Off. Guard does not block your phone.
        </p>
      </div>
      <h3>Global shortcuts</h3>
      {(['toggle', 'skip', 'stop'] as const).map((key) => (
        <label className="focus-field" key={key}>
          {key === 'toggle'
            ? 'Start / pause last preset'
            : key === 'skip'
              ? 'Skip phase'
              : 'Stop phase'}
          <Input
            value={draft.shortcuts[key]}
            placeholder="Leave empty to disable"
            onChange={(e) =>
              change({ ...draft, shortcuts: { ...draft.shortcuts, [key]: e.target.value } })
            }
          />
        </label>
      ))}
      <p className="muted small">
        Use Electron accelerators such as CommandOrControl+Shift+F. Privacy keeps Ctrl/Cmd+Shift+P.
        Conflicts are reported after registration.
      </p>
      {snapshot.shortcutErrors.map((e) => (
        <p role="alert" key={e}>
          {e}
        </p>
      ))}
      <div className="focus-actions">
        <Button
          disabled={busy || !dirty}
          onClick={async () => {
            setBusy(true);
            try {
              await window.workspaceAPI.invoke('focus:settings', draft);
              setDirty(false);
            } catch (e) {
              void run(Promise.reject(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? 'Applying…' : 'Save Focus settings'}
        </Button>
        <Button
          variant="outline"
          onClick={() => void run(window.workspaceAPI.invoke('focus:repair'))}
        >
          Repair website blocking
        </Button>
      </div>
      <p className="muted small" role="status">
        {snapshot.guard.active ? 'Guard is active.' : 'Guard is released.'}
        {snapshot.guard.repairedAt
          ? ` Last repair: ${new Date(snapshot.guard.repairedAt).toLocaleString()}.`
          : ''}
      </p>
    </section>
  );
}
