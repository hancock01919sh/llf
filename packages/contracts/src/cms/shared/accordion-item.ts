import { z } from 'zod';

export const AccordionItemSchema = z.object({
  Label: z.string().optional(),
  Description: z.string().optional(),
});

export type AccordionItem = z.infer<typeof AccordionItemSchema>;
