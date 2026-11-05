'use client';
import { Popup } from '@/components/Popup';
import { Header } from '@/components/Header';
import { IconArrow } from '@/components/Icon';
import { Typography } from '@/components/Typography';
import { TipBadge, type TipBadgeType } from '@/components/TipBadge';
import { AppFooter } from '@/components/AppFooter';
import { EasyImage } from '@/components/UIImage';
import { useContext } from 'react';
import { AppContext } from '@/components/Provider';
import type { IngredientData } from '@llf/contracts';

export function IngredientsPopup({
  open,
  onClose,
  ingredient,
}: {
  open: boolean;
  onClose: () => void;
  ingredient: IngredientData;
}) {
  const { footer, navigation } = useContext(AppContext);
  if (!footer || !navigation || !ingredient) return null;
  return (
    <>
      <Popup open={open} onClose={onClose}>
        <Header inPopup={true} className="bg-brand-forest!" />
        <div className="bg-brand-forest ">
          <div
            className="flex-center px-4 py-8 gap-4"
            role="button"
            tabIndex={0}
            onClick={onClose}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClose();
              }
            }}
          >
            <IconArrow point="left" className="[&_path]:stroke-surface-mint" />
            <Typography variant="link" className="font-bold text-surface-mint">
              Back to Ingredient List
            </Typography>
          </div>
          <div className="relative aspect-402/269 ">
            <EasyImage {...(ingredient?.image ?? { url: '', alt: '' })} className="w-full h-full" />
            <div className="absolute left-0 top-0 w-full h-full flex-center flex-col justify-center text-surface-sand bg-[rgba(0,0,0,0.2)]">
              <Typography variant="headline-xl" className=" uppercase">
                {ingredient?.title}
              </Typography>
              <Typography variant="subhead-lg" className="mt-4">
                {`${ingredient?.tips?.length ?? 0} tips available`}
              </Typography>
            </div>
          </div>
          <div className="flex flex-col text-surface-sand">
            {ingredient?.tips?.map((tip) => {
              return (
                <div key={tip.title} className="py-10 px-4 border-b border-b-semantic-leaf">
                  <TipBadge type={tip.type?.toLowerCase() as TipBadgeType} />
                  <Typography variant="title-card" className="mt-8 font-anton">
                    {tip.title}
                  </Typography>
                  <Typography variant="paragraph-lg" className="mt-4">
                    {tip.description}
                  </Typography>
                </div>
              );
            })}
          </div>
        </div>
        <AppFooter inPopup={true} className="bg-surface-paper" />
      </Popup>
    </>
  );
}
