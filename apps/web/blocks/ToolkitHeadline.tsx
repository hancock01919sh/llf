import type { cmsType } from '@llf/contracts';
import type { BlockProps } from './types';
import { Typography } from '@/components/Typography';
import { IconDownload } from '@/components/Icon';
import { BlockTitle } from '@/components/BlockTitle';

export function BlockToolkitHeadline(props: BlockProps<cmsType.component.ToolkitHeadlineDeepRef>) {
  const { title, description, cta, file } = props.block;
  return (
    <div className="py-15 lg:py-25 text-center">
      {title && <BlockTitle title={title} moduleIndex={props.index} />}
      <Typography variant="subhead-lg" className="mt-5 font-bold">
        {description}
      </Typography>
      {file?.url && (
        <a
          href={file.url}
          download={file.name}
          className="btn mt-10 w-auto mx-auto lg:w-max lg:mx-auto"
        >
          {cta?.label} <IconDownload />
        </a>
      )}
    </div>
  );
}
