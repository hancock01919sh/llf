import { z } from 'zod';
import { Block } from '../blocks';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const OverlayLink = z.object({
  __component: z.literal('shared.overlay-link'),
  id: z.number().int(),
  Label: z.string(),
  Overlay_description: nullish(Block.array()),
  href: nullish(z.string()),
});

export const OverlayLinkRef = z.object({
  __component: z.literal('shared.overlay-link'),
  id: z.number().int(),
  Label: z.string(),
  href: nullish(z.string()),
});

export type OverlayLink = z.infer<typeof OverlayLink>;
