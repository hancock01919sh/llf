import { z } from 'zod';
import { AccordionItemRef } from '../shared/accordion-item';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Accordion = z.object({
  Title: nullish(z.string()),
  SubTitle: nullish(z.string()),
  AccordionItem: nullish(z.array(z.lazy(() => AccordionItemRef))),
  Background_color: nullish(z.enum(['forest-tint'])),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const AccordionRef = z.object({
  Title: nullish(z.string()),
  SubTitle: nullish(z.string()),
  Background_color: nullish(z.enum(['forest-tint'])),
  isFullwidth: nullish(z.boolean().default(false)),
});

export type Accordion = z.infer<typeof Accordion>;
