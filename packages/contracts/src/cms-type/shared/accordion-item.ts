import { z } from 'zod';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const AccordionItem = z.object({
  __component: z.literal('shared.accordion-item'),
  id: z.number().int(),
  Label: z.string(),
  Description: nullish(z.string()),
});

export const AccordionItemRef = z.object({
  __component: z.literal('shared.accordion-item'),
  id: z.number().int(),
  Label: z.string(),
  Description: nullish(z.string()),
});

export type AccordionItem = z.infer<typeof AccordionItem>;
