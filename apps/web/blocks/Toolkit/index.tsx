import type { cmsType } from '@llf/contracts';
import type { BlockProps } from '../types';

export function BlockToolkit({ block }: BlockProps<cmsType.component.ToolkitDeepRef>) {
  console.log('BlockToolkit:', block);
  return <>Toolkit</>;
}
