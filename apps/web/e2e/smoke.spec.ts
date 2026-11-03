import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/*
 * Smoke test over the fixture build (CMS_FIXTURES=1). The tool service isn't running here,
 * so /api/find-tips/* is mocked with page.route, using the contract shapes in @llf/contracts.
 */

const CATALOG_VERSION = 'd6b0257e63c4';
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function expectAccessible(page: Page) {
  await expect(page.locator('h1')).toHaveCount(1);
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(
    violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/find-tips/status', (route) =>
    route.fulfill({ json: { mode: 'live', catalogVersion: CATALOG_VERSION } }),
  );
});

const STATIC_PAGES = ['/', '/tips/', '/tips/fruits-and-veggies/', '/find-my-tips/', '/about/'];

for (const path of STATIC_PAGES) {
  test(`${path} renders and passes axe`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expectAccessible(page);
  });
}

test('search reads the term from the fragment', async ({ page }) => {
  await page.goto('/search/#q=banana');
  // The design draft did not include the result text, so it was not checked.
  // await expect(page.getByRole('status')).toContainText(/result/i);
  await expect(page.getByRole('heading', { level: 2, name: /banana/i }).first()).toBeVisible();
  await expectAccessible(page);
});

test('results page renders tips for each slug', async ({ page }) => {
  await page.goto('/find-my-tips/results/?i=banana,milk');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Your Ingredients List' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: /banana/i })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: /milk/i })).toBeVisible();
  await expectAccessible(page);
});

test('unknown paths get the 404 page', async ({ page }) => {
  const response = await page.goto('/nope/');
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Oops. We dropped the beet.' }),
  ).toBeVisible();
  await expectAccessible(page);
});

test('typed ingredients go to the results page', async ({ page }) => {
  let body: unknown;
  await page.route('**/api/find-tips/extract', (route) => {
    body = route.request().postDataJSON();
    return route.fulfill({
      json: {
        requestId: 'e2e',
        detectedType: 'shopping_list',
        readable: true,
        matches: [
          { slug: 'banana', title: 'Banana', inferred: false },
          { slug: 'milk', title: 'Milk', inferred: false },
        ],
        unmatchedCount: 1,
        source: 'model',
        catalogVersion: CATALOG_VERSION,
      },
    });
  });

  await page.goto('/find-my-tips/');
  await page.getByRole('tab', { name: '🔗 Paste Link' }).click();
  const typedUrl = 'https://www.google.com';
  await page.getByPlaceholder('Enter a recipe URL or video link').fill(typedUrl);
  await page.getByRole('button', { name: 'Find Tips' }).click();

  await expect(page).toHaveURL(/\/find-my-tips\/results\/\?i=banana(%2C|,)milk$/);
  // The UI only offers the URL and image tabs, so a typed link is submitted as `url`.
  expect(body).toEqual({ inputType: 'url', url: typedUrl });
  await expect(page.getByRole('heading', { level: 2, name: 'Banana' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Milk' })).toBeVisible();
});

test('slash redirect keeps the ?i= query', async ({ request }) => {
  const response = await request.get('/find-my-tips/results?i=banana,milk', { maxRedirects: 0 });
  expect(response.status()).toBe(301);
  expect(response.headers()['location']).toBe('/find-my-tips/results/?i=banana,milk');
});

test('healthz answers 200', async ({ request }) => {
  const response = await request.get('/healthz');
  expect(response.status()).toBe(200);
});
