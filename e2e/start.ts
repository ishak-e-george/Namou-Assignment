import { rmSync } from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

process.env.NODE_ENV = 'development';
process.env.DATABASE_FILE = 'data/shop-e2e.db';
process.env.JWT_SECRET = 'playwright-e2e-secret-at-least-32-characters';
process.env.LOGIN_RATE_LIMIT = '1000';
process.env.PORT = '3001';
process.env.API_PROXY_TARGET = 'http://localhost:3001';

const [{ db }, { runMigrations }, { seedDemoData }, { app }, bcrypt] = await Promise.all([
  import('../server/src/db/database.js'),
  import('../server/src/db/migrate.js'),
  import('../server/src/db/seed.js'),
  import('../server/src/app.js'),
  import('bcrypt'),
]);

runMigrations(db);
seedDemoData(db, await bcrypt.default.hash('namou-demo-2026', 4));

const apiServer = app.listen(3001);
const clientServer = await createServer({
  configFile: path.resolve('client/vite.config.ts'),
  root: path.resolve('client'),
  server: { host: 'localhost', port: 5174, strictPort: true },
});
await clientServer.listen();

console.info('E2E app ready at http://localhost:5174');

let isClosing = false;
async function closeServers(): Promise<void> {
  if (isClosing) return;
  isClosing = true;
  void clientServer.close();
  await new Promise<void>((resolve) => apiServer.close(() => resolve()));
  db.close();
  const databasePath = path.resolve('server/data/shop-e2e.db');
  for (const suffix of ['', '-shm', '-wal']) rmSync(`${databasePath}${suffix}`, { force: true });
  process.exit(0);
}

process.on('SIGINT', () => void closeServers());
process.on('SIGTERM', () => void closeServers());
