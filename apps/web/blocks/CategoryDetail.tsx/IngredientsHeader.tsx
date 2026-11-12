'use client';
import { IconArrow, IconCheck } from '@/components/Icon';
import { Typography } from '@/components/Typography';
import { useEffect, useRef, useState } from 'react';
import { IngredientsTipsPopup } from './IngredientsTipsPopup';
import { RichText } from '@/components/RichText';
import type { CategoryDetailWithSearchProps } from '.';
import type { cmsType } from '@llf/contracts';
import { BlockTitle } from '@/components/BlockTitle';
import { UIImage } from '@/components/UIImage';
export function IngredientsHeader(
  props: CategoryDetailWithSearchProps & {
    bgColor?: string;
    onSearch?: (value: string) => void;
    className?: string;
    Placeholder?: string | null;
  },
) {
  const [open, setOpen] = useState(false);
  const { categoryData, popup } = props;
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current === null) return;
    const clickDom = ref.current.querySelector('u');
    if (clickDom) {
      clickDom.addEventListener('click', () => {
        setOpen(true);
      });
    }
    return () => {
      clickDom?.removeEventListener('click', () => {
        setOpen(true);
      });
    };
  }, []);
  const isSearch = props.onSearch || props.Placeholder !== undefined;
  return (
    <>
      <div
        className={`${isSearch ? ' bg-surface-paper' : 'bg-brand-forest'} px-gutter  lg:px-0 py-15 lg:text-center mx-auto ${categoryData ? 'pt-8 lg:pt-10 lg:pb-25' : 'lg:py-25'} ${props.className || ''}`}
      >
        {categoryData && (
          <Typography variant="link" className="flex-center mb-8 lg:mb-10">
            <IconArrow point="left" className="[&_path]:stroke-surface-mint" />
            <span className="ml-1 font-bold text-surface-mint"> Back to Explore the Library</span>
          </Typography>
        )}
        <div className="lg:flex-center lg:gap-15">
          {categoryData && (
            <UIImage
              src={categoryData?.image?.url || ''}
              alt={
                categoryData?.image?.alternativeText ||
                categoryData?.image?.name ||
                categoryData.title
              }
              className="aspect-362/279 lg:aspect-538/414 w-full lg:w-[40%] rounded-md overflow-hidden mb-10 lg:mb-0"
            />
          )}
          <div className={`${categoryData ? 'lg:text-left' : 'flex-1'}`}>
            <Typography variant="eyebrow" className="font-bold lg:font-normal">
              {categoryData?.group?.title || props.subTitle}
            </Typography>
            {/* <Typography role="heading" as="h1" variant="headline-lg" className=" uppercase mt-10">
              {categoryData?.title || props.title}
            </Typography> */}
            <BlockTitle
              title={{
                copy: categoryData?.title || props.title?.copy || '',
                header: 'h1',
              }}
              moduleIndex={0}
              className="mt-10"
            />

            <Typography variant="subhead-lg" className="mt-5">
              {categoryData?.description || props.description}
            </Typography>
            {props?.placeholder && (
              <input
                className="mt-10 w-full bg-[#FFFEFB] border border-ink-terra-15 rounded-pill p-5 text-paragraph-sm font-bold placeholder:text-ink-terra outline-ink-terra lg:w-[46%] "
                type="text"
                placeholder={props.placeholder}
                aria-label={props.placeholder}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = (e.target as HTMLInputElement).value as string;
                    if (value.trim() === '') return;
                    props?.onSearch?.(value);
                  }
                }}
              />
            )}
            <div
              className={`px-4 py-2 flex-center lg:mx-auto gap-2 bg-ink-terra rounded-pill w-max mt-10  ${categoryData ? 'lg:mt-10 lg:mr-auto lg:ml-0' : 'lg:mt-15'} `}
            >
              <IconCheck className="[&_path]:fill-semantic-leaf lg:w-6 lg:h-6" />
              <div
                ref={ref}
                className="text-paragraph-regular [&_u]:cursor-pointer text-surface-sand"
              >
                <RichText content={props.statement} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <IngredientsTipsPopup
        open={open}
        onClose={() => setOpen(false)}
        {...(popup as cmsType.component.TipsPopupDeepRef)}
      />
    </>
  );
}
