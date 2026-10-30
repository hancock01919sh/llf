import { z } from 'zod';

export const AccordionItem = z.object({
  Label: z.string().optional(),
  Description: z.string().optional(),
});

export type AccordionItem = z.infer<typeof AccordionItem>;
