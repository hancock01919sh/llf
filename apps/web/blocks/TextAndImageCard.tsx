import { Typography } from '@/components/Typography';
import { UIImage } from '@/components/UIImage';
import type { cmsType } from '@llf/contracts';
import type { BlockProps } from './types';
import { BlockTitle } from '@/components/BlockTitle';
export function BlockTextAndImageCard(
  props: BlockProps<cmsType.component.TextAndImageCardDeepRef>,
) {
  const { title, description, image } = props.block;
  return (
    <div className="flex items-center flex-col py-15 lg:py-25">
      <div className="lg:w-2/3 text-center">
        {/* <Typography variant="headline-lg" className="uppercase ">
          {title}
        </Typography> */}
        <BlockTitle title={title!} moduleIndex={props.index} />
        <Typography variant="paragraph-lg" className="mt-5">
          {description}
        </Typography>
      </div>

      <div className="mt-10 w-full flex flex-col gap-5 lg:flex-row lg:gap-lg">
        {image?.map((image, index) => (
          <UIImage
            className="aspect-370/200 lg:aspect-420/277  w-full rounded-md overflow-hidden"
            key={index}
            {...image}
          />
        ))}
      </div>
    </div>
  );
}
