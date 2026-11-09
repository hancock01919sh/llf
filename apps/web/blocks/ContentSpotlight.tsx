'use client';
import { Typography } from '@/components/Typography';
import { UIImage } from '@/components/UIImage';
import type { cmsType } from '@llf/contracts';
import type { BlockProps } from './types';
import { BlockTitle } from '@/components/BlockTitle';
export function BlockContentSpotlight(
  props: BlockProps<cmsType.component.ContentSpotlightDeepRef>,
) {
  const { image, title, description } = props.block;
  return (
    <>
      <div className={`flex items-center flex-col gap-15 py-15 lg:py-25 lg:flex-row `}>
        <UIImage
          className={`w-full  aspect-320/272 lg:aspect-538/673 lg:w-[40%] lg:order-1 rounded-md overflow-hidden`}
          {...image}
        />
        <div className={`flex flex-1 flex-col text-center gap-5 lg:text-left  `}>
          <BlockTitle title={title} moduleIndex={props.index} />
          <Typography variant="paragraph-lg">{description}</Typography>
        </div>
      </div>
    </>
  );
}
