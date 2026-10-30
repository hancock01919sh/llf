import { z } from 'zod';
import { AccordionItemSchema } from '../shared/accordion-item';

export const AccordionSchema = z.object({
  Title: z.string().optional(),
  SubTitle: z.string().optional(),
  AccordionItem: z
    .lazy((): z.ZodType => AccordionItemSchema)
    .array()
    .optional(),
  Background_color: z.enum(['forest-tint']).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export type Accordion = z.infer<typeof AccordionSchema>;
