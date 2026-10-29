import type { ToolInputProps } from '.';
import { Typography } from '@/components/Typography';
import { Tool } from './Tool';
import { UIVideo } from '@/components/UIVideo';
import type { BlockProps } from '../types';

export function ToolHeader(props: BlockProps<ToolInputProps>) {
  return (
    <>
      <div
        data-surface="forest"
        className="pt-15 lg:pb-0 bg-[linear-gradient(0deg,#fefaef_0%_47vw,var(--color-brand-forest)_47vw_100%)] lg:bg-[linear-gradient(0deg,#fefaef_0%_54px,var(--color-brand-forest)_54px_100%)]"
        // style={{
        //   backgroundImage: `${'linear-gradient(0deg, #fefaef 0% ' + getNextBgRatio() + ', var(--color-brand-forest) ' + getNextBgRatio() + ' 100%)'}`,
        //   boxShadow: `0 1px 1px #fefaef`,
        // }}
      >
        <div className="px-gutter lg:px-gutter-lg lg:max-w-page lg:mx-auto lg:flex lg:gap-33">
          <div className="lg:max-w-1/2">
            <Typography variant="eyebrow" className=" font-bold">
              {props.block.SubTitle}
            </Typography>
            <Typography variant="headline-lg" className="uppercase mt-10 " as="h1">
              {props.block.Title}
            </Typography>
            <Typography variant="subhead-lg" className="font-bold mt-5">
              {props.block.Description}
            </Typography>
            <Tool {...props} className="mt-10" />
          </div>
          <UIVideo
            className="mt-10 lg:mt-0 aspect-363/272 lg:aspect-538/698  rounded-md lg:w-2/5"
            src={props.block.Image.url || ''}
          />
        </div>
      </div>
    </>
  );
}
