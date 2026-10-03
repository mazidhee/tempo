import { useEffect, useRef, useState } from 'react';
import { Download, CloudUpload as Github, ShieldCheck, RotateCcw } from 'lucide-react';
import type { BackupStatus, BackupPreview } from '../../shared/backup';
import { Modal } from './ui';
export default function BackupSettings() {
  const [status, setStatus] = useState<BackupStatus | null>(null),
    [repository, setRepository] = useState('mazidhee/tempo'),
    [token, setToken] = useState('');
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  const working = useRef(false),
    file = useRef<HTMLInputElement>(null);
  const [upload, setUpload] = useState(false),
    [password, setPassword] = useState(''),
    [confirmation, setConfirmation] = useState('');
  const [encrypted, setEncrypted] = useState(''),
    [preview, setPreview] = useState<BackupPreview | null>(null);
  const refresh = async () => {
    const next = await window.workspaceAPI.invoke('backup:status');
    setStatus(next);
    setRepository(next.repository);
  };
  useEffect(() => {
    void refresh().catch((e) => setError(String(e)));
  }, []);
  const act = async (work: () => Promise<void>) => {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await work();
    } catch (e) {
      setError(String(e));
    } finally {
      working.current = false;
      setBusy(false);
    }
  };
  return (
    <div className="settings-stack backup-settings">
      <section className="panel">
        <div className="section-heading">
          <h2>Local recovery</h2>
          <ShieldCheck />
        </div>
        <p className="muted">
          Tempo keeps a snapshot on the first open each day and retains the latest 14 days.
          Migration and import safety copies stay separate. Nothing is sent online automatically.
        </p>
        <button
          className="btn-secondary"
          disabled={busy || !status}
          onClick={() =>
            void act(async () => {
              await window.workspaceAPI.invoke('backup:local');
              await refresh();
              setMessage('Today’s local snapshot updated.');
            })
          }
        >
          <Download />
          Save local snapshot now
        </button>
        <div className="backup-local-list">
          {status?.local.map((entry) => (
            <div className="setting-row" key={entry.id}>
              <div>
                <strong>{entry.date}</strong>
                <p className="muted small">
                  {Math.ceil(entry.bytes / 1024)} KB · complete workspace
                </p>
              </div>
              <button
                className="btn-secondary"
                disabled={busy}
                aria-label={`Preview backup ${entry.date}`}
                onClick={() =>
                  void act(async () =>
                    setPreview(await window.workspaceAPI.invoke('backup:readLocal', entry.id)),
                  )
                }
              >
                <RotateCcw />
                Preview restore
              </button>
            </div>
          ))}
        </div>
      </section>
      <section className="panel">
        <div className="section-heading">
          <h2>Private GitHub backup</h2>
          <Github />
        </div>
        <p className="muted">
          Upload an encrypted copy only when you choose. Backups go to the{' '}
          <strong>tempo-backups</strong> branch, leaving your app source on main. Tempo checks that
          the repository is private before each upload.
        </p>
        <p className="muted small">
          Your backup password stays out of the file and out of GitHub. Keep it somewhere
          safe—you’ll need it on a new computer.
        </p>
        <div className="form-stack">
          <label>
            Repository
            <input
              className="input"
              aria-label="Backup repository"
              value={repository}
              maxLength={140}
              onChange={(e) => setRepository(e.target.value)}
              placeholder="owner/repository"
            />
          </label>
          <label>
            GitHub token (optional)
            <input
              className="input"
              type="password"
              autoComplete="off"
              aria-label="GitHub repository token"
              value={token}
              maxLength={500}
              onChange={(e) => setToken(e.target.value)}
              placeholder={
                status?.hasToken
                  ? 'A protected token is saved'
                  : 'Use your existing Git sign-in, or paste a token'
              }
            />
          </label>
          <p className="muted small">
            For another computer, use a fine-grained GitHub token limited to this repository with
            Contents: Read and write. A saved token is protected by your operating system and
            excluded from all backups.
          </p>
          <div className="backup-actions">
            <button
              className="btn-secondary"
              disabled={busy}
              onClick={() =>
                void act(async () => {
                  await window.workspaceAPI.invoke('backup:configure', {
                    repository: repository.trim(),
                    ...(token.trim() ? { token: token.trim() } : {}),
                  });
                  setToken('');
                  await refresh();
                  setMessage('Backup connection saved.');
                })
              }
            >
              Save connection
            </button>
            {status?.hasToken && (
              <button
                className="btn-secondary"
                disabled={busy}
                onClick={() =>
                  void act(async () => {
                    await window.workspaceAPI.invoke('backup:configure', {
                      repository: status.repository,
                      token: '',
                    });
                    await refresh();
                    setMessage('Saved token removed.');
                  })
                }
              >
                Remove saved token
              </button>
            )}
          </div>
        </div>
        <div className="backup-actions">
          <button
            className="btn-primary"
            disabled={busy || !status || repository.trim() !== status.repository || !!token}
            onClick={() => {
              setPassword('');
              setConfirmation('');
              setUpload(true);
            }}
          >
            <Github />
            Back up to GitHub
          </button>
          <button className="btn-secondary" disabled={busy} onClick={() => file.current?.click()}>
            <RotateCcw />
            Restore encrypted file
          </button>
        </div>
        {status?.lastUpload && (
          <p className="muted small">Last upload: {new Date(status.lastUpload).toLocaleString()}</p>
        )}
        <p className="muted small">
          To recover elsewhere, download a .tempo-backup file from your repository’s tempo-backups
          branch, then use Restore encrypted file here.
        </p>
        <input
          ref={file}
          type="file"
          className="sr-only"
          accept=".tempo-backup"
          aria-label="Choose encrypted backup"
          onChange={async (e) => {
            const selected = e.target.files?.[0];
            e.target.value = '';
            if (!selected) return;
            if (selected.size > 20 * 1024 * 1024) {
              setError('Backup exceeds the 20 MB limit.');
              return;
            }
            try {
              setEncrypted(await selected.text());
              setPassword('');
              setError('');
            } catch {
              setError('Could not read the selected backup.');
            }
          }}
        />
      </section>
      {status?.error && (
        <p role="alert" className="inline-error">
          {status.error}
        </p>
      )}
      {message && (
        <p role="status" className="settings-message">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="inline-error">
          {error}
        </p>
      )}
      {(upload || encrypted) && (
        <Modal
          title={upload ? 'Encrypt and upload backup' : 'Unlock your backup'}
          onClose={() => {
            if (!busy) {
              setUpload(false);
              setEncrypted('');
              setPassword('');
              setConfirmation('');
            }
          }}
        >
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              void act(async () => {
                if (upload) {
                  const result = await window.workspaceAPI.invoke('backup:upload', password);
                  setMessage(
                    `Encrypted backup saved to ${result.repository} · ${result.branch} · commit ${result.commit.slice(0, 8)}.`,
                  );
                  await refresh();
                } else
                  setPreview(
                    await window.workspaceAPI.invoke('backup:decrypt', {
                      content: encrypted,
                      password,
                    }),
                  );
                setUpload(false);
                setEncrypted('');
                setPassword('');
                setConfirmation('');
              });
            }}
          >
            <p className="muted">
              {upload
                ? `This sends your complete encrypted workspace to ${status?.repository}. Keep this password to recover it later.`
                : 'Enter the password you chose when uploading. You can review the contents before merging.'}
            </p>
            <label>
              Backup password
              <input
                autoFocus
                className="input"
                type="password"
                autoComplete={upload ? 'new-password' : 'current-password'}
                maxLength={1024}
                minLength={upload ? 12 : undefined}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {upload && (
              <label>
                Confirm password
                <input
                  className="input"
                  type="password"
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                />
              </label>
            )}
            {error && (
              <p role="alert" className="inline-error">
                {error}
              </p>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                disabled={busy}
                onClick={() => {
                  setUpload(false);
                  setEncrypted('');
                  setPassword('');
                  setConfirmation('');
                }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                disabled={
                  busy ||
                  !password ||
                  (upload && (password.length < 12 || password !== confirmation))
                }
              >
                {busy
                  ? upload
                    ? 'Uploading…'
                    : 'Unlocking…'
                  : upload
                    ? 'Encrypt and upload'
                    : 'Preview backup'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {preview && (
        <Modal
          title="Review backup before merging"
          onClose={() => {
            if (!busy) setPreview(null);
          }}
        >
          <p className="muted">
            Backup from{' '}
            {preview.summary.exportedAt
              ? new Date(preview.summary.exportedAt).toLocaleString()
              : 'an earlier workspace'}
            .
          </p>
          <dl className="backup-summary">
            {Object.entries(preview.summary)
              .filter(([key]) => key !== 'exportedAt')
              .map(([key, value]) => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
          </dl>
          <p className="muted small">
            Missing records will be added. Existing records take precedence; running timers stay
            intact. This does not rewind edits or deletions. A safety copy is saved before merging.
          </p>
          {error && (
            <p role="alert" className="inline-error">
              {error}
            </p>
          )}
          <div className="modal-actions">
            <button className="btn-secondary" disabled={busy} onClick={() => setPreview(null)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              disabled={busy}
              onClick={() =>
                void act(async () => {
                  await window.habitAPI.importBackup(preview.data);
                  setPreview(null);
                  window.location.reload();
                })
              }
            >
              {busy ? 'Merging…' : 'Merge backup'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
