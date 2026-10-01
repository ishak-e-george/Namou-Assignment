import bcrypt from 'bcrypt';
import { beforeAll, beforeEach } from 'vitest';
import { db } from '../src/db/database.js';
import { runMigrations } from '../src/db/migrate.js';
import { seedDemoData } from '../src/db/seed.js';

runMigrations(db);

let demoPasswordHash = '';
beforeAll(async () => {
  demoPasswordHash = await bcrypt.hash('namou-demo-2026', 4);
});

beforeEach(() => {
  seedDemoData(db, demoPasswordHash);
});
