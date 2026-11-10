import { IconDownload, IconShare } from '@/components/Icon';
import { TipBadge, type TipBadgeType } from '@/components/TipBadge';
import { Typography } from '@/components/Typography';
import Image from 'next/image';
import type { cmsType } from '@llf/contracts';
import type { BlockProps } from './types';
import type { Media } from '../../../packages/contracts/src/cms-type';
import { UIImage } from '@/components/UIImage';
export function BlockTipBanner(props: BlockProps<cmsType.component.TipBannerDeepRef>) {
  const { tip, label, cta } = props.block;
  return (
    <div className="py-15 lg:py-25">
      <div className="w-full rounded-md  text-ink-terra bg-surface-forest-tint ">
        <Typography
          variant="eyebrow"
          className="lg:text-subhead-md bg-surface-forest-tint  border-2 border-ink-terra py-4 px-13 text-center rounded-md font-bold w-max mx-auto -translate-y-1/2  lg:w-[32%] lg:px-0 capitalize"
          as="div"
        >
          {label || ''}
        </Typography>

        <div className="flex items-center flex-col px-8 pb-14.5 -mt-4 lg:flex-row lg:px-15 lg:justify-end">
          <TipBannerImage className="hidden lg:block" image={tip?.ingredient?.image} />
          <div className="flex items-center flex-col lg:items-start lg:ml-33 lg:gap-sm lg:w-[58%]">
            <TipBadge type={tip?.tip_type?.title as TipBadgeType} />
            <Typography variant="headline-lg" className="mt-2.5 z-1 lg:mt-0">
              {tip?.ingredient?.title || ''}
            </Typography>
            <TipBannerImage className="lg:hidden" image={tip?.ingredient?.image} />
            <Typography
              variant="subhead-md"
              className="font-bold lg:font-normal -mt-10 text-center whitespace-pre-wrap lg:text-left z-1 lg:mt-0 lg:text-subhead-lg  lg:font-anton lg:uppercase"
            >
              {tip?.title || ''}
            </Typography>
            <Typography variant="paragraph-sm" className="mt-2xs text-center lg:mt-0 lg:text-left">
              {tip?.description || ''}
            </Typography>
            {cta && cta.length > 0 && (
              <div className="flex items-stretch justify-between gap-2.5 mt-2.5 w-full lg:mt-0 lg:justify-start">
                {cta.map((item, index) => (
                  <button
                    key={index}
                    className={`btn ${index === 0 ? 'black border-ink-terra [&_path]:fill-surface-paper' : 'white hover:active:text-ink-terra'} border-2 capitalize px-0 flex-1  lg:w-max lg:flex-0 lg:px-10`}
                  >
                    {item.label || ''}
                    {index === 0 ? <IconShare /> : <IconDownload />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
function TipBannerImage({
  className = '',
  image,
}: {
  className?: string;
  image: Media | undefined | null;
}) {
  if (!image) {
    return null;
  }
  return (
    <div
      className={` bg-[#FDE9D0] lg:bg-[#FFF0F0] rounded-full w-62.5 lg:w-[36.7%] lg:min-w-87.5 lg:max-w-95 aspect-square flex items-center justify-center -mt-5 ${className}`}
    >
      <UIImage
        src={image.url}
        alt={image?.alternativeText || image.name || ''}
        loading="eager"
        preload={true}
        width={96}
        height={96}
        className="w-[96%] max-h-[96%] -translate-y-4 relative aspect-square"
      />
    </div>
  );
}
