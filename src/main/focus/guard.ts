import {
  guardShouldRun,
  matchesApp,
  selectedTargets,
  type FocusSettings,
} from '../../shared/focus';
import type { Timer } from '../../shared/productivity';
import type { HostsAdapter } from './hosts';
import type { ProcessAdapter } from './processes';
export class FocusGuard {
  active = false;
  error = '';
  repairedAt: string | null = null;
  private domains = '';
  private seen = new Set<string>();
  private failedDomains: string | null = null;
  private cleanupFailed = false;
  private suspendedRunId: string | null = null;
  constructor(
    readonly hosts: HostsAdapter,
    readonly processes: ProcessAdapter,
    readonly record: (target: string) => void,
    readonly notify: (body: string) => void,
  ) {}
  async repair(suspendRunId?: string) {
    try {
      await this.hosts.replace([]);
      this.domains = '';
      this.failedDomains = null;
      this.active = false;
      this.error = '';
      this.cleanupFailed = false;
      this.suspendedRunId = suspendRunId ?? null;
      this.repairedAt = new Date().toISOString();
      this.seen.clear();
    } catch (e) {
      this.cleanupFailed = true;
      this.error = `Website cleanup needs attention: ${(e as Error).message}`;
      throw e;
    }
  }
  async sync(settings: FocusSettings, timer: Timer) {
    const active = guardShouldRun(settings, timer) && timer.runId !== this.suspendedRunId,
      targets = selectedTargets(settings);
    const desired = active ? targets.websites.join('\n') : '';
    // A denied UAC request must not open a fresh prompt on every poll. Repair is
    // the explicit retry path; changing the desired block also permits a retry.
    if (this.failedDomains === desired) return;
    try {
      if (desired !== this.domains) {
        try {
          await this.hosts.replace(active ? targets.websites : []);
          this.domains = desired;
          this.failedDomains = null;
        } catch (e) {
          this.failedDomains = desired;
          throw e;
        }
      }
      this.active = active;
      if (!this.cleanupFailed) this.error = '';
      if (!active) {
        this.seen.clear();
        return;
      }
      const apps = (await this.processes.list()).filter((a) => matchesApp(a.name, targets.apps));
      const current = new Set(apps.map((a) => a.executable.toLowerCase()));
      for (const app of apps) {
        const key = app.executable.toLowerCase();
        if (!this.seen.has(key)) {
          this.seen.add(key);
          this.record(app.name);
          this.notify(
            settings.mode === 'gentle'
              ? `${app.name} is on your Focus Guard list.`
              : `Focus Guard is closing ${app.name}.`,
          );
        }
        if (settings.mode === 'close') await this.processes.close(app);
      }
      this.seen = new Set([...this.seen].filter((k) => current.has(k)));
    } catch (e) {
      this.error = `Focus Guard: ${(e as Error).message}`;
      throw e;
    }
  }
}
