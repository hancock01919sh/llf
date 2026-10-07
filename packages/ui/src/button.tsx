import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from './cn';

/*
 * Figma Components page: Primary 1:6863 (desktop) / 1:8282 (mobile), Secondary 1:6876,
 * Tertiary 1:8293, Save 1:6889, Share 1:6907.
 * Focus is a 3px inset ring from the surface's --focus-ring (Forest on light, Mint on dark).
 * Disabled text is Terra 40; WCAG exempts inactive controls from contrast.
 */
export const buttonVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center gap-xs rounded-pill font-sans whitespace-nowrap',
    'transition-colors motion-reduce:transition-none',
    'focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-focus',
    'inactive:pointer-events-none',
    '[&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        // Mobile pressed is Mint Dark; desktop pressed is Forest with Sand text.
        primary: [
          'bg-interactive text-on-interactive hover:bg-interactive-hover',
          'active:bg-interactive-hover md:active:bg-brand-forest md:active:text-surface-sand',
          'inactive:bg-ink-terra-15 inactive:text-ink-terra-40',
        ],
        // Hover and pressed fills are light, so text switches to Terra to keep contrast on dark surfaces.
        secondary: [
          'border-[1.5px] border-line bg-transparent text-fg',
          'hover:bg-surface-paper hover:text-ink-terra active:bg-surface-sand active:text-ink-terra',
          'inactive:text-ink-terra-40',
        ],
        tertiary: ['bg-transparent text-fg active:text-fg-muted', 'inactive:text-ink-terra-40'],
        // Use aria-pressed for the Saved state.
        save: [
          'bg-surface-sand text-ink-terra hover:bg-surface-paper aria-pressed:bg-surface-mint',
          'inactive:bg-ink-terra-15 inactive:text-ink-terra-40',
        ],
        share: [
          'bg-interactive text-on-interactive hover:bg-interactive-hover',
          'active:bg-brand-forest active:text-surface-sand',
          'inactive:bg-ink-terra-15 inactive:text-ink-terra-40',
        ],
      },
      size: {
        // Mobile/Label (SemiBold 18/1) below md; Desktop/Paragraph Bold (20/1.4) from md.
        default: 'h-control px-xs text-label font-semibold md:px-lg md:text-paragraph md:font-bold',
        compact: 'h-control-compact min-w-36 px-xs text-paragraph font-bold',
      },
      width: {
        auto: '',
        full: 'w-full',
        // Mobile Primary spans the content column (Figma 361 of 402).
        mobile: 'w-full md:w-auto',
      },
    },
    compoundVariants: [
      { variant: 'save', size: 'default', className: 'h-control-compact' },
      { variant: 'share', size: 'default', className: 'h-control-compact' },
    ],
    defaultVariants: {
      variant: 'primary',
      size: 'default',
      width: 'auto',
    },
  },
);

export type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    /** Render the child element (for example a Next.js Link) with button styles. */
    asChild?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  width,
  asChild = false,
  type,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size, width }), className);
  if (asChild) {
    return <Slot className={classes} {...props} />;
  }
  return <button type={type ?? 'button'} className={classes} {...props} />;
}
