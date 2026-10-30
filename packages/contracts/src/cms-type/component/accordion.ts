import { z } from 'zod';
import { AccordionItemRef } from '../shared/accordion-item';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Accordion = z.object({
  Title: nullish(z.string()),
  SubTitle: nullish(z.string()),
  AccordionItem: AccordionItemRef.array().optional(),
  Background_color: z.enum(['forest-tint']).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export const AccordionRef = z.object({
  Title: nullish(z.string()),
  SubTitle: nullish(z.string()),
  Background_color: z.enum(['forest-tint']).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export type Accordion = z.infer<typeof Accordion>;
