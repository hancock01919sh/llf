import { z } from 'zod';
import { Media } from '@llf/contracts/cms';
import { LinkSchema, type BlockBaseProps, type BlockProps } from '../types';
import { ToolHeader } from './ToolHeader';
import { ToolBody } from './ToolBody';
const CardSchema = z.object({
  Title: z.string(),
  Description: z.string(),
  Link: LinkSchema.nullable(),
});

export const ToolInputSchema = z.object({
  id: z.number().int(),
  __component: z.literal('component.tool-input'),
  Title: z.string(),
  Description: z.string(),
  CategorySlug: z.string().optional(),
  Button: z.array(LinkSchema),
  CardDescription: z.string(),
  CardTitle: z.string(),
  Cards: z.array(CardSchema),
  Copy: z.string(),
  Image: Media,
  Placeholder: z.string(),
  SubTitle: z.string(),
}) satisfies z.ZodType<BlockBaseProps & { [k: string]: unknown }>;

export type ToolInputProps = z.infer<typeof ToolInputSchema>;
export function ToolInput(props: BlockProps<ToolInputProps>) {
  return (
    <>
      <ToolHeader {...props} />
      <ToolBody {...props} />
    </>
  );
}
