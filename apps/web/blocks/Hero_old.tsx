import type { cms } from '@llf/contracts';
import { cn } from '@llf/ui';
import { CmsImage } from '@/components/CmsImage';
import { CtaLink } from '@/components/CtaLink';
import { Heading } from '@/components/Heading';
import { RichText } from '@/components/RichText';
import type { BlockProps } from './types';

/**
 * Hero (`component.hero`). The heading is the page title. It is the page's h1 when the hero comes
 * first, which is the normal case; otherwise it drops to h2 so the page keeps one h1 (TDD §6.6).
 */
export function Hero({ block, index, pageTitle }: BlockProps<cms.HeroBlock>) {
  const image = block.images?.[0];
  const isPrimary = block.layout === 'Primary';
  return (
    <div
      className={cn(
        'grid items-center gap-lg',
        image && 'lg:grid-cols-2',
        !isPrimary && 'text-center lg:text-left',
      )}
    >
      <div className="flex flex-col gap-md">
        {block.eyebrow ? <p className="text-label uppercase">{block.eyebrow}</p> : null}
        <Heading as={index === 0 ? 'h1' : 'h2'} className="text-5xl lg:text-7xl">
          {pageTitle}
        </Heading>
        <RichText content={block.description} className="text-paragraph" />
        {block.ctas.length > 0 ? (
          <div className="flex flex-wrap gap-sm">
            {block.ctas.map((cta, i) => (
              <CtaLink key={cta.id ?? i} cta={cta} variant={i === 0 ? 'primary' : 'secondary'} />
            ))}
          </div>
        ) : null}
      </div>
      <CmsImage media={image} priority={index === 0} className="w-full rounded-md" />
    </div>
  );
}
