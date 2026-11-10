'use client';
import { mediaUrl } from '@/lib/media';
import Image, { type ImageProps } from 'next/image';

interface ResponsiveImageProps extends ImageProps {
  className?: string;
  src: string;
  alt: string;
}

export function UIImage({ className = '', src, ...rest }: ResponsiveImageProps) {
  return (
    <picture className={`relative block overflow-hidden ${className}`}>
      <Image
        className="w-full h-full object-cover"
        style={{ objectFit: 'cover' }}
        fill={rest.width ? false : true}
        onError={(e) => {
          const target = e.target as HTMLElement;
          target.classList.add('bg-ink-terra-40');
        }}
        src={`${src}`}
        {...rest}
      />
    </picture>
  );
}
