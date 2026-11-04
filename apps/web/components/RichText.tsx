'use client';

import type { cms } from '@llf/contracts';
import { BlocksRenderer, type BlocksContent } from '@strapi/blocks-react-renderer';
import Link from 'next/link';

/**
 * Long-form rich text from Strapi's Blocks editor (TDD §6.4). Overrides keep links on the site router,
 * mark external links, and drop `h1` from editor content so a page keeps exactly one h1 (TDD §6.6).
 */
export function RichText({
  content,
  className,
}: {
  content: cms.BlocksContent | null | undefined;
  className?: string;
}) {
  if (!content || content.length === 0) return null;
  return (
    <div className={className}>
      <BlocksRenderer
        content={content as unknown as BlocksContent}
        blocks={{
          heading: ({ children, level }) => {
            const Tag = level === 1 ? 'h2' : (`h${level}` as const);
            return <Tag className="font-display uppercase">{children}</Tag>;
          },
          link: ({ children, url }) =>
            url.startsWith('/') ? (
              <Link href={url} className="underline underline-offset-4">
                {children}
              </Link>
            ) : (
              <a href={url} className="underline underline-offset-4" rel="noopener noreferrer">
                {children}
              </a>
            ),
          image: ({ image }) => (
            // eslint-disable-next-line @next/next/no-img-element -- static export; images are unoptimized
            <img
              src={image.url}
              alt={image.alternativeText ?? ''}
              width={image.width}
              height={image.height}
              loading="lazy"
            />
          ),
        }}
      />
    </div>
  );
}
