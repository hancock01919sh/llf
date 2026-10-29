import { z } from 'zod';
import { Media } from '@llf/contracts/cms';
import { BlockBaseSchema, LinkSchema, type BlockProps } from '../types';
import { ToolHeader } from './ToolHeader';
import { ToolBody } from './ToolBody';
const CardSchema = z.object({
  Title: z.string(),
  Description: z.string(),
  Link: LinkSchema.nullable(),
});

export const ToolInputSchema = BlockBaseSchema.extend({
  __component: z.literal('component.tool-input'),
  Button: z.array(LinkSchema),
  CardDescription: z.string(),
  CardTitle: z.string(),
  Cards: z.array(CardSchema),
  Copy: z.string(),
  Image: Media,
  Placeholder: z.string(),
  SubTitle: z.string(),
});

export type ToolInputProps = z.infer<typeof ToolInputSchema>;
export function ToolInput(props: BlockProps<ToolInputProps>) {
  return (
    <>
      <ToolHeader {...props} />
      <ToolBody {...props} />
    </>
  );
}
