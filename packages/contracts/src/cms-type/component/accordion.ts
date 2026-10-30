import { z } from 'zod';
import { AccordionItem } from '../shared/accordion-item';

export const Accordion = z.object({
  Title: z.string().optional(),
  SubTitle: z.string().optional(),
  AccordionItem: z
    .lazy((): z.ZodType => AccordionItem)
    .array()
    .optional(),
  Background_color: z.enum(['forest-tint']).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export type Accordion = z.infer<typeof Accordion>;
