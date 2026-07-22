import path from 'node:path';

import dotenv from 'dotenv';

const projectRoot = path.resolve(__dirname, '..', '..');

dotenv.config({
  path: process.env.ENV_FILE
    ? path.resolve(process.cwd(), process.env.ENV_FILE)
    : path.join(projectRoot, '.env'),
});

function required(name: string, fallback?: string): string {
  const value = process.env[name]?.trim() || fallback;

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function positiveInteger(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback);

  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return value;
}

function secret(name: string, fallback: string): string {
  const value = required(name, fallback);

  if (value.length < 32) {
    throw new Error(`${name} must contain at least 32 characters`);
  }

  return value;
}

function agentUrl(): string {
  const value = required('ELEVENLABS_AGENT_URL');
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error('ELEVENLABS_AGENT_URL must be a valid absolute URL');
  }

  if (!['https:', 'wss:'].includes(url.protocol)) {
    throw new Error('ELEVENLABS_AGENT_URL must use HTTPS or WSS');
  }

  return url.toString();
}

export const config = {
  accessSecret: secret('ACCESS_TOKEN_SECRET', 'development-access-secret-32-chars'),
  accessTtl: positiveInteger('ACCESS_TOKEN_TTL_SECONDS', 900),
  adminPassword: required('ADMIN_PASSWORD', 'admin!@#'),
  adminUsername: required('ADMIN_USERNAME', 'admin'),
  agentUrl: agentUrl(),
  dataDir: path.resolve(projectRoot, process.env.DATA_DIR ?? 'data'),
  frontendDistDir: path.join(projectRoot, 'frontend', 'dist'),
  port: positiveInteger('PORT', 9596),
  refreshSecret: secret('REFRESH_TOKEN_SECRET', 'development-refresh-secret-32-chars'),
  refreshTtl: positiveInteger('REFRESH_TOKEN_TTL_SECONDS', 604_800),
} as const;
