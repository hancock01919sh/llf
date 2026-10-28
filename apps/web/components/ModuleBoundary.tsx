import { cn } from '@llf/ui';
import { forwardRef, type ReactNode } from 'react';
import { ModuleErrorBoundary } from './ModuleErrorBoundary';
import type { ModuleBoundaryBgColor } from '@/blocks/types';

export type Surface = 'paper' | 'sand' | 'mint' | 'forest-tint' | 'forest' | 'terra';

interface ModuleBoundaryProps {
  /** Short module name used in analytics, e.g. `hero`, `tip-list`. */
  type: string;
  layout?: string;
  index?: number;
  id?: string;
  surface?: ModuleBoundaryBgColor;
  className?: string;
  children: ReactNode;
  fullWidth?: boolean;
  style?: React.CSSProperties;
}

/**
 * Wraps every module. The `data-module-*` attributes drive the generic `module_view` and `cta_click`
 * events, so modules need no analytics code of their own (TDD §8).
 */
export const ModuleBoundary = forwardRef<HTMLOptionElement, ModuleBoundaryProps>((props, ref) => {
  const { type, layout, index, id, surface, className, children, fullWidth = false, style } = props;
  return (
    <section
      ref={ref}
      data-module-type={type}
      data-module-layout={layout}
      data-surface={surface}
      data-module-index={index}
      data-module-id={id}
      style={style}
    >
      <div
        className={cn(
          'max-w-page  mx-auto',
          `${fullWidth ? 'w-full' : 'px-gutter lg:px-gutter-lg'}`,
          className,
        )}
      >
        <ModuleErrorBoundary moduleType={type}>{children}</ModuleErrorBoundary>
      </div>
    </section>
  );
});
