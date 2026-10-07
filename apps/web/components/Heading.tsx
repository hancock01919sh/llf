import { cn } from '@llf/ui';
import type { cms } from '@llf/contracts';
import type { ReactNode } from 'react';

type Level = cms.HeadingLevel;

interface HeadingProps {
  /** Heading level chosen in the CMS (TDD §6.6). Visual size is set by `className`, not the level. */
  as: Level;
  className?: string;
  id?: string;
  tabIndex?: number;
  children: ReactNode;
}

export function Heading({ as: Tag, className, id, tabIndex, children }: HeadingProps) {
  return (
    <Tag id={id} tabIndex={tabIndex} className={cn('font-display uppercase', className)}>
      {children}
    </Tag>
  );
}

/** Renders a CMS `Title` component (copy + level). Renders nothing when there is no copy. */
export function CmsTitle({
  title,
  className,
}: {
  title: cms.Title | null | undefined;
  className?: string;
}) {
  if (!title?.copy) return null;
  return (
    <Heading as={title.header} className={className}>
      {title.copy}
    </Heading>
  );
}

/** The level below `level`, for item headings under a CMS title. Stops at h6. */
export function childLevel(level: Level): Level {
  const next = Math.min(Number(level.slice(1)) + 1, 6);
  return `h${next}` as Level;
}
