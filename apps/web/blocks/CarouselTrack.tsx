'use client';

import { Button } from '@llf/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { format, strings } from '@/content/strings';

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * A scroll-snap list with previous/next buttons. Without JS it is still a scrollable list. Movement
 * is instant when the user prefers reduced motion (TDD §6.6).
 */
export function CarouselTrack({
  labelledBy,
  count,
  children,
}: {
  labelledBy: string;
  count: number;
  children: ReactNode;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const [current, setCurrent] = useState(0);

  const update = useCallback(() => {
    const list = listRef.current;
    const first = list?.firstElementChild as HTMLElement | null;
    if (!list || !first) return;
    const step = first.offsetWidth || 1;
    setCurrent(Math.min(count - 1, Math.round(list.scrollLeft / step)));
  }, [count]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.addEventListener('scroll', update, { passive: true });
    return () => list.removeEventListener('scroll', update);
  }, [update]);

  const move = (delta: number) => {
    const list = listRef.current;
    const target = list?.children[Math.max(0, Math.min(count - 1, current + delta))] as
      HTMLElement | undefined;
    if (!list || !target) return;
    list.scrollTo({
      left: target.offsetLeft - list.offsetLeft,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-labelledby={labelledBy}
      className="flex flex-col gap-sm"
    >
      <ul
        ref={listRef}
        className="flex snap-x snap-mandatory gap-md overflow-x-auto pb-xs motion-safe:scroll-smooth"
      >
        {children}
      </ul>
      <div className="flex items-center gap-sm">
        <Button
          variant="tertiary"
          size="compact"
          onClick={() => move(-1)}
          disabled={current === 0}
          aria-label={strings.carousel.previous}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <Button
          variant="tertiary"
          size="compact"
          onClick={() => move(1)}
          disabled={current >= count - 1}
          aria-label={strings.carousel.next}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
        <p aria-live="polite" className="text-label">
          {format(strings.carousel.slide, { index: current + 1, total: count })}
        </p>
      </div>
    </section>
  );
}
