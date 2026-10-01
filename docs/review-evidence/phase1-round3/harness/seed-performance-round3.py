import pathlib,sqlite3,datetime
p=pathlib.Path(__file__).parent/'performance-round3';p.mkdir(exist_ok=True);target=p/'habits.db'
if not target.exists():
 d=sqlite3.connect(target)
 d.executescript("CREATE TABLE habits(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,description TEXT,frequency TEXT NOT NULL,time_of_day TEXT,created_at TEXT NOT NULL,is_archived INTEGER DEFAULT 0);CREATE TABLE habit_logs(id INTEGER PRIMARY KEY AUTOINCREMENT,habit_id INTEGER NOT NULL,log_date TEXT NOT NULL,is_completed INTEGER DEFAULT 0,note TEXT,missed_reason TEXT,UNIQUE(habit_id,log_date));")
 end=datetime.date.today();start=end-datetime.timedelta(days=365)
 for id in range(1,21):
  d.execute('INSERT INTO habits VALUES(?,?,?,?,?,?,?)',(id,f'Year habit {id}','Performance fixture','daily','anytime',str(start)+'T10:00:00',0))
  d.executemany('INSERT INTO habit_logs(habit_id,log_date,is_completed) VALUES(?,?,?)',[(id,str(start+datetime.timedelta(days=n)),1) for n in range(366)])
 d.commit();d.close();print('Created isolated 20 habit / 7320 log performance fixture')
