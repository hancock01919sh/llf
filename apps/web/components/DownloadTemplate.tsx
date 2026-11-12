import { UIImage } from './UIImage';
import { TipBadge, type TipBadgeType } from './TipBadge';
import { useEffect, useRef, useState } from 'react';
export interface downloadDataTipProps {
  title: string;
  description: string;
  type: string;
}
export interface downloadTemplateDataProps {
  tip?: downloadDataTipProps;
  ingredient?: {
    image: {
      url: string;
      alt: string;
    };
    title: string;
  };
}
export interface DownloadTemplateProps extends downloadTemplateDataProps {
  onComplete: (success: boolean) => void;
}
export function DownloadTemplate(props: DownloadTemplateProps) {
  const { tip, ingredient, onComplete } = props;
  const [node, setNode] = useState<HTMLElement | null>(null);
  const hasRun = useRef(false);
  useEffect(() => {
    if (!node || !tip || !ingredient) return;
    if (hasRun.current) return;
    hasRun.current = true;
    import('html-to-image')
      .then((mod) => mod.toJpeg)
      .then((html2img) => {
        if (!node) return;
        html2img(node, {
          quality: 0.8,
        })
          .then((res: string) => {
            const link = document.createElement('a');
            const filename = ingredient.title;
            const littleTipName = tip.title.split(' ').slice(0, 2);
            link.download = `${filename}-${littleTipName.join(' ')}.jpeg`;
            link.href = res;
            link.click();
            setTimeout(() => {
              onComplete(true);
            }, 1000);
            // 清理引用
            link.remove();
          })
          .catch(() => {
            onComplete(false);
          });
      });
    return () => {
      setNode(null);
    };
  }, [node, tip, ingredient, onComplete]);
  if (!tip || !ingredient) return null;
  return (
    <div ref={setNode} className="w-full max-w-100.5 fixed top-0 left-0 -z-100">
      <div className="w-full relative">
        <UIImage
          className=" aspect-402/269 w-full"
          src={ingredient.image.url || ''}
          alt={ingredient.image.alt || ingredient.title || ''}
        />
        <div className="bg-[rgba(0,0,0,0.2)] absolute left-0 top-0 w-full h-full text-surface-sand flex-center justify-center">
          <h3 className="text-mob-headline-lg uppercase font-anton font-bold">
            {ingredient.title || ''}
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
