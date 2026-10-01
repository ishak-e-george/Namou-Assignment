import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { UnauthorizedError } from '../../shared/errors.js';
import { authRepository } from './auth.repository.js';

const DUMMY_PASSWORD_HASH = '$2b$12$2.zqyzDeahcLgityYxt7HezDikuftxlezm2Tr2sqUQ.WoCud9Lj1q';

export const authService = {
  async login(email: string, password: string) {
    const user = authRepository.findByEmail(email);
    const matches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
    if (!user || !matches) {
      throw new UnauthorizedError('Email or password is incorrect', 'INVALID_CREDENTIALS');
    }

    const token = jwt.sign({ sub: String(user.id) }, env.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: '8h',
    });
    return { user: { id: user.id, email: user.email, name: user.name }, token };
  },

  getUserById(id: number) {
    return authRepository.findById(id);
  },
};
