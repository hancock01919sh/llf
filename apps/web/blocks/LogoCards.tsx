import { Typography } from '@/components/Typography';
import type { BlockProps } from './types';
import type { cmsType } from '@llf/contracts';
import { UIImage } from '@/components/UIImage';
import { BlockTitle } from '@/components/BlockTitle';
export function BlockLogoCards(props: BlockProps<cmsType.component.LogoCardsDeepRef>) {
  const { imageDesktop, imageMobile, title, description } = props.block;
  return (
    <div className="flex items-center flex-col py-15 lg:py-25">
      <div className="text-center lg:w-2/3 mx-auto">
        {/* <Typography variant="headline-lg" className="uppercase ">
          {title}
        </Typography> */}
        <BlockTitle title={title!} moduleIndex={props.index} />
        <Typography variant="paragraph-lg" className="mt-5 ">
          {description}
        </Typography>
      </div>
      <div className="mt-10 w-full flex flex-col gap-5.5 items-center lg:flex-row lg:justify-center">
        {imageMobile?.map((item) => (
          <div
            key={item.url + item.documentId}
            className="aspect-370/200 w-full bg-surface-sand rounded-md overflow-hidden flex items-center justify-center  lg:hidden"
          >
            <UIImage className="w-full h-full object-cover " {...item} />
          </div>
        ))}
        {imageDesktop?.map((item) => (
          <div
            key={item.url + item.documentId}
            className="hidden w-full rounded-md lg:flex-center overflow-hidden justify-center lg:aspect-square lg:w-1/3 lg:max-w-78.25"
          >
            <UIImage className="w-full h-full object-cover" {...item} />
          </div>
        ))}
      </div>
    </div>
  );
}
