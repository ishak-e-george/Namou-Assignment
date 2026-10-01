import Database from 'better-sqlite3';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './database.js';

const directory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');

export function runMigrations(database: Database.Database): void {
  database.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TEXT
  ) STRICT`);
  const files = readdirSync(directory).filter((name) => /^\d+.*\.sql$/.test(name)).sort();
  const isApplied = database.prepare('SELECT 1 FROM schema_migrations WHERE version = ?');
  const record = database.prepare(`INSERT INTO schema_migrations (version, applied_at)
    VALUES (?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`);

  for (const file of files) {
    if (isApplied.get(file)) continue;
    const sql = readFileSync(path.join(directory, file), 'utf8');
    database.transaction(() => {
      database.exec(sql);
      record.run(file);
    }).immediate();
    console.info(`Applied migration ${file}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    runMigrations(db);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}
