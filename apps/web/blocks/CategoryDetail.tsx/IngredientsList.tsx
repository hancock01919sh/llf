'use client';
import { type cmsType, IngredientData, parseResultSlugs } from '@llf/contracts';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Loading } from '../ToolInput/Loading';
import { Typography } from '@/components/Typography';
import { useDevice } from '@/components/hooks/useDevice';
import { EasyImage } from '@/components/UIImage';
import { IconArrow, IconDownload, IconShare, IconUpload, IconWork2 } from '@/components/Icon';
import TransitionLink from '@/components/TransitionLink';
import { TipBadge, TipBadgeColorMapping, type TipBadgeType } from '@/components/TipBadge';
import { IngredientsPopup } from './IngredientsPopup';
import type { CategoryDetailProps } from '.';
import type { SearchDocument } from '@/lib/search';

export function IngredientsList(
  props: (CategoryDetailProps | cmsType.component.Search) & {
    Placeholder?: string | null;
    ingredients?: SearchDocument[];
    bgColor?: 'paper';
  },
) {
  const { ingredients, Button } = props;
  const router = useRouter();
  const slugs = parseResultSlugs(useSearchParams().get('i'));
  const key = slugs.join(',');
  const [state, setState] = useState<{
    status: 'loading' | 'ready';
    ingredients: IngredientData[];
  }>({
    status: 'loading',
    ingredients: [],
  });
  const [activeIndex, setActiveIndex] = useState(-1);
  const { isMobile } = useDevice();
  const isSearch = props?.Placeholder !== undefined;
  useEffect(() => {
    if (!key && !isSearch) {
      router.replace('/find-my-tips');
      return;
    }
    const wanted = key ? key.split(',') : [];
    Promise.all(wanted.map(loadIngredient)).then((loaded) => {
      if (loaded.every((item) => item !== null)) {
        setState({
          status: 'ready',
          ingredients: loaded,
        });
      } else {
        router.back();
        // console.log('no ingredients', loaded);
      }
    });
  }, [key, router, isSearch]);
  const finalIngredients = useMemo(
    () => ingredients || state.ingredients,
    [state.ingredients, ingredients],
  );
  useEffect(() => {
    setActiveIndex(-1);
  }, [finalIngredients]);
  function getLeftListClass(index: number) {
    let classText = `${isSearch ? 'border-ink-terra-15  lg:border-ink-terra-15  hover:bg-semantic-leaf hover:text-surface-sand' : 'border-surface-sand lg:border-semantic-leaf hover:bg-semantic-leaf'} border-t`;
    if (activeIndex === index) {
      classText = ` lg:bg-ink-terra lg:border-ink-terra text-surface-sand`;
    }
    if (index === finalIngredients?.length - 1) {
      classText += ' border-b';
    }
    return classText;
  }
  return (
    <>
      {state.status === 'loading' && !isSearch && <Loading open={state.status === 'loading'} />}
      {state.status === 'ready' && finalIngredients.length > 0 && (
        <div className={`lg:px-gutter-lg pb-gutter-lg`}>
          <Typography variant="paragraph-regular" className="px-5">
            {finalIngredients?.length} ingredients |{' '}
            {finalIngredients?.reduce((acc, cur) => acc + (cur.tips?.length || 0), 0)} tips
          </Typography>
          <div
            className={`flex items-start mt-lg lg:mt-12.5 gap-6 ${state.ingredients[activeIndex]?.tips.length === 0 ? ' items-stretch' : ''}`}
          >
            <div className="flex flex-col w-full lg:w-[29%] lg:max-w-96.25 lg:gap-5">
              {finalIngredients.map((item, index) => (
                <div
                  key={item.title + index}
                  className={`flex-center gap-5 lg:gap-2.5 w-full px-5 py-2.5 lg:px-3  cursor-pointer transition-colors duration-300 lg:border lg:rounded-full ${getLeftListClass(index)}`}
                  role="button"
                  tabIndex={0}
                  aria-pressed={activeIndex === index}
                  onClick={() => {
                    setActiveIndex(index);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setActiveIndex(index);
                    }
                  }}
                >
                  <div className="w-17.5 h-17.5 aspect-square rounded-full bg-ink-terra-40">
                    {item.image?.url && (
                      <EasyImage
                        {...item.image}
                        className="w-17.5 h-17.5 aspect-square rounded-full"
                      />
                    )}
                  </div>

                  <div className="flex-1 flex flex-col lg:flex-row gap-2.5 lg:flex-center lg:justify-between">
                    <Typography
                      role="heading"
                      as="h2"
                      variant="subhead-md"
                      className="font-bold font-fustat!"
                    >
                      {item.title}
                    </Typography>
                    <Typography variant="paragraph-sm" className="lg:text-paragraph-sm">
                      {item?.tips?.length || 0} tips available
                    </Typography>
                  </div>
                  <IconArrow
                    point={'right'}
                    className={`[&_path]:stroke-surface-mint lg:hidden ${isSearch ? '[&_path]:stroke-ink-terra!' : ''}`}
                  />
                </div>
              ))}
              {Button?.Label && (
                <TransitionLink
                  href={Button.href || '#'}
                  className="btn mt-5 mx-5 lg:mx-0 px-0 flex gap-2"
                >
                  {Button.Label}
                  <IconUpload className="w-4 h-4 " />
                </TransitionLink>
              )}
            </div>
            <div
              className={`hidden lg:flex flex-col gap-5  flex-1 ${activeIndex === -1 ? 'border p-5 rounded-md items-center justify-center aspect-square' + (isSearch ? ' border-ink-terra-15 ' : ' border-semantic-leaf') : ''}`}
            >
              {finalIngredients[activeIndex]?.tips?.map((item) => (
                <div
                  key={item.title}
                  className={`border group/item ${isSearch ? 'border-ink-terra-15 text-ink-terra' : 'border-semantic-leaf text-surface-sand'} p-10 rounded-[40px] transition-all duration-500 bg-transparent   hover:text-ink-terra hover:bg-surface-forest-tint hover:border-surface-forest-tint`}
                >
                  <div className="flex flex-col gap-8">
                    <TipBadge type={item.type?.toLowerCase() as TipBadgeType} />
                    <div className="flex-col flex  gap-4">
                      <Typography
                        role="heading"
                        as="h2"
                        variant="title-card"
                        className=" font-anton"
                      >
                        {item.title}
                      </Typography>
                      <Typography variant="paragraph-lg" className="">
                        {item.description}
                      </Typography>
                    </div>
                  </div>
                  <div className="mt-0 opacity-0 overflow-hidden transition-all duration-500 grid grid-rows-[0fr] group-hover/item:grid-rows-[1fr] group-hover/item:opacity-100 group-hover/item:mt-10">
                    <div className="flex gap-3 min-h-0 ">
                      <button className="btn">
                        Share
                        <IconShare className="w-4 h-4" />
                      </button>
                      <button className="btn">
                        Save
                        <IconDownload className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {activeIndex === -1 && (
                <div className="max-w-2/3 flex-center text-center flex-col justify-center aspect-square">
                  <IconWork2 />
                  <Typography variant="subhead-lg" className="mt-9 text-ink-terra-70">
                    Click an ingredient to view specific tips that save time, money, and food.
                  </Typography>
                  <div className="flex-center gap-2 mt-9">
                    {Object.keys(TipBadgeColorMapping).map((type) => (
                      <TipBadge type={type as TipBadgeType} key={type} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <IngredientsPopup
        open={activeIndex !== -1 && isMobile}
        onClose={() => setActiveIndex(-1)}
        ingredient={finalIngredients[activeIndex] as IngredientData}
      />
    </>
  );
}
async function loadIngredient(slug: string): Promise<IngredientData | null> {
  try {
    const response = await fetch(`/data/ingredients/${slug}.json`);
    if (!response.ok) return null;
    return IngredientData.safeParse(await response.json()).data ?? null;
  } catch {
    return null;
  }
}
