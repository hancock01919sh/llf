'use client';
import { Popup } from '@/components/Popup';
import { Header } from '@/components/Header';
import { IconArrow, IconDownload, IconShare } from '@/components/Icon';
import { Typography } from '@/components/Typography';
import { TipBadge, type TipBadgeType } from '@/components/TipBadge';
import { AppFooter } from '@/components/AppFooter';
import { useContext } from 'react';
import { AppContext } from '@/components/Provider';
import type { IngredientData } from '@llf/contracts';
import { UIImage } from '@/components/UIImage';
import { strings } from '@/content/strings';
import type { downloadDataTipProps } from '@/components/DownloadTemplate';

export function IngredientsPopup({
  open,
  onClose,
  ingredient,
  downloadTip,
  downloadIng,
  shareTip,
}: {
  open: boolean;
  onClose: () => void;
  ingredient: IngredientData;
  downloadTip: (tip: downloadDataTipProps) => void;
  downloadIng: boolean;
  shareTip: (tip: downloadDataTipProps) => void;
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
              {strings.categoryDetail.backToIngredients}
            </Typography>
          </div>
          <div className="relative aspect-402/269 ">
            <UIImage
              src={ingredient?.image?.url || ''}
              alt={ingredient?.image?.alt || ingredient?.title || ''}
              className="w-full h-full"
            />
            <div className="absolute left-0 top-0 w-full h-full flex-center flex-col justify-center text-surface-sand bg-[rgba(0,0,0,0.2)]">
              <Typography variant="headline-xl" className=" uppercase">
                {ingredient?.title}
              </Typography>
              <Typography variant="subhead-lg" className="mt-4">
                {`${ingredient?.tips?.length ?? 0} ${strings.categoryDetail.tipsAvailable}`}
              </Typography>
            </div>
          </div>
          <div className="flex flex-col text-surface-sand">
            {ingredient?.tips?.map((tip) => {
              return (
                <div key={tip.title} className="py-10 px-4 border-b border-b-semantic-leaf">
                  <div className="flex-center justify-between">
                    <TipBadge type={tip.type?.toLowerCase() as TipBadgeType} />
                    <div className="flex-center">
                      <button
                        disabled={downloadIng}
                        className="w-11 h-11 flex-center justify-center"
                        aria-label={'download tips'}
                        onClick={() => {
                          shareTip({
                            title: tip.title,
                            description: tip.description || '',
                            type: tip.type || '',
                          });
                        }}
                      >
                        <IconShare
                          className={`${downloadIng ? '[&_path]:fill-ink-terra-40' : '[&_path]:fill-surface-mint-dark'}`}
                        />
                      </button>
                      <button
                        disabled={downloadIng}
                        className="w-11 h-11 flex-center justify-center"
                        aria-label={'download tips'}
                        onClick={() => {
                          downloadTip({
                            title: tip.title,
                            description: tip.description || '',
                            type: tip.type || '',
                          });
                        }}
                      >
                        <IconDownload
                          className={`${downloadIng ? '[&_path]:fill-ink-terra-40' : '[&_path]:fill-surface-mint-dark'}`}
                        />
                      </button>
                    </div>
                  </div>

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
