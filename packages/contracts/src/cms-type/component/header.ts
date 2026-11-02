import { z } from 'zod';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Header = z.object({
  Title: nullish(z.string()),
  SubTitle: nullish(z.string()),
  Description: nullish(z.string()),
  Image: nullish(Media),
  Background_color: nullish(z.enum(['terra', 'forest'])),
  Add_background_color: nullish(z.boolean().default(false)),
  Position_of_Adding_BgColor: nullish(z.enum(['up', 'down'])),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const HeaderRef = z.object({
  Title: nullish(z.string()),
  SubTitle: nullish(z.string()),
  Description: nullish(z.string()),
  Image: nullish(Media),
  Background_color: nullish(z.enum(['terra', 'forest'])),
  Add_background_color: nullish(z.boolean().default(false)),
  Position_of_Adding_BgColor: nullish(z.enum(['up', 'down'])),
  isFullwidth: nullish(z.boolean().default(false)),
});

export type Header = z.infer<typeof Header>;
