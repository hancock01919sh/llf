import { z } from 'zod';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Header = z.object({
  __component: z.literal('component.header'),
  id: z.number().int(),
  title: z.string(),
  subTitle: z.string(),
  description: z.string(),
  image: nullish(Media),
  backgroundColor: z.enum(['terra', 'forest']),
  addBackgroundColor: nullish(z.boolean().default(false)),
  positionOfAddingBgColor: nullish(z.enum(['up', 'down'])),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const HeaderRef = z.object({
  __component: z.literal('component.header'),
  id: z.number().int(),
  title: z.string(),
  subTitle: z.string(),
  description: z.string(),
  image: nullish(Media),
  backgroundColor: z.enum(['terra', 'forest']),
  addBackgroundColor: nullish(z.boolean().default(false)),
  positionOfAddingBgColor: nullish(z.enum(['up', 'down'])),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const HeaderDeepRef = z.object({
  __component: z.literal('component.header'),
  id: z.number().int(),
  title: z.string(),
  subTitle: z.string(),
  description: z.string(),
  image: nullish(Media),
  backgroundColor: z.enum(['terra', 'forest']),
  addBackgroundColor: nullish(z.boolean().default(false)),
  positionOfAddingBgColor: nullish(z.enum(['up', 'down'])),
  isFullwidth: nullish(z.boolean().default(false)),
});

export type HeaderDeepRef = z.infer<typeof HeaderDeepRef>;

export type Header = z.infer<typeof Header>;

export type HeaderRef = z.infer<typeof HeaderRef>;
