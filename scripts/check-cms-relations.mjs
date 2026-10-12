#!/usr/bin/env node
// Regression check for the Strapi relation cardinality (TDD §5.1, PROOF_DOC P1).
// Creates throwaway documents, links one target from several sources, and reads every link back.
// Exits 1 if any relation silently steals the target from an earlier source. Deletes what it made.
// Usage: CMS_URL=http://localhost:1337 CMS_SEED_TOKEN=<full-access token> node scripts/check-cms-relations.mjs
const base = (process.env.CMS_URL ?? '').replace(/\/$/, '');
const token = process.env.CMS_SEED_TOKEN;
if (!base || !token) {
  console.error('Set CMS_URL and CMS_SEED_TOKEN.');
  process.exit(2);
}

const created = [];

async function call(method, path, body) {
  const res = await fetch(`${base}/api/${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : (await res.json()).data;
}

async function make(plural, data) {
  const doc = await call('POST', plural, { data });
  created.push([plural, doc.documentId]);
  return doc.documentId;
}

const set = (...ids) => ({ set: ids });
const results = [];

async function check(name, run) {
  try {
    const failure = await run();
    results.push({ name, ok: failure === undefined, detail: failure ?? '' });
  } catch (error) {
    results.push({ name, ok: false, detail: String(error.message ?? error) });
  }
}

const ids = (list) => (list ?? []).map((item) => item.documentId).sort();
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

try {
  const tag = `p1-check-${Date.now()}`;

  for (const [field, plural] of [
    ['tip_type', 'tip-types'],
    ['tip_behavior', 'tip-behaviors'],
    ['tip_motivator', 'tip-motivators'],
  ]) {
    await check(`two Tips share one ${field}`, async () => {
      const term = await make(plural, { title: `${tag} term` });
      const a = await make('tips', { title: `${tag} a`, [field]: set(term) });
      const b = await make('tips', { title: `${tag} b`, [field]: set(term) });
      for (const tip of [a, b]) {
        const doc = await call('GET', `tips/${tip}?populate=${field}`);
        if (doc[field]?.documentId !== term) return `${tip} lost ${field}`;
      }
    });
  }

  const ingredients = [
    await make('ingredients', { title: `${tag} i1`, type: 'Produce' }),
    await make('ingredients', { title: `${tag} i2`, type: 'Produce' }),
  ];
  const tips = [
    await make('tips', { title: `${tag} t1` }),
    await make('tips', { title: `${tag} t2` }),
  ];
  const cat = (n, extra) =>
    make('categories', { title: `${tag} c${n}`, slug: `${tag}-c${n}`, ...extra });

  await check('Category.ingredients: one Ingredient in two Categories', async () => {
    const c1 = await cat(1, { mode: 'Ingredients', ingredients: set(...ingredients) });
    const c2 = await cat(2, { mode: 'Ingredients', ingredients: set(ingredients[0]) });
    const g1 = await call('GET', `categories/${c1}?populate=ingredients`);
    const g2 = await call('GET', `categories/${c2}?populate=ingredients`);
    if (!same(ids(g1.ingredients), [...ingredients].sort())) return 'c1 lost an ingredient';
    if (!same(ids(g2.ingredients), [ingredients[0]])) return 'c2 missing the shared ingredient';
  });

  await check('Category.tips: one Tip in two Categories', async () => {
    const c1 = await cat(3, { mode: 'Tips', tips: set(...tips) });
    const c2 = await cat(4, { mode: 'Tips', tips: set(tips[0]) });
    const g1 = await call('GET', `categories/${c1}?populate=tips`);
    const g2 = await call('GET', `categories/${c2}?populate=tips`);
    if (!same(ids(g1.tips), [...tips].sort())) return 'c1 lost a tip';
    if (!same(ids(g2.tips), [tips[0]])) return 'c2 missing the shared tip';
  });

  const catA = await cat(5, { mode: 'Ingredients' });
  const catB = await cat(6, { mode: 'Ingredients' });
  const pageA = await make('pages', {
    title: `${tag} pa`,
    path: `/${tag}-a/`,
    template: 'generic',
  });
  const pageB = await make('pages', {
    title: `${tag} pb`,
    path: `/${tag}-b/`,
    template: 'generic',
  });
  const targetC = await make('pages', {
    title: `${tag} pc`,
    path: `/${tag}-c/`,
    template: 'generic',
  });
  const targetD = await make('pages', {
    title: `${tag} pd`,
    path: `/${tag}-d/`,
    template: 'generic',
  });
  const blocks = (extra) => [
    { __component: 'component.carousel', mode: 'categories', layout: 'Basic', ...extra.carousel },
    { __component: 'component.link-list', layout: 'Basic', ...extra.linkList },
    { __component: 'custom.tip-list', ...extra.tipList },
    {
      __component: 'component.hero',
      ctas: [{ label: 'go', page: set(targetC) }],
      ...extra.hero,
    },
  ];

  await check(
    'components: carousel, link-list, tip-list, cta share targets across Pages',
    async () => {
      const write = (page) =>
        call('PUT', `pages/${page}`, {
          data: {
            main: blocks({
              carousel: { categories: set(catA, catB) },
              linkList: { pages: set(targetC, targetD) },
              tipList: { tips: set(...tips) },
            }),
          },
        });
      await write(pageA);
      await write(pageB);
      const populate =
        'populate[main][on][component.carousel][populate]=categories' +
        '&populate[main][on][component.link-list][populate]=pages' +
        '&populate[main][on][custom.tip-list][populate]=tips' +
        '&populate[main][on][component.hero][populate][ctas][populate]=page';
      for (const page of [pageA, pageB]) {
        const doc = await call('GET', `pages/${page}?${populate}`);
        const by = (name) => doc.main.find((block) => block.__component === name);
        if (!same(ids(by('component.carousel').categories), [catA, catB].sort()))
          return `${page}: carousel categories lost`;
        if (!same(ids(by('component.link-list').pages), [targetC, targetD].sort()))
          return `${page}: link-list pages lost`;
        if (!same(ids(by('custom.tip-list').tips), [...tips].sort()))
          return `${page}: tip-list tips lost`;
        if (by('component.hero').ctas[0].page?.documentId !== targetC)
          return `${page}: cta page lost`;
      }
    },
  );

  await check('Page.featured: one Category featured on two Pages', async () => {
    await call('PUT', `pages/${pageA}`, { data: { featured: set(catA) } });
    await call('PUT', `pages/${pageB}`, { data: { featured: set(catA) } });
    for (const page of [pageA, pageB]) {
      const doc = await call('GET', `pages/${page}?populate=featured`);
      if (!same(ids(doc.featured), [catA])) return `${page} lost the featured category`;
    }
  });
} finally {
  for (const [plural, id] of created.reverse()) {
    await call('DELETE', `${plural}/${id}`).catch(() => undefined);
  }
}

for (const { name, ok, detail } of results) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}
process.exit(results.every((r) => r.ok) ? 0 : 1);
