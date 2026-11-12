import { UIImage } from './UIImage';
import { TipBadge, type TipBadgeType } from './TipBadge';
import type { Ref } from 'react';
export interface downloadTipProps {
  title: string;
  description: string;
  type: string;
}
export interface DownloadTemplateProps {
  ref?: Ref<HTMLDivElement>;
  tip: downloadTipProps;
  ingredient: {
    image: {
      url: string;
      alt: string;
    };
    title: string;
  };
}
export function DownloadTemplate(props: DownloadTemplateProps) {
  const { tip, ingredient } = props;
  return (
    <div className="w-full max-w-100.5 fixed top-0 left-0 -z-100" ref={props.ref}>
      <div className=" relative">
        <UIImage
          className="aspect-402/269 w-full"
          src={ingredient.image.url}
          alt={ingredient.image.alt || ingredient.title}
        />
        <div className="bg-[rgba(0,0,0,0.2)] absolute left-0 top-0 w-full h-full text-surface-sand flex-center justify-center">
          <h3 className="text-mob-headline-lg uppercase font-anton font-bold">
            {ingredient.title}
          </h3>
        </div>
      </div>
      <div className="bg-brand-forest text-surface-sand py-10 px-4">
        <TipBadge type={tip.type.toLowerCase() as TipBadgeType} className="pb-2!" />
        <p className="mt-8 font-anton text-mob-title-card">{tip.title || ''}</p>
        <p className="mt-4 font-fustat text-mob-paragraph-lg">{tip.description || ''}</p>
      </div>
    </div>
  );
}
