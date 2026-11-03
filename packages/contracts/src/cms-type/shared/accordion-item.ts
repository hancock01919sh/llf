import { z } from 'zod';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const AccordionItem = z.object({
  Label: z.string(),
  Description: nullish(z.string()),
});

export const AccordionItemRef = z.object({
  Label: z.string(),
  Description: nullish(z.string()),
});

export type AccordionItem = z.infer<typeof AccordionItem>;
