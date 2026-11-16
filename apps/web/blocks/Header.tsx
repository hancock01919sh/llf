'use client';
import { Typography } from '@/components/Typography';
import { useEffect, useRef, useState } from 'react';
import { useAdjacent } from '@/components/hooks/useAdjacent';
import { UIVideo } from '@/components/UIVideo';
import type { BlockProps } from './types';
import type { cmsType } from '@llf/contracts';
import { BlockTitle } from '@/components/BlockTitle';
import { UIImage } from '@/components/UIImage';

export function BlockHeader(props: BlockProps<cmsType.component.Header>) {
  // `image` is a legacy field name that holds a video; the contract allows nullish, so check the URL.
  const hasMedia = !!props.block.image?.url;
  const isVideo = props.block.image?.url?.endsWith('.mp4');
  const isImage = !isVideo;
  const {
    title,
    subTitle,
    description,
    addBackgroundColor,
    positionOfAddingBgColor,
    backgroundColor,
  } = props.block;
  const ref = useRef<HTMLDivElement | null>(null);
  const adjacent = useAdjacent({ originalRef: ref });
  const currentBgColor =
    backgroundColor === 'forest' ? 'var(--color-brand-forest)' : 'var(--color-brand-terra)';
  const [nextSectionBgColor, setNextSectionBgColor] = useState(currentBgColor);
  useEffect(() => {
    if (!addBackgroundColor) return;
    if (adjacent.next && positionOfAddingBgColor === 'down') {
      setNextSectionBgColor(getComputedStyle(adjacent.next as HTMLElement).backgroundColor);
    }
  }, [adjacent, addBackgroundColor, positionOfAddingBgColor]);
  return (
    <>
      <div
        ref={ref}
        className={`flex flex-col px-gutter lg:px-0 lg:flex-row lg:items-center lg:gap-10 py-15 ${!hasMedia ? 'lg:py-25' : ''} ${addBackgroundColor ? (positionOfAddingBgColor === 'down' ? 'pb-10 lg:pb-15!' : '') : ''}`}
      >
        <div
          className={`mx-auto w-full  ${hasMedia ? 'text-left lg:w-[57.73%]' : 'text-center lg:w-[66%] '}`}
        >
          <Typography className="font-bold text-lg-subhead-sm" variant="eyebrow">
            {subTitle}
          </Typography>
          {title && (
            <BlockTitle
              title={title}
              moduleIndex={props.index}
              className={`mt-10 lg:mt-6.25  ${hasMedia ? 'lg:mt-10!' : ''}`}
            />
          )}
          <Typography
            className={`mt-5 lg:mt-6.25 ${hasMedia ? 'lg:mt-5!' : ''}`}
            variant="subhead-lg"
          >
            {description}
          </Typography>
        </div>
        {hasMedia && isImage && (
          <UIImage
            src={props.block.image?.url || ''}
            alt={props.block.image?.alternativeText || ''}
            className="hidden lg:block w-full aspect-538/698 flex-1 rounded-md overflow-hidden lg:w-1/2 order-1"
          />
        )}
        {hasMedia && isVideo && (
          <UIVideo
            src={props.block.image?.url || ''}
            loop={true}
            className="hidden lg:block w-full aspect-538/698 flex-1 rounded-md overflow-hidden lg:w-1/2 order-1 "
          />
        )}
      </div>
      {addBackgroundColor && positionOfAddingBgColor === 'down' && (
        <div
          className={`px-5 lg:hidden`}
          style={{
            backgroundImage: `linear-gradient(${currentBgColor} 0 50%, ${nextSectionBgColor} 50% 100%)`,
          }}
        >
          {hasMedia && isVideo && (
            <UIVideo
              src={props.block.image?.url}
              loop={true}
              className="w-full aspect-370/362 rounded-md overflow-hidden lg:w-1/2 order-1"
            />
          )}
          {hasMedia && isImage && (
            <UIImage
              src={props.block.image?.url || ''}
              alt={props.block.image?.alternativeText || ''}
              className="w-full aspect-370/362 rounded-md overflow-hidden lg:w-1/2 order-1"
            />
          )}
        </div>
      )}
    </>
  );
}
