import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5174',
    browserName: 'chromium',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node --import tsx e2e/start.ts',
    url: 'http://localhost:5174/api/health',
    timeout: 120_000,
    reuseExistingServer: false,
    gracefulShutdown: { signal: 'SIGINT', timeout: 5_000 },
  },
});
