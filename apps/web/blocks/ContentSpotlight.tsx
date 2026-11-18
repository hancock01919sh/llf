'use client';
import { UIImage } from '@/components/UIImage';
import type { cmsType } from '@llf/contracts';
import type { BlockProps } from './types';
import { BlockTitle } from '@/components/BlockTitle';
import { RichText } from '@/components/RichText';
import TransitionLink from '@/components/TransitionLink';
export function BlockContentSpotlight(
  props: BlockProps<cmsType.component.ContentSpotlightDeepRef>,
) {
  const { image, title, description, cta, makeImageLeft } = props.block;
  return (
    <>
      <div className={`flex items-center flex-col gap-15 py-15 lg:py-25 lg:flex-row `}>
        <UIImage
          className={`w-full aspect-320/272 lg:aspect-538/673 lg:h-auto lg:w-[40%] ${makeImageLeft ? 'lg:order-1' : 'lg:order-2'}  rounded-md overflow-hidden`}
          src={image?.url || ''}
          alt={image?.alternativeText || image?.name || title.copy || ''}
        />
        {/* <img
          className={`w-full aspect-320/272 lg:aspect-auto lg:h-auto lg:w-[40%] ${makeImageLeft ? 'lg:order-1' : 'lg:order-2'}  rounded-md overflow-hidden`}
          src={image?.url || ''}
          alt={image?.alternativeText || image?.name || title.copy || ''}
        /> */}
        <div className={`flex flex-1 flex-col text-center gap-5 lg:text-left lg:order-1  `}>
          <BlockTitle title={title} moduleIndex={props.index} />
          <RichText className="text-paragraph-lg" content={description} />
          {cta?.label && (
            <TransitionLink href={cta?.href || ''} className="btn black w-max mx-auto lg:mx-0">
              {cta.label}
            </TransitionLink>
          )}
        </div>
      </div>
    </>
  );
}
