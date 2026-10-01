import bcrypt from 'bcrypt';
import { beforeAll, beforeEach } from 'vitest';
import { db } from '../src/db/database.js';
import { runMigrations } from '../src/db/migrate.js';
import { seedDemoData } from '../src/db/seed.js';
import { loginRateLimit } from '../src/middleware/rateLimit.js';

runMigrations(db);

let demoPasswordHash = '';
beforeAll(async () => {
  demoPasswordHash = await bcrypt.hash('namou-demo-2026', 4);
});

beforeEach(() => {
  loginRateLimit.resetKey('127.0.0.1');
  seedDemoData(db, demoPasswordHash);
});
