import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(repositoryRoot, '.env');
const examplePath = path.join(repositoryRoot, '.env.example');

if (existsSync(envPath)) {
  console.info('Existing .env was preserved.');
} else {
  const example = readFileSync(examplePath, 'utf8');
  const secretLines = [...example.matchAll(/^JWT_SECRET=/gm)];
  if (secretLines.length !== 1) {
    throw new Error('Expected exactly one JWT_SECRET line in .env.example');
  }

  const secretLine = /^JWT_SECRET=[^\r\n]*/m;
  const localEnv = example.replace(secretLine, `JWT_SECRET=${randomBytes(48).toString('hex')}`);
  try {
    writeFileSync(envPath, localEnv, { flag: 'wx' });
    console.info('Created a new local .env file from .env.example.');
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'EEXIST') {
      console.info('Existing .env was preserved.');
    } else {
      throw error;
    }
  }
}
