import { z } from 'zod';
import { Block } from '../blocks';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const OverlayLink = z.object({
  Label: nullish(z.string()),
  Overlay_description: Block.array().optional(),
  href: nullish(z.string()),
});

export const OverlayLinkRef = z.object({
  Label: nullish(z.string()),
  href: nullish(z.string()),
});

export type OverlayLink = z.infer<typeof OverlayLink>;
