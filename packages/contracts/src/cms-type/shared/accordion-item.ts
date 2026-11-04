import { z } from 'zod';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const AccordionItem = z.object({
  label: z.string(),
  description: nullish(z.string()),
});

export const AccordionItemRef = z.object({
  label: z.string(),
  description: nullish(z.string()),
});

export type AccordionItem = z.infer<typeof AccordionItem>;
