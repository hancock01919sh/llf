import { IconDownload } from '@/components/Icon';
import { Typography } from '@/components/Typography';
import { UIImage } from '@/components/UIImage';
import type { cmsType } from '@llf/contracts';

export function AssecItem(item: cmsType.shared.AssetsCardsDeepRef & { className?: string }) {
  return (
    <div className={` rounded-md overflow-hidden flex flex-col  ${item.className}`}>
      <UIImage
        className={item.displayMode}
        src={item.image?.url || ''}
        alt={item.image?.name || item.title}
      />
      <div className="p-8 bg-surface-paper">
        <Typography variant="subhead-md" className=" text-lg-subheadline-md ! font-bold">
          {item.title}
        </Typography>
        <Typography variant="paragraph-regular" className="mt-2">
          {item.description}
        </Typography>
        <Typography variant="caption" className="mt-5">
          File Name:{item.file?.name || ''}
        </Typography>
        <Typography variant="caption" className="mt-2">
          File Type:{item.file?.mime || ''}
        </Typography>
        <a href={item.file?.url} download={item.file?.name} className="btn black mt-5 inline-flex">
          Download
          <IconDownload className="w-4 h-4 [&_path]:fill-surface-paper" />
        </a>
      </div>
    </div>
  );
}
