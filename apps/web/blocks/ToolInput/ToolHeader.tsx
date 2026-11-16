import { Typography } from '@/components/Typography';
import { Tool } from './Tool';
import { UIVideo } from '@/components/UIVideo';
import type { BlockProps } from '../types';
import type { cmsType } from '@llf/contracts';
import { BlockTitle } from '@/components/BlockTitle';

export function ToolHeader(props: BlockProps<cmsType.component.ToolInput>) {
  return (
    <>
      <div className="text-surface-sand pt-15 lg:pb-0 bg-[linear-gradient(0deg,#fefaef_0%_47vw,var(--color-brand-forest)_47vw_100%)] lg:bg-[linear-gradient(0deg,#fefaef_0%_54px,var(--color-brand-forest)_54px_100%)]">
        <div className="px-gutter lg:px-gutter-lg lg:max-w-page lg:mx-auto lg:flex lg:gap-33">
          <div className="lg:max-w-1/2">
            <Typography variant="eyebrow" className=" font-bold">
              {props.block.subTitle}
            </Typography>
            <BlockTitle title={props.block.title} moduleIndex={props.index} className="mt-10" />

            <Typography variant="subhead-lg" className="font-bold mt-5">
              {props.block.description}
            </Typography>
            <Tool {...props} className="mt-10" />
          </div>
          <UIVideo
            className="mt-10 lg:mt-0 aspect-363/272 lg:aspect-538/698  rounded-md lg:w-2/5"
            src={props.block.image?.url || ''}
          />
        </div>
      </div>
    </>
  );
}
