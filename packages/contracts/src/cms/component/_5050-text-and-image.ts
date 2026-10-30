import { z } from 'zod';
import { MediaSchema } from '../media';

export const _5050TextAndImageSchema = z.object({
  Title: z.string().optional(),
  Description: z.string().optional(),
  Image: MediaSchema.optional(),
  Make_Image_left: z.boolean().optional(),
  Add_Background_Color: z.boolean().default(false).optional(),
  Position_of_Adding_BgColor: z.enum(["Up ","Down"]).optional(),
  isFullwidth: z.boolean().default(false).optional(),
  Background_color: z.enum(["paper"]).optional(),
});

export type _5050TextAndImage = z.infer<typeof _5050TextAndImageSchema>;
