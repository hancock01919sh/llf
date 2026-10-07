import '@fontsource/anton/400.css';
import '@fontsource-variable/fustat/index.css';
import './globals.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Analytics } from '@/components/Analytics';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { JsonLd } from '@/components/JsonLd';
import { MAIN_ID, SkipLink } from '@/components/SkipLink';
import { strings } from '@/content/strings';
import { INDEXABLE, SITE_URL, organizationJsonLd, websiteJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: strings.site.name, template: `%s | ${strings.site.name}` },
  // Dev, staging, and previews are never indexed (TDD §6.7). server.mjs also sends X-Robots-Tag.
  robots: INDEXABLE ? undefined : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#fefaef',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body data-surface="paper" className="flex min-h-dvh flex-col font-sans antialiased">
        <SkipLink />
        <Header />
        <main id={MAIN_ID} tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <Footer />
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <Analytics />
      </body>
    </html>
  );
}
