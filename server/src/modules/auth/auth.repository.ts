import { db } from '../../db/database.js';
import type { User } from '../../shared/types.js';

type UserRow = { id: number; email: string; password_hash: string; name: string };

const findByEmailStatement = db.prepare<UserRow, [string]>(
  'SELECT id, email, password_hash, name FROM users WHERE email = ?',
);
const findByIdStatement = db.prepare<User, [number]>(
  'SELECT id, email, name FROM users WHERE id = ?',
);

export const authRepository = {
  findByEmail(email: string) {
    const row = findByEmailStatement.get(email);
    if (!row) return null;
    return { id: row.id, email: row.email, passwordHash: row.password_hash, name: row.name };
  },

  findById(id: number): User | null {
    return findByIdStatement.get(id) ?? null;
  },
};
