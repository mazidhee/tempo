import { useRef, useState } from 'react';
import { Download, Upload, Monitor, Sun, Moon, ShieldCheck, Keyboard, Check } from 'lucide-react';
import { useProductivity } from '../hooks/ProductivityProvider';
import { PageHeader, download, Modal } from '../components/ui';
import { localDate } from '../../shared/productivity';
import { themePalettes } from '../../shared/appearance';
import { navigation } from '../components/Sidebar';
import { settingsSections } from '../registry/settings';
import Personalization from '../components/Personalization';
import { useSearchParams } from 'react-router-dom';
import licenseText from '../../../LICENSE.md?raw';
export default function Settings() {
  const [params, setParams] = useSearchParams();
  const section = params.get('section') || 'general';
  const setSection = (next: string) => setParams({ section: next });
  const contribution = settingsSections.find((item) => item.id === section);
  const Section = contribution?.component;
  return (
    <div className="page settings-shell">
      <PageHeader title="Settings" description="Workspace preferences and local data." />
      <div className="settings-layout">
        <nav aria-label="Settings sections">
          <button
            className={section === 'general' ? 'selected' : ''}
            aria-current={section === 'general' ? 'page' : undefined}
            onClick={() => setSection('general')}
          >
            General
          </button>
          {[...settingsSections]
            .sort((a, b) => a.order - b.order)
            .map((item) => (
              <button
                key={item.id}
                className={section === item.id ? 'selected' : ''}
                aria-current={section === item.id ? 'page' : undefined}
                onClick={() => setSection(item.id)}
              >
                {item.label}
              </button>
            ))}
        </nav>
        <div>{Section ? <Section /> : <GeneralSettings />}</div>
      </div>
    </div>
  );
}
function GeneralSettings() {
  const { state, update } = useProductivity();
  const settings = state.settings;
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [licenseOpen, setLicenseOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const set = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) =>
    update((s) => ({ ...s, settings: { ...s.settings, [key]: value } }));
  const backup = async () => {
    setBusy(true);
    try {
      const data = await window.habitAPI.exportBackup();
      download(`tempo-backup-${localDate()}.json`, JSON.stringify(data, null, 2));
      setMessage('Backup exported. Keep a copy somewhere safe.');
    } catch (e) {
      setMessage(`Export failed: ${String(e)}`);
    } finally {
      setBusy(false);
    }
  };
  const restore = async () => {
    setBusy(true);
    try {
      await window.habitAPI.importBackup(pending);
      window.location.reload();
    } catch (e) {
      setMessage(`Import failed: ${String(e)}`);
      setPending(null);
      setBusy(false);
    }
  };
  return (
    <div className="settings-page">
      <section className="panel">
        <div className="section-heading">
          <h2>Profile and appearance</h2>
        </div>
        <Personalization />
        <label className="setting-name">
          What should we call you?
          <input
            className="input"
            placeholder="Your first name"
            maxLength={50}
            value={settings.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </label>
        <div className="setting-row">
          <div>
            <strong>Appearance</strong>
            <p className="muted">
              System follows your device, including changes throughout the day.
            </p>
          </div>
          <div className="tabs theme-tabs">
            {[
              { value: 'system', label: 'System', icon: Monitor },
              { value: 'light', label: 'Light', icon: Sun },
              { value: 'dark', label: 'Dark', icon: Moon },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                className={settings.theme === value ? 'selected' : ''}
                aria-pressed={settings.theme === value}
                onClick={() => set('theme', value as typeof settings.theme)}
              >
                <Icon />
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="theme-palette-section">
          <h3>Surface palette</h3>
          <p className="muted">
            Choose a workspace atmosphere. Each palette supports Light, Dark and System; your accent
            stays separate.
          </p>
          <div className="theme-palette-grid" role="group" aria-label="Surface palettes">
            {themePalettes.map((palette) => (
              <button
                type="button"
                key={palette.id}
                className="theme-palette-choice"
                aria-pressed={(settings.themePalette || 'default') === palette.id}
                onClick={() => set('themePalette', palette.id)}
              >
                <span
                  className="theme-palette-preview"
                  aria-hidden="true"
                  style={{ background: palette.dark[0], color: '#f7f8f8' }}
                >
                  <span style={{ background: palette.dark[1] }} />
                  <span style={{ background: palette.dark[3] }} />
                </span>
                <strong>
                  {palette.name}
                  {(settings.themePalette || 'default') === palette.id && <Check />}
                </strong>
                <small>{palette.description}</small>
              </button>
            ))}
          </div>
          <p className="muted small">
            Previews show dark mode. Switch Appearance to Dark to use those surfaces.
          </p>
        </div>
      </section>
      <section className="panel">
        <div className="section-heading">
          <h2>Notifications and sound</h2>
        </div>
        {[
          {
            key: 'sound' as const,
            title: 'End-of-phase sound',
            description: 'A soft chime when a focus session or break finishes.',
          },
          {
            key: 'notifications' as const,
            title: 'Focus notifications',
            description:
              'A desktop notification when a phase ends. Delivery follows your OS notification settings.',
          },
          {
            key: 'reminder' as const,
            title: 'End-of-day habit reminder',
            description:
              'A reminder at 11:30 PM for incomplete scheduled habits while the app is open.',
          },
        ].map((item) => (
          <div className="setting-row" key={item.key}>
            <div>
              <strong>{item.title}</strong>
              <p className="muted">{item.description}</p>
            </div>
            <button
              role="switch"
              aria-checked={settings[item.key]}
              aria-label={item.title}
              className={`switch ${settings[item.key] ? 'on' : ''}`}
              onClick={() => set(item.key, !settings[item.key])}
            >
              <i />
            </button>
          </div>
        ))}
      </section>
      <section className="panel">
        <div className="section-heading">
          <h2>Your data, in your hands</h2>
          <ShieldCheck />
        </div>
        <p className="muted">
          Everything stays on this computer in the original local database. Backups include all
          habits, archived history, tasks, presets, settings and completed sessions.
        </p>
        <div className="backup-actions">
          <button className="btn-primary" disabled={busy} onClick={backup}>
            <Download />
            Export JSON backup
          </button>
          <button className="btn-secondary" disabled={busy} onClick={() => input.current?.click()}>
            <Upload />
            Import backup
          </button>
          <button
            className="btn-secondary"
            disabled={busy}
            onClick={async () => {
              try {
                const result = await window.habitAPI.exportCSV();
                if (result.success) setMessage('Habit CSV exported.');
              } catch (e) {
                setMessage(`CSV export failed: ${String(e)}`);
              }
            }}
          >
            <Download />
            Habit CSV
          </button>
        </div>
        <p className="muted small">
          Import merges habits, tasks, focus history, Study and Reflection records. Existing records
          and running timers are kept. An empty workspace also restores preferences and presets; its
          timer stays idle and Focus Guard stays off. A safety copy is saved before import.
        </p>
        <input
          ref={input}
          type="file"
          accept=".json,application/json"
          className="sr-only"
          aria-label="Select JSON backup"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              if (file.size > 20 * 1024 * 1024) throw new Error('Backup is larger than 20 MB.');
              setPending(JSON.parse(await file.text()));
            } catch (err) {
              setMessage(`Could not read backup: ${String(err)}`);
            }
            e.target.value = '';
          }}
        />
        {message && (
          <p className="settings-message" role="status">
            <Check />
            {message}
          </p>
        )}
      </section>
      <section className="panel">
        <div className="section-heading">
          <h2>Keyboard shortcuts</h2>
          <Keyboard />
        </div>
        <div className="shortcut-row">
          <span>Open quick navigation</span>
          <kbd>Ctrl / Cmd K</kbd>
        </div>
        <div className="shortcut-row">
          <span>Move between sidebar links</span>
          <kbd>↑ ↓ Home End</kbd>
        </div>
        <div className="shortcut-row">
          <span>Close a dialog or leave focus mode</span>
          <kbd>Esc</kbd>
        </div>
      </section>
      <section className="panel">
        <div className="section-heading">
          <h2>Workspace icons</h2>
        </div>
        <p className="muted">
          Lucide icons · 18 px · 1.75 stroke. One family across the workspace.
        </p>
        <div className="icon-preview">
          {navigation.map(({ label, icon: Icon }) => (
            <div key={label}>
              <Icon />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>
      <p className="muted page-footnote">
        Tempo · A personal workspace built on your original Habit Tracker. Journal page framing
        includes adapted Logseq code. AGPL-3.0; no warranty.{' '}
        <button className="text-link" onClick={() => setLicenseOpen(true)}>
          Licence and source
        </button>
      </p>
      {licenseOpen && (
        <Modal title="Licence and source" onClose={() => setLicenseOpen(false)}>
          <p>
            Logseq contributors · journal component adapted into React by Tempo, October 3, 2026.
            You may modify and redistribute this work under GNU AGPL version 3. Source is included
            in your Tempo repository; the upstream component and exact commit are in
            third-party/logseq.
          </p>
          <pre className="license-text">{licenseText}</pre>
        </Modal>
      )}
      {pending !== null && (
        <Modal
          title="Import a backup?"
          onClose={() => {
            if (!busy) setPending(null);
          }}
        >
          <p className="muted">
            Missing habits, logs, tasks, presets and focus sessions will be added. Existing records
            take precedence and running timers are retained. Empty workspaces recover preferences
            and presets with an idle timer and Guard off. We’ll save a database safety copy first.
          </p>
          <div className="modal-actions">
            <button className="btn-secondary" disabled={busy} onClick={() => setPending(null)}>
              Cancel
            </button>
            <button className="btn-primary" disabled={busy} onClick={restore}>
              {busy ? 'Importing…' : 'Merge backup'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
