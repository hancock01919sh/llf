import type { cmsType } from '@llf/contracts';

/**
 * Strapi's local upload provider returns relative URLs (`/uploads/...`). The static site lives on a
 * different origin, so make them absolute at build time. S3/CloudFront URLs pass through unchanged.
 * TODO(BD3244-5): switch to the media CDN origin once the S3 upload provider is configured.
 */
export function mediaUrl(url: string): string {
  if (/^https?:\/\//.test(url) || url.startsWith('data:')) return url;
  const base = process.env.CMS_MEDIA_URL ?? process.env.CMS_URL;
  if (!base || !url.startsWith('/')) return url;
  return `${base.replace(/\/$/, '')}${url}`;
}

export interface ImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

/** Alt text comes from the CMS (TDD §6.6). An image without alt text is treated as decorative. */
export function toImage(media: cmsType.Media | null | undefined): ImageProps | null {
  if (!media) return null;
  return {
    src: mediaUrl(media.url),
    alt: media.alternativeText ?? '',
    width: media.width ?? undefined,
    height: media.height ?? undefined,
  };
}
