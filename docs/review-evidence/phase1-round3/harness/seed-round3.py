"""Independent fixtures. Never read or modify the real appData database."""
import datetime
import json
import pathlib
import sqlite3

base = pathlib.Path(__file__).resolve().parent
today = datetime.date.today()
for name, oldest in (("round3-legacy-oldest", True), ("round3-legacy-v2", False)):
    directory = base / name
    directory.mkdir(exist_ok=True)
    target = directory / "habits.db"
    if target.exists():
        print("Keeping existing fixture:", target)
        continue
    db = sqlite3.connect(target)
    schedule = "" if oldest else ", days_of_week TEXT DEFAULT 'mon,tue,wed,thu,fri,sat,sun', scheduled_time TEXT"
    db.executescript(f"""
      CREATE TABLE habits (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT,
        frequency TEXT NOT NULL CHECK(frequency IN ('daily','weekly')),
        time_of_day TEXT, created_at TEXT NOT NULL, is_archived INTEGER DEFAULT 0 {schedule}
      );
      CREATE TABLE habit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT, habit_id INTEGER NOT NULL,
        log_date TEXT NOT NULL, is_completed INTEGER DEFAULT 0, note TEXT,
        missed_reason TEXT, FOREIGN KEY(habit_id) REFERENCES habits(id), UNIQUE(habit_id,log_date)
      );
    """)
    created = str(today - datetime.timedelta(days=30)) + "T09:00:00Z"
    habits = [(1, "Original daily", "Original description", "daily", "morning", created, 0),
              (2, "Original weekly", "Keep original schedule metadata", "weekly", "evening", created, 0),
              (3, "Original archived", "Archived history survives", "daily", "afternoon", created, 1)]
    for habit in habits:
        if oldest:
            db.execute("INSERT INTO habits VALUES(?,?,?,?,?,?,?)", habit)
        else:
            db.execute("INSERT INTO habits VALUES(?,?,?,?,?,?,?,?,?)", (*habit, "mon,wed,fri" if habit[0] == 2 else "mon,tue,wed,thu,fri,sat,sun", "09:30" if habit[0] == 2 else None))
    logs = [(1, 1, str(today - datetime.timedelta(days=1)), 1, "Original completion note", None),
            (2, 1, str(today - datetime.timedelta(days=2)), 0, None, "Original missed reason"),
            (3, 2, str(today - datetime.timedelta(days=7)), 1, "Original weekly note", None),
            (4, 3, str(today - datetime.timedelta(days=4)), 1, "Original archived note", None)]
    db.executemany("INSERT INTO habit_logs VALUES(?,?,?,?,?,?)", logs)
    if not oldest:
        source = sqlite3.connect(base.parent / "round2" / "habits.db")
        state = source.execute("SELECT json FROM productivity_state WHERE id=1").fetchone()[0]
        source.close()
        db.executescript("CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL); CREATE TABLE productivity_state(id INTEGER PRIMARY KEY CHECK(id=1),json TEXT NOT NULL);")
        db.execute("INSERT INTO schema_migrations VALUES(2,?)", (created,))
        db.execute("INSERT INTO productivity_state VALUES(1,?)", (state,))
    db.commit()
    db.row_factory = sqlite3.Row
    snapshot = {"habits": [dict(r) for r in db.execute("SELECT * FROM habits ORDER BY id")],
                "logs": [dict(r) for r in db.execute("SELECT * FROM habit_logs ORDER BY id")]}
    if not oldest:
        snapshot["productivityJson"] = db.execute("SELECT json FROM productivity_state WHERE id=1").fetchone()[0]
    (directory / "before.json").write_text(json.dumps(snapshot, indent=2), encoding="utf-8")
    db.close()
    print("Created isolated fixture:", target)
