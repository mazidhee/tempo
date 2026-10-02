import {
  guardShouldRun,
  matchesApp,
  selectedTargets,
  type FocusSettings,
} from '../../shared/focus';
import type { Timer } from '../../shared/productivity';
import type { HostsAdapter } from './hosts';
import { safeUserApp, type ProcessAdapter } from './processes';
import { guardError } from '../../shared/guardError';
export class FocusGuard {
  active = false;
  error = '';
  diagnostics = '';
  websiteError = '';
  appError = '';
  appsActive = false;
  websitesActive = false;
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
      this.diagnostics = '';
      this.websiteError = '';
      this.appError = '';
      this.appsActive = false;
      this.websitesActive = false;
      this.cleanupFailed = false;
      this.suspendedRunId = suspendRunId ?? null;
      this.repairedAt = new Date().toISOString();
      this.seen.clear();
    } catch (e) {
      this.cleanupFailed = true;
      this.error = guardError(e, 'cleanup');
      this.diagnostics = String(e).slice(0, 4000);
      throw new Error(this.error);
    }
  }
  retryWebsites() {
    this.failedDomains = null;
  }
  async sync(settings: FocusSettings, timer: Timer, stillCurrent = () => true) {
    const active = guardShouldRun(settings, timer) && timer.runId !== this.suspendedRunId,
      targets = selectedTargets(settings);
    const desired = active ? targets.websites.join('\n') : '';
    // A denied UAC request must not open a fresh prompt on every poll. Repair is
    // the explicit retry path; changing the desired block also permits a retry.
    this.active = active;
    this.appsActive = false;
    const syncWebsites = async () => {
      if (this.failedDomains === desired) return;
      if (desired === this.domains) {
        this.websitesActive = active && !!desired;
        this.websiteError = '';
        return;
      }
      try {
        await this.hosts.replace(active ? targets.websites : []);
        this.domains = desired;
        this.failedDomains = null;
        this.websiteError = '';
        this.websitesActive = active && !!desired;
      } catch (e) {
        this.failedDomains = desired;
        this.websiteError = guardError(e, desired ? 'websites' : 'cleanup');
        this.diagnostics = String(e).slice(0, 4000);
        // Keep the last verified website state until cleanup succeeds.
      }
    };
    // App enforcement is independent of website permission and starts even
    // while Windows is displaying an elevation prompt.
    const websites = syncWebsites();
    try {
      if (!active) {
        this.appError = '';
        this.seen.clear();
        return;
      }
      if (!targets.apps.length) {
        this.appError = '';
        return;
      }
      const apps = (await this.processes.list()).filter(
        (a) => safeUserApp(a) && matchesApp(a.name, targets.apps),
      );
      if (!stillCurrent()) return;
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
        if (settings.mode === 'close')
          for (const app of group) {
            if (!stillCurrent()) return;
            await this.processes.close(app);
          }
      }
      this.seen = current;
      this.appsActive = true;
      this.appError = '';
    } catch (e) {
      this.appError = guardError(e, 'apps');
      this.diagnostics = String(e).slice(0, 4000);
      throw new Error(this.appError);
    } finally {
      await websites;
      if (!this.cleanupFailed)
        this.error = [this.websiteError, this.appError].filter(Boolean).join(' ');
    }
  }
}
