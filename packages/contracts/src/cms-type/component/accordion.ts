import { z } from 'zod';
import { AccordionItemRef } from '../shared/accordion-item';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Accordion = z.object({
  __component: z.literal('component.accordion'),
  id: z.number().int(),
  Title: z.string(),
  SubTitle: z.string(),
  AccordionItem: z.array(z.lazy(() => AccordionItemRef)),
  Background_color: z.enum(['forest-tint']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const AccordionRef = z.object({
  __component: z.literal('component.accordion'),
  id: z.number().int(),
  Title: z.string(),
  SubTitle: z.string(),
  Background_color: z.enum(['forest-tint']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export type Accordion = z.infer<typeof Accordion>;
