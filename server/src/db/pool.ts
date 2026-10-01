import pg from 'pg';
import type { PoolClient, QueryResult, QueryResultRow } from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;
export const pool = new Pool({ connectionString: env.DATABASE_URL, max: 10 });

export function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<QueryResult<T>> {
  return pool.query<T>(text, values);
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
