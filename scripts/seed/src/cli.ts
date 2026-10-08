import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { createStrapiClient } from './strapi';
import { loadSeed, runSeed, verify, type Log } from './seed';

const DEFAULT_FIXTURES = fileURLToPath(new URL('../fixtures', import.meta.url));

const USAGE = `Usage: pnpm seed [--dry-run] [--fixtures <dir>]

Upserts the synthetic fixtures into Strapi and publishes them (TDD §5.5).

Environment:
  CMS_URL         Strapi base URL, e.g. http://localhost:1337
  CMS_SEED_TOKEN  Full-access API token. Create it for the seed run and revoke it afterwards.

Options:
  --dry-run          Validate the fixtures and report what would change. Without CMS_URL, only validates.
  --fixtures <dir>   Fixture directory (default: scripts/seed/fixtures)
  -h, --help         Show this message
`;

const write: Log = (line) => {
  process.stdout.write(`${line}\n`);
};

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      'dry-run': { type: 'boolean', default: false },
      fixtures: { type: 'string', default: DEFAULT_FIXTURES },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  if (values.help) {
    write(USAGE);
    return;
  }

  const dryRun = values['dry-run'];
  const seed = await loadSeed(values.fixtures);
  write(
    `fixtures ok: ${Object.entries(seed)
      .map(
        ([section, items]) =>
          `${section} ${Array.isArray(items) ? items.length : Object.values(items).flat().length}`,
      )
      .join(', ')}`,
  );

  const url = process.env.CMS_URL;
  const token = process.env.CMS_SEED_TOKEN;
  if (!url || !token) {
    if (dryRun && !url) {
      write('CMS_URL is not set: validated the fixtures only.');
      return;
    }
    throw new Error('Set CMS_URL and CMS_SEED_TOKEN (see scripts/seed/README.md).');
  }

  const client = createStrapiClient({ url, token });
  const report = await runSeed({ client, seed, dryRun, log: write });
  for (const [plural, { created, updated }] of Object.entries(report)) {
    write(
      `${plural}: ${dryRun ? 'would create' : 'created'} ${created}, ${dryRun ? 'would update' : 'updated'} ${updated}`,
    );
  }
  if (dryRun) return;

  const counts = await verify(client);
  write(
    `verified published content against the site schemas: ${Object.entries(counts)
      .map(([plural, count]) => `${plural} ${count}`)
      .join(', ')}`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
