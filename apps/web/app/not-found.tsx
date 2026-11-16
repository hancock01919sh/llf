import type { Metadata } from 'next';
import { connection } from 'next/server';
import { strings } from '@/content/strings';
import { Provider } from '@/components/Provider';
import { getPageProviderData } from '@/lib/cms';
import { BlockNotFound } from '@/blocks/NotFound';
export const metadata: Metadata = {
  title: strings.notFound.title,
  robots: { index: false, follow: false },
};

/** The 404 page is a site string, not CMS content (TDD D21). */
export default async function PageNotFound() {
  await connection();
  const { navigation, footer, global } = await getPageProviderData();
  return (
    <Provider path="/not-found" navigation={navigation} footer={footer} global={global}>
      <div data-surface="forest">
        <BlockNotFound
          {...{
            title: strings.notFound.title,
            description: strings.notFound.body,
            backgroundColor: 'forest',
            cta: strings.notFound.home,
          }}
        />
      </div>
    </Provider>
  );
}
