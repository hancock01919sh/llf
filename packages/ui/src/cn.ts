import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/*
 * tailwind-merge has to know our token names. Without this, `text-label` (a font size) and
 * `text-fg` (a color) look like the same group and one of them is silently dropped.
 * Keep in sync with styles/tokens.css.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['cta'],
      spacing: [
        '2xs',
        'xs',
        'sm',
        'md',
        'lg',
        'xl',
        '2xl',
        'gutter',
        'gutter-lg',
        'control',
        'control-compact',
      ],
      radius: ['pill'],
      container: ['page'],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
