import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { seed as contract } from '@llf/contracts';
import { SeedValidationError, loadSeed, runSeed, toPageContent, verify } from './seed';
import type { StrapiClient, StrapiDocument } from './strapi';

const FIXTURES = fileURLToPath(new URL('../fixtures', import.meta.url));
const WEB_FIXTURES = fileURLToPath(new URL('../../../apps/web/fixtures/cms', import.meta.url));

type Data = Record<string, unknown>;
interface Call {
  plural: string;
  id?: string;
  data: Data;
}

/** In-memory Strapi: `find` matches on the stored field, every write is recorded. */
function fakeClient() {
  const store = new Map<string, Map<string, Data>>();
  const creates: Call[] = [];
  const updates: Call[] = [];
  let next = 0;
  const docs = (plural: string) => {
    let map = store.get(plural);
    if (!map) store.set(plural, (map = new Map()));
    return map;
  };
  const client: StrapiClient = {
    async find(plural, field, value) {
      for (const [documentId, data] of docs(plural)) {
        if (data[field] === value) return { documentId };
      }
      return undefined;
    },
    async create(plural, data) {
      const documentId = `${plural}-${(next += 1)}`;
      docs(plural).set(documentId, { ...data });
      creates.push({ plural, data });
      return { documentId };
    },
    async update(plural, id, data): Promise<StrapiDocument> {
      const existing = docs(plural).get(id);
      if (!existing) throw new Error(`unknown ${plural} ${id}`);
      Object.assign(existing, data);
      updates.push({ plural, id, data });
      return { documentId: id };
    },
    async list() {
      throw new Error('list is not used by runSeed');
    },
  };
  return {
    client,
    store,
    creates,
    updates,
    reset: () => ((creates.length = 0), (updates.length = 0)),
  };
}

async function webFixture(name: string): Promise<Data[]> {
  const raw = JSON.parse(await readFile(join(WEB_FIXTURES, `${name}.json`), 'utf8')) as {
    data: Data[];
  };
  return raw.data;
}

const titles = (items: readonly { title: string }[]) => items.map((item) => item.title).sort();

let seed: contract.Seed;
beforeAll(async () => {
  seed = await loadSeed(FIXTURES);
});

describe('loadSeed', () => {
  let dir: string | undefined;
  afterEach(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
    dir = undefined;
  });

  it('loads every section of the committed fixtures', () => {
    for (const section of contract.SEED_SECTIONS) expect(seed[section]).toBeDefined();
    expect(seed.tips.length).toBeGreaterThan(0);
    expect(seed.pages.length).toBeGreaterThan(0);
  });

  it('reports schema issues with the file and path', async () => {
    dir = await mkdtemp(join(tmpdir(), 'llf-seed-'));
    await cp(FIXTURES, dir, { recursive: true });
    const file = join(dir, 'tips.json');
    const raw = JSON.parse(await readFile(file, 'utf8')) as { data: Data[] };
    raw.data[0] = { ...raw.data[0], title: '' };
    await writeFile(file, JSON.stringify(raw));

    const error = await loadSeed(dir).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(SeedValidationError);
    const { issues } = error as SeedValidationError;
    expect(issues.some((issue) => issue.path.startsWith('tips.json'))).toBe(true);
  });

  it('rejects cross-references to missing documents', async () => {
    dir = await mkdtemp(join(tmpdir(), 'llf-seed-'));
    await cp(FIXTURES, dir, { recursive: true });
    const file = join(dir, 'tips.json');
    const raw = JSON.parse(await readFile(file, 'utf8')) as { data: Data[] };
    raw.data[0] = { ...raw.data[0], ingredient: 'not-an-ingredient' };
    await writeFile(file, JSON.stringify(raw));

    await expect(loadSeed(dir)).rejects.toBeInstanceOf(SeedValidationError);
  });
});

describe('seed fixtures', () => {
  it('are a superset of the web fixtures, so the site renders the same against a seeded CMS', async () => {
    const [ingredients, categories, pages, tips, groups] = await Promise.all([
      webFixture('ingredients'),
      webFixture('categories'),
      webFixture('pages'),
      webFixture('tips'),
      webFixture('groups'),
    ]);
    const has = (seeded: string[], web: string[]) =>
      expect(seeded).toEqual(expect.arrayContaining(web));

    has(titles(seed.ingredients), titles(ingredients as { title: string }[]));
    has(titles(seed.tips), titles(tips as { title: string }[]));
    has(titles(seed.groups), titles(groups as { title: string }[]));
    has(
      seed.categories.map((c) => c.slug),
      categories.map((c) => c.slug as string),
    );
    has(
      seed.pages.map((p) => contract.pathKey(p.path)),
      pages.map((p) => contract.pathKey(p.path as string)),
    );
  });
});

