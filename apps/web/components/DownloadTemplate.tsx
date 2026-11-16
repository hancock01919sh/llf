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
  type?: 'share' | 'download';
}
export interface DownloadTemplateProps extends downloadTemplateDataProps {
  onComplete: (success: boolean) => void;
}
export function DownloadTemplate(props: DownloadTemplateProps) {
  const { type, tip, ingredient, onComplete } = props;
  const [node, setNode] = useState<HTMLElement | null>(null);
  const hasRun = useRef(false);
  useEffect(() => {
    if (!node || !tip || !ingredient) return;
    if (hasRun.current) return;
    hasRun.current = true;
    const downLoadImage = (img: string, downloadName: string) => {
      const link = document.createElement('a');
      link.download = downloadName;
      link.href = img;
      link.click();
      setTimeout(() => {
        onComplete(true);
      }, 1000);
      // 清理引用
      link.remove();
    };
    const shareImage = async (img: string, fileName: string) => {
      const blob = await (await fetch(img)).blob();
      const file = new File([blob], fileName, { type: blob.type });

      const shareData = {
        title: `share` + fileName,
        files: [file],
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
          onComplete(true);
        } catch {
          onComplete(false);
        }
      } else {
        // 降级方案：提供下载链接
        const url = `${window.location.origin}/search/#q=${encodeURIComponent(ingredient?.title || '')}`;
        await navigator.clipboard.writeText(url);
        onComplete(true);
      }
    };
    import('html-to-image')
      .then((mod) => mod.toJpeg)
      .then((html2img) => {
        if (!node) return;
        html2img(node, {
          quality: 1,
        })
          .then((res: string) => {
            const filename = ingredient.title;
            const littleTipName = tip.title.split(' ').slice(0, 2);
            const downloadName = `${filename}-${littleTipName.join(' ')}.jpeg`;
            if (type === 'share') {
              shareImage(res, downloadName);
            } else {
              downLoadImage(res, downloadName);
            }
          })
          .catch((_) => {
            onComplete(false);
          });
      });
    return () => {
      setNode(null);
    };
  }, [node, tip, ingredient, onComplete, type]);

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
