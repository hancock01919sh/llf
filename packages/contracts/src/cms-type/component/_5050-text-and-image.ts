import { z } from 'zod';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const _5050TextAndImage = z.object({
  __component: z.literal('component.5050-text-and-image'),
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
  image: Media,
  makeImageLeft: nullish(z.boolean()),
  addBackgroundColor: nullish(z.boolean().default(false)),
  positionOfAddingBgColor: nullish(z.enum(['Up ', 'Down'])),
  isFullwidth: nullish(z.boolean().default(false)),
  backgroundColor: z.enum(['paper']),
});

export const _5050TextAndImageRef = z.object({
  __component: z.literal('component.5050-text-and-image'),
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
  image: Media,
  makeImageLeft: nullish(z.boolean()),
  addBackgroundColor: nullish(z.boolean().default(false)),
  positionOfAddingBgColor: nullish(z.enum(['Up ', 'Down'])),
  isFullwidth: nullish(z.boolean().default(false)),
  backgroundColor: z.enum(['paper']),
});

export const _5050TextAndImageDeepRef = z.object({
  __component: z.literal('component.5050-text-and-image'),
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
  image: Media,
  makeImageLeft: nullish(z.boolean()),
  addBackgroundColor: nullish(z.boolean().default(false)),
  positionOfAddingBgColor: nullish(z.enum(['Up ', 'Down'])),
  isFullwidth: nullish(z.boolean().default(false)),
  backgroundColor: z.enum(['paper']),
});

export type _5050TextAndImageDeepRef = z.infer<typeof _5050TextAndImageDeepRef>;

export type _5050TextAndImage = z.infer<typeof _5050TextAndImage>;

export type _5050TextAndImageRef = z.infer<typeof _5050TextAndImageRef>;
