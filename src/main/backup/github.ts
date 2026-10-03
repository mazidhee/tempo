import { randomUUID } from 'node:crypto';
/** Fixed GitHub endpoints, no redirects or credential-bearing URLs. Transport is injectable for tests. */
export class GitHubBackup {
  constructor(private request: typeof fetch = fetch) {}
  async upload(repository: string, token: string, encrypted: string) {
    if (!/^[A-Za-z0-9][A-Za-z0-9-]{0,38}\/[A-Za-z0-9_.-]{1,100}$/.test(repository))
      throw new Error('Enter a repository as owner/name.');
    const parsed = JSON.parse(encrypted);
    if (parsed?.format !== 'tempo-encrypted-backup' || parsed.version !== 1)
      throw new Error('Only encrypted backups can be uploaded.');
    const call = async (endpoint: string, method = 'GET', body?: unknown, allowMissing = false) => {
      let response: Response;
      try {
        response = await this.request(`https://api.github.com/repos/${repository}${endpoint}`, {
          method,
          redirect: 'error',
          signal: AbortSignal.timeout(30000),
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2026-03-10',
            'User-Agent': 'Tempo-local-backup',
            'Content-Type': 'application/json',
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
        });
      } catch {
        throw new Error(
          'Could not reach GitHub. Your local backup is safe; try again when online.',
        );
      }
      if (allowMissing && response.status === 404) return null;
      if (!response.ok)
        throw new Error(
          response.status === 401 || response.status === 403
            ? 'GitHub denied access. Check your sign-in and Contents write permission.'
            : response.status === 404
              ? 'Repository not found. Check the name and your access.'
              : `GitHub could not save this backup (${response.status}). Try again.`,
        );
      return response.json();
    };
    const repo = await call('');
    if (repo.private !== true)
      throw new Error('Backups require a private repository. Nothing was uploaded.');
    const branch = 'tempo-backups';
    if (!(await call(`/git/ref/heads/${branch}`, 'GET', undefined, true))) {
      const base = await call(`/git/ref/heads/${encodeURIComponent(repo.default_branch)}`);
      await call('/git/refs', 'POST', { ref: `refs/heads/${branch}`, sha: base.object.sha });
    }
    const filename = `backups/tempo-${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}.tempo-backup`;
    const result = await call(`/contents/${filename}`, 'PUT', {
      message: 'Save encrypted Tempo workspace backup',
      branch,
      content: Buffer.from(encrypted).toString('base64'),
    });
    return { path: filename, commit: String(result.commit.sha), repository, branch };
  }
}
