import type Database from '../database/sqlite';
import {
  defaultFocusSettings,
  validateFocusBreak,
  validateFocusSettings,
  type FocusBreak,
} from '../../shared/focus';
export const focusBackup = {
  key: 'focus',
  export(db: Database) {
    return {
      settings: JSON.parse(
        (db.prepare('SELECT json FROM focus_settings WHERE id=1').get() as { json: string }).json,
      ),
      events: db.prepare('SELECT id,run_id AS runId,at,kind,target FROM focus_break_events').all(),
    };
  },
  validate(input: unknown) {
    const v = input as { settings: unknown; events: unknown[] };
    if (!v || !Array.isArray(v.events)) throw new Error('Invalid Focus backup.');
    validateFocusSettings(v.settings);
    v.events.forEach(validateFocusBreak);
  },
  // A clean restore recovers configuration, but activation remains device opt-in.
  // Existing configured devices keep their own settings.
  merge(db: Database, input: unknown) {
    const v = input as { settings: unknown; events: FocusBreak[] };
    const current = JSON.parse(
      (db.prepare('SELECT json FROM focus_settings WHERE id=1').get() as { json: string }).json,
    );
    if (JSON.stringify(current) === JSON.stringify(defaultFocusSettings()))
      db.prepare('UPDATE focus_settings SET json=? WHERE id=1').run(
        JSON.stringify({ ...validateFocusSettings(v.settings), enabled: false }),
      );
    for (const e of v.events)
      db.prepare(
        'INSERT OR IGNORE INTO focus_break_events(id,run_id,at,kind,target) VALUES(?,?,?,?,?)',
      ).run(e.id, e.runId, e.at, e.kind, e.target);
  },
};
