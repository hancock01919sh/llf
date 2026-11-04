import { type BlockProps } from '../types';
import { ToolHeader } from './ToolHeader';
import { ToolBody } from './ToolBody';
import { cmsType } from '@llf/contracts';
export function BlockToolInput(props: BlockProps<cmsType.component.ToolInput>) {
  return (
    <>
      <ToolHeader {...props} />
      <ToolBody {...props} />
    </>
  );
}
