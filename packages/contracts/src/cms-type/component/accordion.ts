import { z } from 'zod';
import { AccordionItemRef, AccordionItemDeepRef } from '../shared/accordion-item';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Accordion = z.object({
  __component: z.literal('component.accordion'),
  id: z.number().int(),
  title: z.string(),
  subTitle: z.string(),
  accordionItem: z.array(z.lazy(() => AccordionItemRef)),
  backgroundColor: z.enum(['forest-tint']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const AccordionRef = z.object({
  __component: z.literal('component.accordion'),
  id: z.number().int(),
  title: z.string(),
  subTitle: z.string(),
  backgroundColor: z.enum(['forest-tint']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const AccordionDeepRef = z.object({
  __component: z.literal('component.accordion'),
  id: z.number().int(),
  title: z.string(),
  subTitle: z.string(),
  accordionItem: z.array(z.lazy((): z.ZodType<AccordionItemDeepRef> => AccordionItemDeepRef)),
  backgroundColor: z.enum(['forest-tint']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export type AccordionDeepRef = z.infer<typeof AccordionDeepRef>;

export type Accordion = z.infer<typeof Accordion>;

export type AccordionRef = z.infer<typeof AccordionRef>;
