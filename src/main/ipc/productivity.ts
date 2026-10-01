import type { SQLInputValue } from 'node:sqlite';
import { ipcMain, Notification } from 'electron';
import { getDb } from '../database/db';
import { validProductivity, localDate, type Productivity } from '../../shared/productivity';
import { normalizeHabit, engineFields } from '../../shared/habitValidation';
import { validDate } from '../../shared/habits';
import { preserveMainFocus } from '../focus/store';
export function registerProductivityHandlers() {
  ipcMain.handle('productivity:get', () =>
    JSON.parse(
      (getDb().prepare('SELECT json FROM productivity_state WHERE id=1').get() as { json: string })
        .json,
    ),
  );
  ipcMain.handle('productivity:save', (_e, state: unknown) => {
    if (!validProductivity(state))
      throw new Error('Invalid productivity data. Nothing was changed.');
    const next = preserveMainFocus(getDb(), state);
    getDb().prepare('UPDATE productivity_state SET json=? WHERE id=1').run(JSON.stringify(next));
    return true;
  });
  ipcMain.handle('productivity:notify', (_e, body: string) => {
    if (Notification.isSupported())
      new Notification({ title: 'Tempo · Focus', body: String(body).slice(0, 250) }).show();
  });
  ipcMain.handle('backup:export', () => ({
    format: 'tempo-backup',
    version: 2,
    exportedAt: new Date().toISOString(),
    habits: getDb().prepare('SELECT * FROM habits').all(),
    logs: getDb().prepare('SELECT * FROM habit_logs').all(),
    pauses: getDb().prepare('SELECT * FROM habit_pauses').all(),
    productivity: JSON.parse(
      (getDb().prepare('SELECT json FROM productivity_state WHERE id=1').get() as { json: string })
        .json,
    ),
  }));
  ipcMain.handle('backup:import', async (_e, input: unknown) => {
    const data = input as {
      format: string;
      version: number;
      habits: any[];
      logs: any[];
      pauses?: any[];
      productivity: Productivity;
    };
    if (
      !data ||
      data.format !== 'tempo-backup' ||
      ![1, 2].includes(data.version) ||
      !validProductivity(data.productivity) ||
      !Array.isArray(data.habits) ||
      !Array.isArray(data.logs)
    )
      throw new Error('This is not a valid Tempo backup.');
    const ids = new Set(data.habits.map((h) => h.id));
    if (
      data.habits.some(
        (h) =>
          !Number.isInteger(h.id) ||
          !h.name?.trim() ||
          !['daily', 'weekly'].includes(h.frequency) ||
          !['morning', 'afternoon', 'evening', 'anytime'].includes(h.time_of_day) ||
          !Number.isFinite(Date.parse(h.created_at)),
      ) ||
      data.logs.some(
        (l) => !ids.has(l.habit_id) || !validDate(l.log_date) || ![0, 1].includes(l.is_completed),
      )
    )
      throw new Error('Invalid habit records in backup. Nothing was changed.');
    const normalized = data.habits.map((h) =>
      normalizeHabit({
        ...h,
        start_date: h.start_date || localDate(new Date(h.created_at)),
        habit_type: data.version === 1 ? 'check' : h.habit_type,
        schedule_type: data.version === 1 ? 'daily' : h.schedule_type,
      }),
    );
    const pauses = data.pauses || [];
    if (
      !Array.isArray(pauses) ||
      pauses.some(
        (p) =>
          !ids.has(p.habit_id) ||
          !validDate(p.start_date) ||
          !validDate(p.end_date) ||
          p.end_date < p.start_date ||
          !p.reason?.trim(),
      ) ||
      data.logs.some(
        (l) =>
          data.version === 2 &&
          (!Number.isFinite(l.quantity) ||
            l.quantity < 0 ||
            !['pending', 'done', 'clean', 'slip', 'freeze'].includes(l.outcome) ||
            (l.outcome === 'slip' && !l.slip_reason?.trim()) ||
            (l.outcome === 'freeze' &&
              !['sick', 'travel', 'rest', 'other'].includes(l.freeze_reason))),
      )
    )
      throw new Error('Invalid habit-engine records in backup. Nothing was changed.');
    const db = getDb();
    // Keep a full SQLite safety copy before an atomic, non-destructive merge.
    const backupPath = `${db.name}.before-import-${Date.now()}.bak`;
    await db.backup(backupPath);
    db.transaction(() => {
      const map = new Map<number, number>();
      const newlyAdded = new Set<number>();
      for (let i = 0; i < data.habits.length; i++) {
        const h = data.habits[i],
          normalizedHabit = normalized[i];
        const existing = db.prepare('SELECT * FROM habits WHERE id=?').get(h.id) as any;
        if (
          existing &&
          ['name', 'frequency', 'time_of_day', 'created_at'].every((k) => existing[k] === h[k])
        )
          map.set(h.id, existing.id);
        else {
          const columns = [
            'name',
            'description',
            'frequency',
            'time_of_day',
            'days_of_week',
            'scheduled_time',
            'created_at',
            'is_archived',
            ...engineFields,
          ];
          const fields = {
            ...normalizedHabit,
            created_at: h.created_at,
            description: h.description ?? null,
            scheduled_time: h.scheduled_time ?? null,
            is_archived: h.is_archived ? 1 : 0,
            after_habit_id: null,
          } as unknown as Record<string, SQLInputValue>;
          const result = db
            .prepare(
              `INSERT INTO habits(${columns.join(',')}) VALUES(${columns.map(() => '?').join(',')})`,
            )
            .run(...columns.map((k) => fields[k]));
          map.set(h.id, Number(result.lastInsertRowid));
          newlyAdded.add(h.id);
        }
      }
      for (const h of data.habits)
        if (newlyAdded.has(h.id) && h.after_habit_id && map.has(h.after_habit_id))
          db.prepare('UPDATE habits SET after_habit_id=? WHERE id=?').run(
            map.get(h.after_habit_id)!,
            map.get(h.id)!,
          );
      for (const l of data.logs)
        db.prepare(
          `INSERT OR IGNORE INTO habit_logs(habit_id,log_date,is_completed,note,missed_reason,quantity,outcome,slip_reason,freeze_reason,freeze_note,freeze_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
        ).run(
          map.get(l.habit_id)!,
          l.log_date,
          l.is_completed,
          l.note ?? null,
          l.missed_reason ?? null,
          l.quantity ?? 0,
          l.outcome || (l.is_completed ? 'done' : 'pending'),
          l.slip_reason ?? null,
          l.freeze_reason ?? null,
          l.freeze_note ?? null,
          l.freeze_at ?? null,
        );
      for (const p of pauses) {
        const existing = db
          .prepare('SELECT id FROM habit_pauses WHERE habit_id=? AND start_date<=? AND end_date>=?')
          .get(map.get(p.habit_id)!, p.end_date, p.start_date);
        if (!existing)
          db.prepare(
            'INSERT INTO habit_pauses(habit_id,start_date,end_date,reason) VALUES(?,?,?,?)',
          ).run(map.get(p.habit_id)!, p.start_date, p.end_date, p.reason);
      }
      const old: Productivity = JSON.parse(
        (db.prepare('SELECT json FROM productivity_state WHERE id=1').get() as { json: string })
          .json,
      );
      const merge = <T extends { id: string }>(a: T[], b: T[]) => [
        ...a,
        ...b.filter((x) => !a.some((y) => y.id === x.id)),
      ];
      const imported = data.productivity;
      const relink = <T extends { link: Productivity['timer']['link'] }>(x: T): T => ({
        ...x,
        link:
          x.link?.type === 'habit'
            ? { ...x.link, id: String(map.get(Number(x.link.id)) ?? x.link.id) }
            : x.link,
      });
      const next = {
        ...old,
        tasks: merge(old.tasks, imported.tasks),
        presets: merge(old.presets, imported.presets),
        sessions: merge(old.sessions, imported.sessions.map(relink)),
      };
      db.prepare('UPDATE productivity_state SET json=? WHERE id=1').run(JSON.stringify(next));
    })();
    return { success: true, backupPath };
  });
}
