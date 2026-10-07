import type { cms } from '@llf/contracts';
import { cn } from '@llf/ui';
import { toImage } from '@/lib/media';

/**
 * A CMS image. Alt text comes from the CMS; an image without it is decorative (TDD §6.6).
 * Plain `<img>` because the static export has no image optimizer (TDD §6.2).
 */
export function CmsImage({
  media,
  className,
  priority = false,
}: {
  media: cms.Media | null | undefined;
  className?: string;
  priority?: boolean;
}) {
  const image = toImage(media);
  if (!image) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static export; images are unoptimized
    <img
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      className={cn('h-auto max-w-full', className)}
    />
  );
}
