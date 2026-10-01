import { defineConfig } from 'vitest/config';

process.env.DATABASE_FILE = ':memory:';

export default defineConfig({
  test: {
    environment: 'node',
    fileParallelism: true,
  },
});
