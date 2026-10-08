#!/usr/bin/env node
// Creates apps/cms/.env for local development if it doesn't exist, with random
// secrets and the docker-compose Postgres settings. Never overwrites an existing file.
// Local only: deployed environments get their secrets from Render env groups or AWS.
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cmsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'apps', 'cms');
const envPath = join(cmsDir, '.env');

if (existsSync(envPath)) {
  process.exit(0);
}

const secret = () => randomBytes(32).toString('base64');
const values = {
  APP_KEYS: [secret(), secret(), secret(), secret()].join(','),
  API_TOKEN_SALT: secret(),
  ADMIN_JWT_SECRET: secret(),
  TRANSFER_TOKEN_SALT: secret(),
  JWT_SECRET: secret(),
  ENCRYPTION_KEY: secret(),
  DATABASE_HOST: 'localhost',
  DATABASE_PORT: process.env.POSTGRES_PORT ?? '5432',
  DATABASE_NAME: 'strapi',
  DATABASE_USERNAME: 'strapi',
  DATABASE_PASSWORD: 'strapi',
  STRAPI_TELEMETRY_DISABLED: 'true',
};

const template = readFileSync(join(cmsDir, '.env.example'), 'utf8');
const output = template
  .split('\n')
  .map((line) => {
    const match = /^([A-Z0-9_]+)=$/.exec(line);
    if (!match) return line;
    // Strapi treats an empty value as set (env.int gives NaN, env() gives ''), so keys we
    // don't fill stay commented out and the config defaults apply.
    return match[1] in values ? `${match[1]}=${values[match[1]]}` : `# ${line}`;
  })
  .join('\n');

writeFileSync(envPath, output, { mode: 0o600 });
console.log('Created apps/cms/.env with local-only secrets (git-ignored).');
