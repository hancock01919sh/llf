'use client';
import { Typography } from '@/components/Typography';
import { UIImage } from '@/components/UIImage';
import type { cmsType } from '@llf/contracts';
import type { BlockProps } from './types';
import { BlockTitle } from '@/components/BlockTitle';
import { useEffect, useRef, useState } from 'react';
import { useAdjacent } from '@/components/hooks/useAdjacent';
import { useDevice } from '@/components/hooks/useDevice';
export function BlockTextAndImage55(props: BlockProps<cmsType.component._5050TextAndImageDeepRef>) {
  const {
    title,
    description,
    image,
    makeImageLeft,
    addBackgroundColor,
    positionOfAddingBgColor,
    backgroundColor,
  } = props.block;
  const ref = useRef<HTMLDivElement>(null);
  const currentBgColor =
    backgroundColor === 'forest' ? 'var(--color-brand-forest)' : 'var(--color-surface-paper)';
  const adjacent = useAdjacent({ originalRef: ref });
  const [prevSectionBgColor, setPrevSectionBgColor] = useState(currentBgColor);
  useEffect(() => {
    if (!addBackgroundColor) return;
    if (adjacent.next && positionOfAddingBgColor === 'Up ') {
      setPrevSectionBgColor(getComputedStyle(adjacent.prev as HTMLElement).backgroundColor);
    }
  }, [adjacent, addBackgroundColor, positionOfAddingBgColor]);
  const { isMobile } = useDevice();
  return (
    <div
      ref={ref}
      className={`px-gutter lg:px-gutter-lg py-15 lg:py-25 ${addBackgroundColor ? 'pt-0 lg:py-25' : ' '}`}
      style={{
        backgroundImage: `linear-gradient(${isMobile ? prevSectionBgColor : currentBgColor} 0 10vw, ${currentBgColor} 10vw 100%)`,
      }}
    >
      <div className="flex flex-col gap-15 lg:flex-row5 lg:flex-row lg:gap-18.25 items-center ">
        <div
          className={`flex flex-col gap-5 lg:w-1/2 ${makeImageLeft ? 'order-2' : 'order-1'} text-center lg:text-left`}
        >
          <BlockTitle title={title} moduleIndex={props.index} />
          <Typography variant="paragraph-lg">{description}</Typography>
        </div>
        <UIImage
          src={image?.url || ''}
          alt={image?.alternativeText || image?.name || title.copy || ''}
          className={`w-full rounded-md overflow-hidden aspect-362/244 lg:w-1/2 lg:aspect-650/428 ${makeImageLeft ? 'order-1' : 'order-2'}`}
        />
      </div>
    </div>
  );
}
