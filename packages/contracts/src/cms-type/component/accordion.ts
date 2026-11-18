import { z } from 'zod';
import { AccordionItemRef, AccordionItemDeepRef } from '../shared/accordion-item';
import { TitleRef, TitleDeepRef } from '../shared/title';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Accordion = z.object({
  __component: z.literal('component.accordion'),
  id: z.number().int(),
  subTitle: z.string(),
  accordionItem: z.array(z.lazy(() => AccordionItemRef)),
  backgroundColor: z.enum(['forest-tint']),
  isFullwidth: nullish(z.boolean().default(false)),
  title: z.lazy(() => TitleRef),
  firstItemExpand: z.boolean().default(true),
});

export const AccordionRef = z.object({
  __component: z.literal('component.accordion'),
  id: z.number().int(),
  subTitle: z.string(),
  backgroundColor: z.enum(['forest-tint']),
  isFullwidth: nullish(z.boolean().default(false)),
  firstItemExpand: z.boolean().default(true),
});

export const AccordionDeepRef = z.object({
  __component: z.literal('component.accordion'),
  id: z.number().int(),
  subTitle: z.string(),
  accordionItem: z.array(z.lazy((): z.ZodType<AccordionItemDeepRef> => AccordionItemDeepRef)),
  backgroundColor: z.enum(['forest-tint']),
  isFullwidth: nullish(z.boolean().default(false)),
  title: z.lazy((): z.ZodType<TitleDeepRef> => TitleDeepRef),
  firstItemExpand: z.boolean().default(true),
});

export type AccordionDeepRef = z.infer<typeof AccordionDeepRef>;

export type Accordion = z.infer<typeof Accordion>;

export type AccordionRef = z.infer<typeof AccordionRef>;
