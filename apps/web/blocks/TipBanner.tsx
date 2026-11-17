'use client';
import { IconDownload, IconShare } from '@/components/Icon';
import { TipBadge, type TipBadgeType } from '@/components/TipBadge';
import { Typography } from '@/components/Typography';
import type { cmsType } from '@llf/contracts';
import type { BlockProps } from './types';
import { UIImage } from '@/components/UIImage';
import { strings } from '@/content/strings';
import { DownloadTemplate, type downloadTemplateDataProps } from '@/components/DownloadTemplate';
import { useState } from 'react';
export function BlockTipBanner(props: BlockProps<cmsType.component.TipBannerDeepRef>) {
  const { tip, label, interiorBackgroundColor } = props.block;
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadTemplateData, setDownloadTemplateData] =
    useState<downloadTemplateDataProps | null>(null);
  return (
    <div className="py-15 lg:py-25">
      <div data-surface={interiorBackgroundColor} className="w-full rounded-md  text-ink-terra ">
        <div
          data-surface={interiorBackgroundColor}
          className=" py-4 px-13  lg:text-subhead-md border-2 border-ink-terratext-center rounded-md font-bold w-max mx-auto -translate-y-1/2  lg:w-[32%] lg:px-0 capitalize"
        >
          <Typography variant="eyebrow" className="" as="div">
            {label}
          </Typography>
        </div>

        <div className="flex items-center flex-col px-8 pb-14.5 -mt-4 lg:flex-row lg:px-15 lg:justify-end">
          <TipBannerImage className="hidden lg:block" image={tip?.ingredient?.image} />
          <div className="mt-5 flex items-center flex-col lg:items-start lg:ml-33 lg:gap-sm lg:w-[58%] lg:mt-0">
            <TipBadge type={tip?.tip_type?.title?.toLowerCase() as TipBadgeType} />
            <Typography variant="headline-lg" className="mt-6 z-1 lg:mt-0">
              {tip?.ingredient?.title || ''}
            </Typography>
            <TipBannerImage className="my-3 lg:hidden" image={tip?.ingredient?.image} />
            <Typography
              variant="subhead-md"
              className="font-bold lg:font-normal text-center whitespace-pre-wrap lg:text-left z-1 lg:text-subhead-lg  lg:font-anton lg:uppercase"
            >
              {tip?.title || ''}
            </Typography>
            <Typography variant="paragraph-sm" className="mt-4 text-center lg:mt-0 lg:text-left">
              {tip?.description || ''}
            </Typography>
            <div className="flex flex-col lg:flex-row items-stretch justify-between gap-2.5 mt-10 w-full lg:mt-0 lg:justify-start">
              <button
                disabled={isDownloading}
                className="btn black border-ink-terra [&_path]:fill-surface-paper capitalize px-0  lg:w-max lg:flex-0 lg:px-10 focus-visible:bg-surface-paper!"
                onClick={() => {
                  // void shareTip(tip?.ingredient?.title);
                  setIsDownloading(true);
                  setDownloadTemplateData({
                    type: 'share',
                    tip: {
                      title: tip?.title || '',
                      description: tip?.description || '',
                      type: tip?.tip_type?.title?.toLowerCase() || '',
                    },
                    ingredient: {
                      image: {
                        url: tip?.ingredient?.image?.url || '',
                        alt:
                          tip?.ingredient?.image?.alternativeText ||
                          tip?.ingredient?.image?.name ||
                          '',
                      },
                      title: tip?.ingredient?.title || '',
                    },
                  });
                }}
              >
                {strings.tipBanner.share}{' '}
                <IconShare className={`${isDownloading ? '[&_path]:fill-ink-terra-40!' : ''}`} />
              </button>
              <button
                disabled={isDownloading}
                className="btn white hover:active:text-ink-terra border capitalize px-0  lg:w-max lg:flex-0 lg:px-10"
                onClick={() => {
                  setIsDownloading(true);
                  setDownloadTemplateData({
                    type: 'download',
                    tip: {
                      title: tip?.title || '',
                      description: tip?.description || '',
                      type: tip?.tip_type?.title?.toLowerCase() || '',
                    },
                    ingredient: {
                      image: {
                        url: tip?.ingredient?.image?.url || '',
                        alt:
                          tip?.ingredient?.image?.alternativeText ||
                          tip?.ingredient?.image?.name ||
                          '',
                      },
                      title: tip?.ingredient?.title || '',
                    },
                  });
                }}
              >
                {strings.tipBanner.save}
                <IconDownload className={`${isDownloading ? '[&_path]:fill-ink-terra-40' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
      <DownloadTemplate
        {...downloadTemplateData}
        onComplete={() => {
          setIsDownloading(false);
          setDownloadTemplateData(null);
        }}
      />
    </div>
  );
}

function TipBannerImage({
  className = '',
  image,
}: {
  className?: string;
  image: cmsType.Media | undefined | null;
}) {
  if (!image) {
    return null;
  }
  return (
    <div
      className={` bg-[#FDE9D0] lg:bg-[#FFF0F0] rounded-full w-62.5 lg:w-[36.7%] lg:min-w-87.5 lg:max-w-95 aspect-square flex items-center justify-center overflow-hidden ${className}`}
    >
      <UIImage
        src={image.url}
        alt={image?.alternativeText || image.name || ''}
        loading="eager"
        preload={true}
        width={96}
        height={96}
        className="aspect-square"
      />
    </div>
  );
}
