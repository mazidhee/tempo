import {
  guardShouldRun,
  matchesApp,
  selectedTargets,
  type FocusSettings,
} from '../../shared/focus';
import type { Timer } from '../../shared/productivity';
import type { HostsAdapter } from './hosts';
import { safeUserApp, type ProcessAdapter } from './processes';
export class FocusGuard {
  active = false;
  error = '';
  repairedAt: string | null = null;
  private domains = '';
  private seen = new Map<string, Set<number>>();
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
      const apps = (await this.processes.list()).filter(
        (a) => safeUserApp(a) && matchesApp(a.name, targets.apps),
      );
      const groups = new Map<string, typeof apps>();
      for (const app of apps) {
        const key = app.executable.toLowerCase();
        groups.set(key, [...(groups.get(key) || []), app]);
      }
      const current = new Map<string, Set<number>>();
      for (const [key, group] of groups) {
        const pids = new Set(group.map((app) => app.pid)),
          prior = this.seen.get(key);
        current.set(key, pids);
        this.seen.set(key, pids);
        // Additional subprocesses are one continuing app presence. A wholly
        // new set of PIDs is a reopening, even without an empty poll between.
        if (!prior || ![...pids].some((pid) => prior.has(pid))) {
          this.record(group[0].name);
          this.notify(
            settings.mode === 'gentle'
              ? `${group[0].name} is on your Focus Guard list.`
              : `Focus Guard is closing ${group[0].name}.`,
          );
        }
        if (settings.mode === 'close') for (const app of group) await this.processes.close(app);
      }
      this.seen = current;
    } catch (e) {
      this.error = `Focus Guard: ${(e as Error).message}`;
      throw e;
    }
  }
}
