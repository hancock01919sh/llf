import type { cms } from '@llf/contracts';
import { cn } from '@llf/ui';
import Link from 'next/link';
import { CmsImage } from '@/components/CmsImage';
import { CtaLink } from '@/components/CtaLink';
import { CmsTitle, Heading, childLevel } from '@/components/Heading';
import { CarouselTrack } from './CarouselTrack';
import type { BlockProps } from './types';

/**
 * Category carousel (`component.carousel`). Slides are rendered on the server; `CarouselTrack` only
 * adds the previous/next controls and the slide announcement (TDD §6.6).
 */
export function Carousel({ block, index }: BlockProps<cms.CarouselBlock>) {
  if (block.categories.length === 0) return null;
  const itemLevel = childLevel(block.title?.copy ? block.title.header : 'h2');
  const labelId = `carousel-${block.id}-${index}`;
  return (
    <div className="flex flex-col gap-md">
      <div id={labelId}>
        <CmsTitle title={block.title} className="text-3xl lg:text-5xl" />
      </div>
      {block.description ? <p className="text-paragraph">{block.description}</p> : null}
      <CarouselTrack labelledBy={labelId} count={block.categories.length}>
        {block.categories.map((category) => (
          <li
            key={category.documentId}
            className={cn(
              'shrink-0 snap-start',
              block.layout === 'Compact' ? 'w-40 lg:w-56' : 'w-64 lg:w-80',
            )}
          >
            <Link
              href={`/tips/${category.slug}/`}
              className="flex flex-col gap-xs rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
            >
              <CmsImage
                media={category.image}
                className="aspect-square w-full rounded-sm object-cover"
              />
              <Heading as={itemLevel} className="text-xl">
                {category.title}
              </Heading>
            </Link>
          </li>
        ))}
      </CarouselTrack>
      {block.ctas.length > 0 ? (
        <div className="flex flex-wrap gap-sm">
          {block.ctas.map((cta, i) => (
            <CtaLink key={cta.id ?? i} cta={cta} variant="secondary" />
          ))}
        </div>
      ) : null}
    </div>
  );
}
