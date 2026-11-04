'use client';
import { IconCheck } from '@/components/Icon';
import { Typography } from '@/components/Typography';
import { useEffect, useRef, useState } from 'react';
import { IngredientsTipsPopup } from './IngredientsTipsPopup';
import { RichText } from '@/components/RichText';
import type { CategoryDetailProps } from '.';
import type { Category } from '@llf/contracts/cms';
import type { cmsType } from '@llf/contracts';
interface IngredientsHeaderProps extends CategoryDetailProps {
  categoryData?: Category;
  isSearch?: boolean;
  onSearch?: (value: string) => void;
  className?: string;
}
export function IngredientsHeader(props: IngredientsHeaderProps) {
  const [open, setOpen] = useState(false);
  const { categoryData } = props;
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current === null) return;
    const clickDom = ref.current.querySelector('u');
    if (clickDom) {
      clickDom.addEventListener('click', () => {
        setOpen(true);
      });
    }
  }, []);
  const isSearch = props.onSearch || props.Placeholder !== undefined;
  return (
    <>
      <div
        className={`${isSearch ? ' bg-surface-paper' : 'bg-brand-forest'} px-gutter lg:px-gutter-lg max-w-page  py-16 lg:text-center mx-auto lg:py-25 ${props.className || ''}`}
      >
        <Typography variant="eyebrow" className="font-bold lg:font-normal">
          {categoryData?.group?.title || props?.SubTitle}
        </Typography>
        <Typography role="heading" as="h1" variant="headline-lg" className=" uppercase mt-10">
          {categoryData?.title || props.Title}
        </Typography>
        <Typography variant="subhead-lg" className="mt-5">
          {categoryData?.description || props.Description}
        </Typography>
        {props?.Placeholder && (
          <input
            className="mt-10 w-full bg-surface-paper border border-ink-terra-15 rounded-pill p-5 text-paragraph-sm font-bold [&_placeholder]:text-ink-terra outline-ink-terra lg:w-[46%] "
            type="text"
            placeholder={props.Placeholder}
            aria-label={props.Placeholder}
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
          className={`px-4 py-2 flex-center lg:m-auto gap-2 bg-ink-terra rounded-pill w-max mt-10 lg:mt-15`}
        >
          <IconCheck className="[&_path]:fill-semantic-leaf lg:w-6 lg:h-6" />
          <div ref={ref} className="text-paragraph-regular [&_u]:cursor-pointer text-surface-sand">
            <RichText content={props.Statement} />
          </div>
        </div>
      </div>
      <IngredientsTipsPopup
        open={open}
        onClose={() => setOpen(false)}
        {...(props.Popup as cmsType.component.TipsPopup)}
      />
    </>
  );
}
