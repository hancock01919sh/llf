import { z } from 'zod';
import { Block } from '../blocks';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const OverlayLink = z.object({
  Label: z.string(),
  Overlay_description: nullish(Block.array()),
  href: nullish(z.string()),
});

export const OverlayLinkRef = z.object({
  Label: z.string(),
  href: nullish(z.string()),
});

export const OverlayLinkDeepRef = z.object({
  Label: z.string(),
  Overlay_description: nullish(Block.array()),
  href: nullish(z.string()),
});

export type OverlayLinkDeepRef = z.infer<typeof OverlayLinkDeepRef>;

export type OverlayLink = z.infer<typeof OverlayLink>;
