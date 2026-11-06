import { cn } from '@llf/ui';
import type { ReactNode } from 'react';
import { ModuleErrorBoundary } from './ModuleErrorBoundary';
import z from 'zod';

export type Surface = 'paper' | 'sand' | 'mint' | 'forest-tint' | 'forest' | 'terra';
export const SurfaceSchema = z.enum(['paper', 'sand', 'mint', 'forest-tint', 'forest', 'terra']);
interface ModuleBoundaryProps {
  /** Short module name used in analytics, e.g. `hero`, `tip-list`. */
  type: string;
  index: number;
  id: string;
  layout?: string;
  surface?: Surface;
  className?: string;
  children: ReactNode;
  isFullwidth?: boolean;
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
  isFullwidth,
}: ModuleBoundaryProps) {
  return (
    <section
      data-module-type={type}
      data-module-index={index}
      data-module-id={id}
      data-module-layout={layout}
      data-surface={surface}
    >
      <div
        className={cn(
          'lg:max-w-page mx-auto lg:px-gutter-lg',
          `${isFullwidth ? 'w-full px-0' : 'px-gutter'}`,
          className,
        )}
      >
        <ModuleErrorBoundary moduleType={type}>{children}</ModuleErrorBoundary>
      </div>
    </section>
  );
}
