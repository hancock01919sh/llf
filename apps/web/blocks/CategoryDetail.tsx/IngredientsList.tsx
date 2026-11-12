'use client';
import { IngredientData, parseResultSlugs } from '@llf/contracts';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Typography } from '@/components/Typography';
import { useDevice } from '@/components/hooks/useDevice';
import { IconArrow, IconDownload, IconShare, IconUpload, IconWork2 } from '@/components/Icon';
import TransitionLink from '@/components/TransitionLink';
import { TipBadge, TipBadgeColorMapping, type TipBadgeType } from '@/components/TipBadge';
import { IngredientsPopup } from './IngredientsPopup';
import type { SearchDocument } from '@/lib/search';
import type { CategoryDetailWithSearchProps } from '.';
import { UIImage } from '@/components/UIImage';
import {
  DownloadTemplate,
  type downloadDataTipProps,
  type downloadTemplateDataProps,
} from '@/components/DownloadTemplate';
import { strings } from '@/content/strings';

export function IngredientsList(
  props: CategoryDetailWithSearchProps & {
    ingredients?: SearchDocument[];
    bgColor?: 'paper';
  },
) {
  const { ingredients, button } = props;
  const router = useRouter();
  const isSearch = props?.placeholder !== undefined;
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

  const downloadRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useDevice();

  useEffect(() => {
    if (!key && !ingredients?.length && !isSearch) {
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
  }, [key, router, isSearch, ingredients?.length]);
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
  const [downloadIng, setDownloadIng] = useState<boolean>(false);
  const [downloadTemplateData, setDownloadTemplateData] =
    useState<downloadTemplateDataProps | null>(null);
  useEffect(() => {
    if (!downloadRef.current || !downloadTemplateData) return;
    setDownloadIng(true);
  }, [downloadTemplateData, downloadRef]);
  function downloadTip(tip: downloadDataTipProps) {
    setDownloadTemplateData({
      tip,
      ingredient: {
        image: {
          url: finalIngredients[activeIndex]?.image?.url || '',
          alt: finalIngredients[activeIndex]?.image?.alt || '',
        },
        title: finalIngredients[activeIndex]?.title || '',
      },
    });
    setDownloadIng(true);
  }
  return (
    <>
      {/* {state.status === 'loading' && !isSearch && <Loading open={state.status === 'loading'} />} */}
      {state.status === 'ready' && finalIngredients.length > 0 && (
        <div className={`pb-gutter-lg`}>
          <Typography variant="paragraph-regular" className="px-5">
            {finalIngredients?.length} ingredients |{' '}
            {finalIngredients?.reduce((acc, cur) => acc + (cur.tips?.length || 0), 0)} tips
          </Typography>
          <div
            className={`flex items-start mt-lg lg:mt-12.5 gap-6 ${state.ingredients[activeIndex]?.tips.length === 0 ? ' items-stretch' : ''}`}
          >
            <div className="flex flex-col w-full lg:w-[32.89%] lg:max-w-106.75 lg:gap-5">
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
                      <UIImage
                        src={item.image?.url || ''}
                        alt={item.image.alt || item.title}
                        className="w-17.5 h-17.5 aspect-square rounded-full"
                      />
                    )}
                  </div>

                  <div className="flex-1 flex flex-col lg:flex-row gap-2.5 lg:flex-center lg:justify-between">
                    <Typography as="h2" variant="subhead-md" className="font-bold font-fustat!">
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
              {button?.label && (
                <TransitionLink
                  href={button.href || '#'}
                  className="btn mt-5 mx-5 lg:mx-0 px-0 flex gap-2"
                >
                  {button.label}
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
                  className={`border group/item ${isSearch ? 'border-ink-terra-15 text-ink-terra' : 'border-semantic-leaf text-surface-sand'} p-10 rounded-[40px] transition-all duration-300 bg-transparent hover:text-ink-terra hover:bg-surface-forest-tint hover:border-surface-forest-tint`}
                >
                  <div className="flex flex-col gap-8">
                    <div className="flex-center justify-between">
                      <TipBadge type={item.type?.toLowerCase() as TipBadgeType} />
                      <div className="relative w-16 h-13">
                        <div className=" absolute left-0 group-hover/item:opacity-0 py-4 px-6 transition-opacity duration-300">
                          <IconShare
                            className={` ${!isSearch ? '[&_path]:fill-surface-paper group-hover/item:[&_path]:fill-ink-terra' : ''}`}
                          />
                        </div>

                        <button
                          disabled={downloadIng}
                          className={`absolute left-0 opacity-0 transition-opacity duration-300 group-hover/item:opacity-100 bg-surface-paper rounded-full border border-ink-terra py-4 px-6 disabled:bg-ink-terra-40 disabled:border-ink-terra-40 disabled:[&_path]:fill-surface-paper `}
                          onClick={() => {
                            downloadTip({
                              title: item.title || '',
                              description: item.description || '',
                              type: item.type || '',
                            });
                          }}
                          aria-label={strings.global.download}
                        >
                          <IconDownload />
                        </button>
                      </div>
                    </div>

                    <div className="flex-col flex  gap-4">
                      <Typography variant="title-card" className=" font-anton">
                        {item.title}
                      </Typography>
                      <Typography variant="paragraph-lg" className="">
                        {item.description}
                      </Typography>
                    </div>
                  </div>
                </div>
              ))}
              {activeIndex === -1 && (
                <div className="max-w-2/3 flex-center text-center flex-col justify-center aspect-square">
                  <IconWork2 />
                  <Typography
                    variant="subhead-lg"
                    className={`mt-9 ${isSearch ? 'text-ink-terra-70' : 'text-surface-sand'} `}
                  >
                    {props?.hint}
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
        downloadTip={downloadTip}
      />
      {downloadTemplateData && (
        <DownloadTemplate onComplete={() => setDownloadIng(false)} {...downloadTemplateData} />
      )}
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
