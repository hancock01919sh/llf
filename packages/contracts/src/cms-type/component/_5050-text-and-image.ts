import { z } from 'zod';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const _5050TextAndImage = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Image: nullish(Media),
  Make_Image_left: nullish(z.boolean()),
  Add_Background_Color: nullish(z.boolean().default(false)),
  Position_of_Adding_BgColor: nullish(z.enum(['Up ', 'Down'])),
  isFullwidth: nullish(z.boolean().default(false)),
  Background_color: nullish(z.enum(['paper'])),
});

export const _5050TextAndImageRef = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Image: nullish(Media),
  Make_Image_left: nullish(z.boolean()),
  Add_Background_Color: nullish(z.boolean().default(false)),
  Position_of_Adding_BgColor: nullish(z.enum(['Up ', 'Down'])),
  isFullwidth: nullish(z.boolean().default(false)),
  Background_color: nullish(z.enum(['paper'])),
});

export type _5050TextAndImage = z.infer<typeof _5050TextAndImage>;
