import { z } from 'zod';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Header = z.object({
  Title: nullish(z.string()),
  SubTitle: nullish(z.string()),
  Description: nullish(z.string()),
  Image: nullish(Media),
  Background_color: z.enum(['terra', 'forest']).optional(),
  Add_background_color: z.boolean().default(false).optional(),
  Position_of_Adding_BgColor: z.enum(['up', 'down']).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export const HeaderRef = z.object({
  Title: nullish(z.string()),
  SubTitle: nullish(z.string()),
  Description: nullish(z.string()),
  Image: nullish(Media),
  Background_color: z.enum(['terra', 'forest']).optional(),
  Add_background_color: z.boolean().default(false).optional(),
  Position_of_Adding_BgColor: z.enum(['up', 'down']).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export type Header = z.infer<typeof Header>;
