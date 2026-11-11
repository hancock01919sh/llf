import type { Metadata } from 'next';
import { strings } from '@/content/strings';
import { Provider } from '@/components/Provider';
import { getPageProviderData } from '@/lib/cms';
import { BlockNotFound } from '@/blocks/NotFound';
const { navigation, footer, global } = await getPageProviderData();
export const metadata: Metadata = {
  title: strings.notFound.title,
  robots: { index: false, follow: false },
};

/** The 404 page is a site string, not CMS content (TDD D21). == */
export default function PageNotFound() {
  return (
    <Provider navigation={navigation} footer={footer} global={global}>
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
