import type { cms } from '@llf/contracts';
import { Button, type ButtonProps } from '@llf/ui';
import Link from 'next/link';
import { ctaHref, isInternalHref } from '@/lib/paths';

type Variant = NonNullable<ButtonProps['variant']>;

/**
 * A CMS CTA rendered as a button-styled link. `data-cta*` attributes feed the generic `cta_click`
 * event (TDD §8). Renders nothing when the CTA has no label or destination.
 */
export function CtaLink({
  cta,
  variant = 'primary',
  className,
}: {
  cta: cms.Cta;
  variant?: Variant;
  className?: string;
}) {
  const href = ctaHref(cta);
  const label = cta.label?.trim() || cta.page?.title;
  if (!href || !label) return null;
  const data = { 'data-cta': '', 'data-cta-variant': variant };
  return (
    <Button asChild variant={variant} className={className}>
      {isInternalHref(href) ? (
        <Link href={href} {...data}>
          {label}
        </Link>
      ) : (
        <a href={href} rel="noopener noreferrer" {...data}>
          {label}
        </a>
      )}
    </Button>
  );
}
