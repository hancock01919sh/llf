import { cn } from '@llf/ui';
import type { ReactNode } from 'react';
import { ModuleErrorBoundary } from './ModuleErrorBoundary';

export type Surface = 'paper' | 'sand' | 'mint' | 'forest-tint' | 'forest' | 'terra';

interface ModuleBoundaryProps {
  /** Short module name used in analytics, e.g. `hero`, `tip-list`. */
  type: string;
  index: number;
  id: string;
  layout?: string;
  surface?: Surface;
  className?: string;
  children: ReactNode;
}

/**
 * Wraps every module. The `data-module-*` attributes drive the generic `module_view` and `cta_click`
 * events, so modules need no analytics code of their own (TDD §8).
 */
export function ModuleBoundary({
  type,
  index,
  id,
  layout,
  surface,
  className,
  children,
}: ModuleBoundaryProps) {
  return (
    <section
      data-module-type={type}
      data-module-index={index}
      data-module-id={id}
      data-module-layout={layout}
      data-surface={surface}
      className={cn('px-gutter py-xl lg:px-gutter-lg', className)}
    >
      <div className="mx-auto max-w-page">
        <ModuleErrorBoundary moduleType={type}>{children}</ModuleErrorBoundary>
      </div>
    </section>
  );
}