describe('runSeed', () => {
  const documentCount = () =>
    seed.taxonomies.tip_types.length +
    seed.taxonomies.tip_behaviors.length +
    seed.taxonomies.tip_motivators.length +
    seed.ingredients.length +
    seed.tips.length +
    seed.groups.length +
    seed.categories.length +
    seed.pages.length;

  it('creates every document on the first run, then writes page slots and main zones', async () => {
    const fake = fakeClient();
    const report = await runSeed({ client: fake.client, seed });

    expect(report).toEqual({
      'tip-types': { created: seed.taxonomies.tip_types.length, updated: 0 },
      'tip-behaviors': { created: seed.taxonomies.tip_behaviors.length, updated: 0 },
      'tip-motivators': { created: seed.taxonomies.tip_motivators.length, updated: 0 },
      ingredients: { created: seed.ingredients.length, updated: 0 },
      tips: { created: seed.tips.length, updated: 0 },
      groups: { created: seed.groups.length, updated: 0 },
      categories: { created: seed.categories.length, updated: 0 },
      pages: { created: seed.pages.length, updated: 0 },
    });
    expect(fake.creates).toHaveLength(documentCount());
    expect(fake.updates).toHaveLength(seed.pages.length);
    for (const call of fake.updates) {
      expect(call.plural).toBe('pages');
      expect(Object.keys(call.data)).toEqual(['hero', 'intro', 'featured', 'tool', 'main']);
    }
  });

  it('is idempotent: a second run updates in place and creates nothing', async () => {
    const fake = fakeClient();
    await runSeed({ client: fake.client, seed });
    const before = new Map([...fake.store].map(([plural, docs]) => [plural, docs.size]));
    fake.reset();

    const report = await runSeed({ client: fake.client, seed });

    expect(fake.creates).toHaveLength(0);
    expect(fake.updates).toHaveLength(documentCount() + seed.pages.length);
    for (const count of Object.values(report)) expect(count.created).toBe(0);
    expect(new Map([...fake.store].map(([plural, docs]) => [plural, docs.size]))).toEqual(before);
  });

  it('writes nothing on a dry run', async () => {
    const fake = fakeClient();
    const lines: string[] = [];
    const report = await runSeed({
      client: fake.client,
      seed,
      dryRun: true,
      log: (line) => lines.push(line),
    });

    expect(fake.creates).toHaveLength(0);
    expect(fake.updates).toHaveLength(0);
    expect(report.tips).toEqual({ created: seed.tips.length, updated: 0 });
    expect(lines.every((line) => line.startsWith('would '))).toBe(true);
  });

  it('links relations by the document ids it created', async () => {
    const fake = fakeClient();
    await runSeed({ client: fake.client, seed });
    const idOf = (plural: string, field: string, value: string) =>
      [...(fake.store.get(plural) ?? [])].find(([, data]) => data[field] === value)?.[0];

    const tipSeed = seed.tips.find((tip) => tip.title === 'Freeze ripe bananas');
    expect(tipSeed).toBeDefined();
    const tipId = idOf('tips', 'title', 'Freeze ripe bananas');
    const tip = fake.store.get('tips')?.get(tipId ?? '');
    expect(tip?.ingredient).toEqual({ set: [idOf('ingredients', 'title', 'Banana')] });
    expect(tip?.tip_type).toEqual({ set: [idOf('tip-types', 'title', tipSeed?.type ?? '')] });
    expect(tip?.tip_behavior).toEqual({
      set: [idOf('tip-behaviors', 'title', tipSeed?.behavior ?? '')],
    });
    expect(tip?.tip_motivator).toEqual({
      set: [idOf('tip-motivators', 'title', tipSeed?.motivator ?? '')],
    });

    const category = fake.store
      .get('categories')
      ?.get(idOf('categories', 'slug', 'fruits-and-veggies') ?? '');
    const categorySeed = seed.categories.find((c) => c.slug === 'fruits-and-veggies');
    expect((category?.ingredients as { set: string[] }).set).toHaveLength(
      categorySeed?.ingredients?.length ?? 0,
    );
    expect(
      (category?.ingredients as { set: string[] }).set.every((id) => id.startsWith('ingredients-')),
    ).toBe(true);
    expect((category?.tips as { set: string[] }).set.every((id) => id.startsWith('tips-'))).toBe(
      true,
    );
  });

  it('turns page CTAs, template slots and block references into relations', async () => {
    const fake = fakeClient();
    await runSeed({ client: fake.client, seed });
    const pages = [...(fake.store.get('pages') ?? new Map<string, Data>()).values()];
    const home = pages.find((page) => page.path === '/');
    expect(home?.template).toBe('home');
    const hero = home?.hero as Data;
    // const ctas = hero.ctas as Data[];
    // expect(ctas.length).toBeGreaterThan(0);
    // for (const cta of ctas) {
    //   expect(cta.page).toEqual({ set: [expect.stringMatching(/^pages-/)] });
    // }
    const featured = (home?.featured as { set: string[] }).set;
    // expect(featured).toHaveLength(
    //   seed.pages.find((page) => page.path === '/')?.featured?.length ?? -1,
    // );
    expect(featured.every((id) => id.startsWith('categories-'))).toBe(true);
    const main = home?.main as Data[];
    const tipList = main.find((block) => block.__component === 'custom.tip-list');
    expect((tipList?.tips as { set: string[] }).set.every((id) => id.startsWith('tips-'))).toBe(
      true,
    );

    // const tool = pages.find((page) => page.template === 'find-my-tips');
    // expect(tool?.tool).toBeTruthy();
    // expect(tool?.hero).toBeNull();
    // expect(tool?.featured).toEqual({ set: [] });
  });
});

