import type { cms } from '@llf/contracts';
import { cn } from '@llf/ui';
import { CmsImage } from '@/components/CmsImage';
import { CtaLink } from '@/components/CtaLink';
import { CmsTitle } from '@/components/Heading';
import { RichText } from '@/components/RichText';
import type { BlockProps } from './types';

/** Teaser (`component.teaser`): title, rich text, CTAs, and an optional image. */
export function Teaser({ block }: BlockProps<cms.TeaserBlock>) {
  const image = block.images?.[0];
  const body = <RichText content={block.description} className="text-paragraph" />;
  return (
    <div className={cn('grid items-center gap-lg', image && 'lg:grid-cols-2')}>
      <div className="flex flex-col gap-md">
        <CmsTitle title={block.title} className="text-3xl lg:text-5xl" />
        {block.layout === 'Quote' ? (
          <blockquote className="border-l-4 border-line pl-md">{body}</blockquote>
        ) : (
          body
        )}
        {block.ctas.length > 0 ? (
          <div className="flex flex-wrap gap-sm">
            {block.ctas.map((cta, i) => (
              <CtaLink
                key={cta.id ?? i}
                cta={cta}
                variant={block.layout === 'Highlight' ? 'primary' : 'secondary'}
              />
            ))}
          </div>
        ) : null}
      </div>
      <CmsImage media={image} className="w-full rounded-md" />
    </div>
  );
}
