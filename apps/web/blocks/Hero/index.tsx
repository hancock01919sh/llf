'use client';
import { UIVideo } from '@/components/UIVideo';
import { HeroTitle } from './HeroTitle';
import { HeroContent } from './HeroContent';
import { IconLongArrow } from '@/components/Icon';
import { useEffect, useRef, useState } from 'react';
import { findFirstVisibleContentWrapper } from '@/lib/utils';
import type { BlockProps } from '../types';
import type { cmsType } from '@llf/contracts';
export function Hero(props: BlockProps<cmsType.component.Hero>) {
  const { title, images } = props.block;
  const containerRef = useRef(null);
  const [nextVisible, setNextVisible] = useState<number>();

  useEffect(() => {
    if (!containerRef.current) return;
    const next = ((containerRef.current as HTMLElement).closest('section') as HTMLElement)
      .nextElementSibling as HTMLElement;
    if (next) {
      const first = findFirstVisibleContentWrapper(next as HTMLElement);
      if (first) {
        const offset = first.offsetTop - first.clientHeight / 2;
        setNextVisible(offset);
      }
    }
  }, [containerRef]);

  return (
    <div ref={containerRef} className="pt-8 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center ">
        <div className="lg:flex-1">
          <HeroTitle Title={title} />
          <HeroContent className="hidden lg:block" data={props.block} />
        </div>
        <UIVideo
          src={images?.[0]?.url || ''}
          className="w-full aspect-361/217 mt-10 rounded-[37px] lg:ml-10 lg:w-[40%] lg:aspect-538/698 "
          loop
          muted
        />
      </div>
      <HeroContent className="lg:hidden" data={props.block} />
      <span
        className="hidden lg:block"
        role="button"
        tabIndex={0}
        aria-label="Scroll to next section"
        onClick={() => {
          window.scrollTo({ top: nextVisible ?? 0, behavior: 'smooth' });
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            window.scrollTo({ top: nextVisible ?? 0, behavior: 'smooth' });
          }
        }}
      >
        <div className="bg-surface-paper rounded-full w-10 h-10 aspect-square flex items-center justify-center mx-auto cursor-pointer">
          <IconLongArrow point="down" />
        </div>
      </span>
    </div>
  );
}
export default Hero;
