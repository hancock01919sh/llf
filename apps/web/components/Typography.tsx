import React from 'react';

type TypographyVariant =
  | 'headline-xl'
  | 'headline-lg'
  | 'headline-md'
  | 'headline-sm'
  | 'headline-xs'
  | 'title-card'
  | 'subhead-lg'
  | 'subhead-md'
  | 'subhead-sm'
  | 'paragraph-lg'
  | 'paragraph-regular'
  | 'paragraph-sm'
  | 'label'
  | 'caption'
  | 'eyebrow'
  | 'link';

type TypographyElement = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div' | 'label';

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant: TypographyVariant;
  as?: TypographyElement;
  className?: string;
  children: React.ReactNode;
  richText?: boolean;
  id?: string;
}

const VARIANT_CLASS_MAP: Record<TypographyVariant, string> = {
  'headline-xl': 'text-headline-xl',
  'headline-lg': 'text-headline-lg',
  'headline-md': 'text-headline-md',
  'headline-sm': 'text-headline-sm',
  'headline-xs': 'text-headline-xs',
  'title-card': 'text-title-card',
  'subhead-lg': 'text-subheadline-lg',
  'subhead-md': 'text-subheadline-md',
  'subhead-sm': 'text-subheadline-sm',
  'paragraph-lg': 'text-paragraph-lg',
  'paragraph-regular': 'text-paragraph-regular',
  'paragraph-sm': 'text-paragraph-sm',
  label: 'text-label',
  caption: 'text-caption',
  eyebrow: 'text-eyebrow',
  link: 'text-link',
};

export function Typography({
  variant,
  as,
  className,
  children,
  richText = false,
  id,
}: TypographyProps) {
  const Tag = as ?? 'p';
  if (richText && typeof children === 'string') {
    return (
      <Tag
        id={id}
        className={`whitespace-pre-wrap ${[VARIANT_CLASS_MAP[variant], className]
          .filter(Boolean)
          .join(' ')}`}
        dangerouslySetInnerHTML={{ __html: children }}
      />
    );
  }
  return (
    <Tag id={id} className={[VARIANT_CLASS_MAP[variant], className].filter(Boolean).join(' ')}>
      {children}
    </Tag>
  );
}
