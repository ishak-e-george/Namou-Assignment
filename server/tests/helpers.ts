import bcrypt from 'bcrypt';
import request from 'supertest';
import { app } from '../src/app.js';
import { db } from '../src/db/database.js';

export async function loginAsDemo() {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email: 'demo@example.com', password: 'namou-demo-2026' });
  return agent;
}

export async function createUser(email: string, password: string): Promise<number> {
  const passwordHash = await bcrypt.hash(password, 4);
  const result = db.prepare(
    'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
  ).run(email, passwordHash, 'Test User');
  return Number(result.lastInsertRowid);
}
