import type { Media } from '@llf/contracts/cms';
import Image from 'next/image';

interface ResponsiveImageProps extends Omit<Media, 'src'> {
  className?: string;
}

export function UIImage({ className = '', ...rest }: ResponsiveImageProps) {
  return (
    <picture className={`relative block overflow-hidden ${className}`}>
      <Image
        className="w-full h-full object-cover"
        style={{ objectFit: 'cover' }}
        fill
        src={rest.url}
        alt={rest.alternativeText || rest.name || ''}
      />
    </picture>
  );
}
