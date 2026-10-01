import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';

const serverDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const databaseFile = env.DATABASE_FILE === ':memory:'
  ? ':memory:'
  : path.resolve(serverDirectory, env.DATABASE_FILE);

if (databaseFile !== ':memory:') mkdirSync(path.dirname(databaseFile), { recursive: true });

export const db: Database.Database = new Database(databaseFile);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');

export function withTransaction<T>(fn: () => T): T {
  return db.transaction(fn).immediate();
}
