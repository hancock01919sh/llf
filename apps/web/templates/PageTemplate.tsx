import { DynamicZone } from '@/blocks/DynamicZone';
import type { TemplateProps } from './types';
import { Provider } from '@/components/Provider';
import { getPageProviderData } from '@/lib/cms';
// import { mkdir, writeFile } from 'node:fs/promises';
// import path from 'node:path';
// export async function writeFixture(key: any, data: unknown) {
//   const file = path.join(process.cwd(), 'fixtures', 'mock', `${key}.json`);
//   await mkdir(path.dirname(file), { recursive: true });
//   await writeFile(file, JSON.stringify(data, null, 2));
// }
export async function PageTemplate({ page, categoryData }: TemplateProps) {
  // Read on every render so a CMS publish reaches the page on the next ISR revalidation (TDD D36).
  const { navigation, footer, global } = await getPageProviderData();
  // writeFixture(page.title, page);
  // writeFixture('navigation', navigation);
  // writeFixture('footer', footer);
  // writeFixture('global', global);
  return (
    <>
      <Provider navigation={navigation} footer={footer} global={global} path={page.path}>
        <DynamicZone page={page} categoryData={categoryData} />
      </Provider>
    </>
  );
}
