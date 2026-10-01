import { DatabaseSync, backup } from 'node:sqlite';
// Compatibility facade for the existing queries. Electron now bundles SQLite;
// removing native-addon rebuilds keeps fresh installs independent of C++ tools.
export default class Database {
  private connection: DatabaseSync;
  constructor(public readonly name: string) {
    this.connection = new DatabaseSync(name);
  }
  exec(sql: string) {
    this.connection.exec(sql);
  }
  prepare(sql: string) {
    return this.connection.prepare(sql);
  }
  pragma(sql: string) {
    return this.connection.prepare(`PRAGMA ${sql}`).all();
  }
  transaction<T>(fn: () => T): () => T {
    return () => {
      this.exec('BEGIN IMMEDIATE');
      try {
        const result = fn();
        this.exec('COMMIT');
        return result;
      } catch (error) {
        this.exec('ROLLBACK');
        throw error;
      }
    };
  }
  backup(destination: string) {
    return backup(this.connection, destination);
  }
  close() {
    this.connection.close();
  }
}
