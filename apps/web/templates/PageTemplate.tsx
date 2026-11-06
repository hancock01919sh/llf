import { DynamicZone } from '@/blocks/DynamicZone';
import type { TemplateProps } from './types';
import { Provider } from '@/components/Provider';
import { getPageProviderData } from '@/lib/cms';
const { navigation, footer, global } = await getPageProviderData();
// import { mkdir, writeFile } from 'node:fs/promises';
// import path from 'node:path';
// export async function writeFixture(key: any, data: unknown) {
//   const file = path.join(process.cwd(), 'fixtures', 'mock', `${key}.json`);
//   await mkdir(path.dirname(file), { recursive: true });
//   await writeFile(file, JSON.stringify(data, null, 2));
// }
export function PageTemplate({ page }: TemplateProps) {
  // writeFixture(page.title, page);
  console.log(page);
  return (
    <>
      <Provider navigation={navigation} footer={footer} global={global}>
        <DynamicZone page={page} />
      </Provider>
    </>
  );
}
