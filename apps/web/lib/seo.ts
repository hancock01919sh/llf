import type { Metadata } from 'next';
import { strings } from '@/content/strings';
import type { cmsType } from '@llf/contracts';

/** SEO helpers (TDD §6.7). Metadata comes from the CMS `seo` component; these fill the gaps. */

export const SITE_URL = (process.env.SITE_URL ?? 'https://longlivefood.org').replace(/\/$/, '');

/** Only production is indexable. Dev, staging, and PR previews are `noindex` (TDD §6.7). */
export const INDEXABLE = process.env.SITE_ENV === 'prod';

export function absoluteUrl(path: string): string {
  const clean = path.replace(/^\/+/, '');
  return clean ? `${SITE_URL}/${clean.replace(/\/?$/, '/')}` : `${SITE_URL}/`;
}

interface PageMetadataInput {
  title: string;
  path: string;
  seo?: cmsType.shared.Seo | null;
  description?: string | null;
  noindex?: boolean;
}

export function pageMetadata({
  title,
  path,
  seo,
  description,
  noindex,
}: PageMetadataInput): Metadata {
  const isHome = path.replace(/\//g, '') === '';
  const metaTitle = seo?.metaTitle ?? title;
  const metaDescription = seo?.metaDescription ?? description ?? undefined;
  const canonical = absoluteUrl(path);
  return {
    title: isHome ? { absolute: metaTitle } : metaTitle,
    description: metaDescription,
    keywords: seo?.metaKeywords ?? undefined,
    alternates: { canonical },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: canonical,
      siteName: strings.site.name,
      type: 'website',
    },
    robots: noindex || !INDEXABLE ? { index: false, follow: !noindex } : undefined,
  };
}

type JsonLd = Record<string, unknown>;

export function organizationJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: strings.site.name,
    url: absoluteUrl('/'),
  };
}

export function websiteJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: strings.site.name,
    url: absoluteUrl('/'),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function itemListJsonLd(names: string[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: names.map((name, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name,
    })),
  };
}

/** Escapes `<` so CMS text can't close the script tag. */
export function serializeJsonLd(data: JsonLd | JsonLd[]): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
