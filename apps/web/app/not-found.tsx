import type { Metadata } from 'next';
import { strings } from '@/content/strings';
import { Provider } from '@/components/Provider';
import { getPageProviderData } from '@/lib/cms';
import { BlockNotFound } from '@/blocks/NotFound';

// Render on demand so the 404 never prerenders at build and never conflicts with a static
// parent route's notFound() (Next.js app-static-to-dynamic-error). @/lib/cms revalidates.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: strings.notFound.title,
  robots: { index: false, follow: false },
};

/** The 404 page is a site string, not CMS content (TDD D21). */
export default async function PageNotFound() {
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
