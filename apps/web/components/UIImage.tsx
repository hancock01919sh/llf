import Image from 'next/image';
import type { cmsType } from '@llf/contracts';

interface ResponsiveImageProps extends Omit<cmsType.Media, 'src'> {
  className?: string;
}

export function UIImage({ className = '', ...rest }: ResponsiveImageProps) {
  return (
    <picture className={`relative block overflow-hidden ${className}`}>
      <Image
        className="w-full h-full object-cover bg-ink-terra-40"
        style={{ objectFit: 'cover' }}
        fill
        src={rest.url}
        alt={rest.alternativeText || rest.name || ''}
      />
    </picture>
  );
}
export function EasyImage({
  url,
  alt,
  className = '',
}: {
  url: string;
  alt: string;
  className?: string;
}) {
  return (
    <picture className={`relative block overflow-hidden ${className}`}>
      <Image
        className="w-full h-full object-cover bg-ink-terra-40"
        style={{ objectFit: 'cover' }}
        fill
        src={url}
        alt={alt}
      />
    </picture>
  );
}
