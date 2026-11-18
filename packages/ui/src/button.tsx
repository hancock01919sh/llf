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
    'text-cta font-bold inline-flex items-center justify-center box-border rounded-full w-auto h-12.5 lg:h-16.5 px-6 gap-2.5 shrink-0 whitespace-nowrap',
    'transition-colors duration-300 motion-reduce:transition-none',
    'focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-focus',
    'inactive:pointer-events-none',
    '[&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        // Mobile pressed is Mint Dark; desktop pressed is Forest with Sand text.
        primary: [
          'bg-surface-mint text-ink-terra',
          'hover:bg-surface-mint-dark',
          'active:bg-brand-forest active:text-surface-sand',
          'focus-visible:bg-surface-mint focus-visible:border-brand-forest',
          'disabled:bg-ink-terra-15 disabled:text-ink-terra-40',
        ],
        // Hover and pressed fills are light, so text switches to Terra to keep contrast on dark surfaces.
        secondary: [
          'bg-ink-terra text-surface-paper',
          'hover:bg-ink-terra-40',
          'active:bg-ink-terra-70 active:text-surface-sand',
          'focus-visible:bg-ink-terra focus-visible:border-0',
          'disabled:bg-ink-terra-15 disabled:text-ink-terra-40',
        ],
        tertiary: [
          'bg-surface-paper text-ink-terra border-ink-terra border',
          'active:bg-surface-sand active:border-ink-terra-15',
          'disabled:border-ink-terra-15 disabled:text-ink-terra-40',
        ],
        // Use aria-pressed for the Saved state.
        save: [
          'bg-surface-paper text-ink-terra border-ink-terra border',
          'active:bg-surface-sand active:border-ink-terra-15',
          'disabled:border-ink-terra-15 disabled:text-ink-terra-40',
        ],
        share: [
          'bg-ink-terra text-surface-paper',
          'hover:bg-ink-terra-40',
          'active:bg-ink-terra-70 active:text-surface-sand',
          'focus-visible:bg-ink-terra focus-visible:border-0',
          'disabled:bg-ink-terra-15 disabled:text-ink-terra-40',
        ],
      },
      size: {
        // Mobile/Label (SemiBold 18/1) below md; Desktop/Paragraph Bold (20/1.4) from md.
        default: 'md:px-lg ',
        compact: 'min-w-36',
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