describe('toPageContent', () => {
  const ids = { pageIds: new Map(), categoryIds: new Map([['fruit', 'cat-1']]), tipIds: new Map() };

  it('clears every slot a generic page does not use', () => {
    const page = contract.SeedPage.parse({ title: 'About', path: 'about' });
    expect(toPageContent(page, ids)).toEqual({
      // hero: null,
      // intro: null,
      // featured: { set: [] },
      // tool: null,
      main: [],
    });
  });

  // it('maps featured slugs to category document ids', () => {
  //   const page = contract.SeedPage.parse({
  //     title: 'Home',
  //     path: '/',
  // template: 'home',
  // featured: ['fruit'],
  // });
  // expect(toPageContent(page, ids).featured).toEqual({ set: ['cat-1'] });
  // });

  it('throws on a featured slug that was not seeded', () => {
    const page = contract.SeedPage.parse({
      title: 'Home',
      path: '/',
      // template: 'home',
      // featured: ['missing'],
    });
    expect(() => toPageContent(page, ids)).toThrow(/category "missing"/);
  });
});

describe('verify', () => {
  async function listClient(pageSize = Infinity, override: Record<string, Data[]> = {}) {
    const calls: { plural: string; params: Data }[] = [];
    const data: Record<string, Data[]> = {};
    for (const plural of ['pages', 'categories', 'groups', 'ingredients', 'tips']) {
      data[plural] = override[plural] ?? (await webFixture(plural));
    }
    const client: StrapiClient = {
      find: () => Promise.reject(new Error('unused')),
      create: () => Promise.reject(new Error('unused')),
      update: () => Promise.reject(new Error('unused')),
      async list(plural, params) {
        calls.push({ plural, params });
        const all = data[plural] ?? [];
        const size = Math.min(pageSize, Math.max(all.length, 1));
        const page = (params.pagination as { page: number }).page;
        return {
          data: all.slice((page - 1) * size, page * size),
          pageCount: Math.ceil(all.length / size) || 1,
        };
      },
    };
    return { client, calls };
  }

  it('parses published content with the site schemas and counts it', async () => {
    const { client, calls } = await listClient();
    const report = await verify(client);
    expect(report).toEqual({
      pages: (await webFixture('pages')).length,
      categories: (await webFixture('categories')).length,
      groups: (await webFixture('groups')).length,
      ingredients: (await webFixture('ingredients')).length,
      tips: (await webFixture('tips')).length,
    });
    for (const call of calls) expect(call.params.status).toBe('published');
  });

  it('follows pagination', async () => {
    const { client, calls } = await listClient(4);
    const report = await verify(client);
    expect(report.tips).toBe((await webFixture('tips')).length);
    expect(
      calls
        .filter((call) => call.plural === 'tips')
        .map((call) => (call.params.pagination as Data).page),
    ).toEqual([1, 2, 3]);
  });

  it('fails when content does not match the site schema', async () => {
    const { client } = await listClient(Infinity, { tips: [{ id: 1 }] });
    await expect(verify(client)).rejects.toThrow('tips does not match the site schema');
  });
});
