import { z } from 'zod';
import { MediaSchema } from '../media';

export const HeaderSchema = z.object({
  Title: z.string().optional(),
  SubTitle: z.string().optional(),
  Description: z.string().optional(),
  Image: MediaSchema.optional(),
  Background_color: z.enum(['terra', 'forest']).optional(),
  Add_background_color: z.boolean().default(false).optional(),
  Position_of_Adding_BgColor: z.enum(['up', 'down']).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export type Header = z.infer<typeof HeaderSchema>;
