import type { MetadataRoute } from 'next';
import { INDEXABLE, SITE_URL } from '@/lib/seo';

export const dynamic = 'force-static';

/** Only prod is crawlable; dev, staging, and PR previews block everything (TDD §6.7). */
export default function robots(): MetadataRoute.Robots {
  if (!INDEXABLE) return { rules: { userAgent: '*', disallow: '/' } };
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/find-my-tips/results/', '/search/'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
