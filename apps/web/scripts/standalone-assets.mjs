import { cpSync, existsSync } from 'node:fs';
import path from 'node:path';

/*
 * `output: 'standalone'` leaves out `.next/static` and `public` because Next expects a CDN to serve
 * them. Render dev and the e2e run serve everything from one process, so copy them next to the
 * standalone server (TDD D36, §6.2).
 */
const root = path.resolve(import.meta.dirname, '..');
const app = path.join(root, '.next', 'standalone', 'apps', 'web');
if (!existsSync(app)) process.exit(0);

cpSync(path.join(root, '.next', 'static'), path.join(app, '.next', 'static'), { recursive: true });

const publicDir = path.join(root, 'public');
if (existsSync(publicDir)) cpSync(publicDir, path.join(app, 'public'), { recursive: true });
