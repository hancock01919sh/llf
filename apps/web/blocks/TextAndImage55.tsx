import { Typography } from '@/components/Typography';
import { UIImage } from '@/components/UIImage';
import type { cmsType } from '@llf/contracts';
import type { BlockProps } from './types';
import { BlockTitle } from '@/components/BlockTitle';
export function BlockTextAndImage55(props: BlockProps<cmsType.component._5050TextAndImageDeepRef>) {
  const { title, description, image } = props.block;
  return (
    <div className="py-15">
      <div className="flex flex-col gap-15 lg:flex-row lg:gap-18.25 items-center ">
        <div className="flex flex-col gap-5 lg:w-1/2 lg:order-2 text-center lg:text-left">
          <BlockTitle title={title} moduleIndex={props.index} />
          <Typography variant="paragraph-lg">{description}</Typography>
        </div>
        <UIImage
          {...image}
          className="w-full rounded-md overflow-hidden aspect-362/244 lg:w-1/2 lg:aspect-650/428 lg:order-1"
        />
      </div>
    </div>
  );
}
