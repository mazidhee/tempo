import type Database from './sqlite';
import type { Migration } from './migrationRegistry';
import { parseSlipCSV } from '../../shared/habitEvents';
export const habitEventMigration: Migration = { version:210,name:'Timestamped imported habit events',apply(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS habit_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT, habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    occurred_at TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', source TEXT NOT NULL, imported_at TEXT NOT NULL,
    UNIQUE(habit_id,occurred_at,note,source));
    CREATE INDEX IF NOT EXISTS idx_habit_events_date ON habit_events(habit_id,occurred_at);`);
}};
export async function importHabitEvents(db: Database, habitId: number, csv: string) {
  const habit = db.prepare('SELECT habit_type FROM habits WHERE id=?').get(habitId);
  if(!Number.isInteger(habitId) || !habit || habit.habit_type!=='avoid')throw Error('Choose an existing Avoid habit for this history.');
  const parsed=parseSlipCSV(csv);
  if(!parsed.events.length)throw Error('No Habits / Relapsed entries were found. Nothing was imported.');
  if(db.name!==':memory:')await db.backup(`${db.name}.before-event-import-${Date.now()}.bak`);
  const imported=db.transaction(()=>{
    let count=0;const insert=db.prepare('INSERT OR IGNORE INTO habit_events(habit_id,occurred_at,note,source,imported_at) VALUES(?,?,?,?,?)');
    for(const e of parsed.events)count+=Number(insert.run(habitId,e.occurred_at,e.note,e.source,new Date().toISOString()).changes);
    return count;
  })();
  return {imported,duplicates:parsed.events.length-imported,ignored:parsed.ignored};
}
