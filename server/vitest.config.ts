import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    fileParallelism: true,
    setupFiles: ['./tests/setup.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_FILE: ':memory:',
      JWT_SECRET: 'test-secret-at-least-32-characters-long',
      LOGIN_RATE_LIMIT: '2',
    },
  },
});
