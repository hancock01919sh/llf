import { z } from 'zod';
import { BlockBaseSchema, type BlockProps } from '../types';

const AccordionItemSchema = z.object({
  Label: z.string(),
  Description: z.string().nullable(),
  id: z.number().int(),
});
export type TAccordionItem = z.infer<typeof AccordionItemSchema>;

export const AccordionSchema = BlockBaseSchema.extend({
  __component: z.literal('component.accordion'),
  AccordionItem: z.array(AccordionItemSchema),
  SubTitle: z.string(),
});

export type AccordionProps = z.infer<typeof AccordionSchema>;

export { Accordion } from './Accordion';
export type { BlockProps };
