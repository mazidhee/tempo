# Local and optional GitHub backups

The SQLite workspace remains authoritative and offline. The new backup module
creates a complete JSON snapshot on first open each day and retains 14 daily files
under the existing user-data directory. Manual local snapshots replace today's
copy. Migration, import and deletion SQLite safety copies remain separate.

GitHub uploading is a manual action in Settings. It checks repository privacy,
then writes a unique `.tempo-backup` file on `tempo-backups`, preserving source on
main. Its fixed API host rejects redirects and uses a bounded timeout. GitHub
permission/network errors never display credentials or raw server output.
The integration follows the official [Contents API](https://docs.github.com/en/rest/repos/contents).

Before upload, Tempo serializes a consistent transaction snapshot, keeps a local
copy, compresses it and encrypts it with AES-256-GCM. Each file uses random salt
and nonce; scrypt derives the key (N=32768, r=8, p=1). Authentication failure,
wrong password, unsupported version and excessive data fail before import. The
portable envelope version is 1; the decompressed payload limit is 20 MB.

Passwords are never persisted. The owner must retain the password to restore on
another computer. Optional GitHub tokens use Electron
[safeStorage](https://www.electronjs.org/docs/latest/api/safe-storage), separate
from SQLite and backups. Existing local Git Credential Manager credentials may
be reused without launching a login prompt. Credentials stay in the main process.

Restore decrypts, previews record counts, then uses the existing validated,
transactional additive import with a prior safety copy. Existing records take
precedence. It does not rewind edits, delete newer records or replace a running
timer. Code rollback is separate from data restoration.

Automated transport tests use injected responses and never upload owner data.
An actual owner backup requires choosing a password and clicking the Settings
button. Repository privacy was verified separately for the authorised source push.
