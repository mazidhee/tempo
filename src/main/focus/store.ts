import type Database from '../database/sqlite';
import {
  finishTimer,
  newTimer,
  pauseTimer,
  secondsLeft,
  startTimer,
  validProductivity,
  type Productivity,
  type Timer,
} from '../../shared/productivity';
import {
  emergencyPhrase,
  validateFocusSettings,
  type FocusBreak,
  type FocusCommand,
  type FocusSettings,
} from '../../shared/focus';
export function preserveMainFocus(db: Database, incoming: Productivity): Productivity {
  const current = readProductivity(db);
  if (
    current.timer.startedAt !== null &&
    JSON.stringify(incoming.presets.find((p) => p.id === current.timer.presetId)) !==
      JSON.stringify(current.presets.find((p) => p.id === current.timer.presetId))
  )
    throw new Error('Stop the current phase before changing its preset.');
  const timer = incoming.presets.some((p) => p.id === current.timer.presetId)
    ? current.timer
    : newTimer(incoming.presets[0], 'focus', current.timer.completed, current.timer.link);
  return { ...incoming, timer, sessions: current.sessions };
}
export function readProductivity(db: Database): Productivity {
  return JSON.parse(
    (db.prepare('SELECT json FROM productivity_state WHERE id=1').get() as { json: string }).json,
  );
}
export class FocusStore {
  emergencyReadyAt: number | null = null;
  constructor(
    readonly db: Database,
    readonly now: () => number = Date.now,
    readonly onComplete: (ended: Productivity) => void = () => {},
  ) {}
  productivity() {
    return readProductivity(this.db);
  }
  settings(): FocusSettings {
    return validateFocusSettings(
      JSON.parse(
        (this.db.prepare('SELECT json FROM focus_settings WHERE id=1').get() as { json: string })
          .json,
      ),
    );
  }
  events(): FocusBreak[] {
    return this.db
      .prepare('SELECT id,run_id AS runId,at,kind,target FROM focus_break_events ORDER BY at')
      .all() as unknown as FocusBreak[];
  }
  save(s: Productivity) {
    this.db.prepare('UPDATE productivity_state SET json=? WHERE id=1').run(JSON.stringify(s));
  }
  complete(): Productivity | null {
    const s = this.productivity();
    if (s.timer.deadline === null || secondsLeft(s.timer, this.now()) > 0) return null;
    this.save(finishTimer(s, this.now()));
    this.emergencyReadyAt = null;
    this.onComplete(s);
    return s;
  }
  command(input: unknown) {
    const c = input as FocusCommand;
    if (!c || !['start', 'pause', 'skip', 'stop', 'configure'].includes(c.action))
      throw new Error('Unsupported focus action.');
    this.complete();
    const s = this.productivity(),
      t = s.timer;
    if (
      this.settings().strict &&
      t.startedAt !== null &&
      ['pause', 'skip', 'stop', 'configure'].includes(c.action)
    )
      throw new Error('Strict mode is active. Use Emergency exit to end this phase.');
    if (c.action === 'configure') {
      const p = s.presets.find((p) => p.id === (c.presetId ?? t.presetId));
      if (!p || (c.phase !== undefined && !['focus', 'short', 'long'].includes(c.phase)))
        throw new Error('Unknown preset or phase.');
      const timer = newTimer(
        p,
        c.phase ?? 'focus',
        p.id === t.presetId ? t.completed : 0,
        c.link === undefined ? t.link : c.link,
      );
      if (!validProductivity({ ...s, timer })) throw new Error('Invalid focus link.');
      this.save({ ...s, timer });
    } else if (c.action === 'start') {
      if (t.deadline !== null) return;
      this.save({ ...s, timer: startTimer(t, this.now()) });
    } else if (c.action === 'pause') this.save({ ...s, timer: pauseTimer(t, this.now()) });
    else if (c.action === 'skip') this.save(finishTimer(s, this.now(), true));
    else
      this.save({
        ...s,
        timer: newTimer(
          s.presets.find((p) => p.id === t.presetId)!,
          t.phase,
          t.completed,
          t.link,
        ),
      });
    this.emergencyReadyAt = null;
  }
  legacy(input: { expectedRunId: string; timer: Timer }) {
    const s = this.productivity();
    if (
      !input ||
      input.expectedRunId !== s.timer.runId ||
      !validProductivity({ ...s, timer: input.timer })
    )
      throw new Error('Timer changed in another window. Try again.');
    const next = input.timer;
    if (next.runId !== s.timer.runId) {
      this.command({
        action: 'configure',
        presetId: next.presetId,
        phase: next.phase,
        link: next.link,
      });
      if (next.deadline !== null) this.command({ action: 'start' });
    } else if (JSON.stringify(next.link) !== JSON.stringify(s.timer.link))
      this.command({
        action: 'configure',
        presetId: next.presetId,
        phase: next.phase,
        link: next.link,
      });
    else if (next.deadline !== null && s.timer.deadline === null) this.command({ action: 'start' });
    else if (next.deadline === null && s.timer.deadline !== null) this.command({ action: 'pause' });
  }
  saveSettings(input: unknown) {
    const s = validateFocusSettings(input);
    if (this.settings().strict && this.productivity().timer.startedAt !== null)
      throw new Error(
        'End this strict phase before changing Guard settings. Emergency exit is always available.',
      );
    this.db.prepare('UPDATE focus_settings SET json=? WHERE id=1').run(JSON.stringify(s));
  }
  event(kind: FocusBreak['kind'], target: string, runId = this.productivity().timer.runId) {
    this.db
      .prepare('INSERT INTO focus_break_events(id,run_id,at,kind,target) VALUES(?,?,?,?,?)')
      .run(
        crypto.randomUUID(),
        runId,
        new Date(this.now()).toISOString(),
        kind,
        target.slice(0, 250),
      );
  }
  emergencyBegin() {
    this.emergencyReadyAt ??= this.now() + 30_000;
  }
  emergencyExit(input: unknown) {
    const phrase = (input as { phrase?: unknown })?.phrase;
    if (
      phrase !== emergencyPhrase &&
      (this.emergencyReadyAt === null || this.now() < this.emergencyReadyAt)
    )
      throw new Error('Type the phrase exactly or wait 30 seconds.');
    const s = this.productivity();
    if (s.timer.startedAt !== null) this.event('emergency', 'Emergency exit');
    this.save({
      ...s,
      timer: newTimer(
        s.presets.find((p) => p.id === s.timer.presetId)!,
        s.timer.phase,
        s.timer.completed,
        s.timer.link,
      ),
    });
    this.emergencyReadyAt = null;
  }
}
