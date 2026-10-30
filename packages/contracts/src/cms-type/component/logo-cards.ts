import { z } from 'zod';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const LogoCards = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Image_Desktop: nullish(Media.array()),
  Background_color: z.enum(['paper', 'forest']).optional(),
  Image_Mobile: nullish(Media.array()),
  isFullwidth: z.boolean().default(false).optional(),
});

export const LogoCardsRef = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Image_Desktop: nullish(Media.array()),
  Background_color: z.enum(['paper', 'forest']).optional(),
  Image_Mobile: nullish(Media.array()),
  isFullwidth: z.boolean().default(false).optional(),
});

export type LogoCards = z.infer<typeof LogoCards>;
