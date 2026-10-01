import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  LOGIN_RATE_LIMIT: z.coerce.number().int().positive().default(10),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const fields = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
  throw new Error(`Invalid environment configuration: ${fields.join('; ')}`);
}

export const env = parsed.data;
