import { z } from 'zod';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const LogoCards = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Image_Desktop: nullish(Media.array()),
  Background_color: nullish(z.enum(['paper', 'forest'])),
  Image_Mobile: nullish(Media.array()),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const LogoCardsRef = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Image_Desktop: nullish(Media.array()),
  Background_color: nullish(z.enum(['paper', 'forest'])),
  Image_Mobile: nullish(Media.array()),
  isFullwidth: nullish(z.boolean().default(false)),
});

export type LogoCards = z.infer<typeof LogoCards>;
