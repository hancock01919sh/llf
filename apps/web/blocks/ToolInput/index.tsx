import { type BlockProps } from '../types';
import { ToolHeader } from './ToolHeader';
import { ToolBody } from './ToolBody';
import type { cmsType } from '@llf/contracts';
export function BlockToolInput(props: BlockProps<cmsType.component.ToolInputDeepRef>) {
  return (
    <>
      <ToolHeader {...props} />
      <ToolBody {...props} />
    </>
  );
}
