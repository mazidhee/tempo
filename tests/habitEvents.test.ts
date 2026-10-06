import { test } from 'node:test';
import assert from 'node:assert/strict';
import Database from '../src/main/database/sqlite';
import { habitEventMigration, importHabitEvents } from '../src/main/database/habitEventMigration';
import { parseSlipCSV, eventMonths } from '../src/shared/habitEvents';
const csv='Category,Event,Occurrence,Note\n"Habits","Relapsed","2026-09-30 18:03:08","A fictional, note"\n"Habits","Relapsed","2026-09-30 18:03:10","Another ""quoted"" note\nwith a line"\n"General","Other","2026-08-01 10:00:00",""';
test('event CSV preserves distinct same-day times, multiline notes and excludes unrelated entries',()=>{
  const p=parseSlipCSV(csv);assert.equal(p.events.length,2);assert.equal(p.days,1);assert.equal(p.ignored,1);
  assert.equal(p.events[1].note,'Another "quoted" note\nwith a line');
  assert.throws(()=>parseSlipCSV(csv.replace('2026-09-30 18:03:08','2026-02-30 18:03:08')));
  assert.throws(()=>parseSlipCSV(csv.replace('18:03:08','25:03:08')));
  assert.throws(()=>parseSlipCSV(csv+'\n"unterminated'));
});
test('timestamped import is atomic, repeat-safe and leaves check-ins and habit definitions unchanged',async()=>{
  const db=new Database(':memory:');db.exec("CREATE TABLE habits(id INTEGER PRIMARY KEY,habit_type TEXT);INSERT INTO habits VALUES(1,'avoid'); CREATE TABLE habit_logs(id INTEGER PRIMARY KEY,habit_id INTEGER,log_date TEXT,outcome TEXT); INSERT INTO habit_logs VALUES(1,1,'2026-09-30','slip');");
  habitEventMigration.apply(db); const before=db.prepare('SELECT * FROM habit_logs').all();
  assert.equal((await importHabitEvents(db,1,csv)).imported,2);assert.equal((await importHabitEvents(db,1,csv)).duplicates,2);
  assert.deepEqual(db.prepare('SELECT * FROM habit_logs').all(),before);
  assert.equal(db.prepare('SELECT * FROM habit_events').all().length,2);
  await assert.rejects(importHabitEvents(db,1,csv.replace('18:03:08','99:03:08')));
  assert.equal(db.prepare('SELECT * FROM habit_events').all().length,2);await assert.rejects(importHabitEvents(db,2,csv));db.close();
});
test('event trend counts imported events rather than inferred clean or missed days',()=>{
  assert.deepEqual(eventMonths([{occurred_at:'2026-08-01 12:00:00'},{occurred_at:'2026-08-01 12:01:00'},{occurred_at:'2026-10-01 12:00:00'}]),[{month:'2026-08',count:2},{month:'2026-09',count:0},{month:'2026-10',count:1}]);
});
