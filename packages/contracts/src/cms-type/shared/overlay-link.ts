import { z } from 'zod';
import { Block } from '../blocks';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const OverlayLink = z.object({
  label: z.string(),
  overlayDescription: nullish(Block.array()),
  href: nullish(z.string()),
});

export const OverlayLinkRef = z.object({
  label: z.string(),
  href: nullish(z.string()),
});

export const OverlayLinkDeepRef = z.object({
  label: z.string(),
  overlayDescription: nullish(Block.array()),
  href: nullish(z.string()),
});

export type OverlayLinkDeepRef = z.infer<typeof OverlayLinkDeepRef>;

export type OverlayLink = z.infer<typeof OverlayLink>;

export type OverlayLinkRef = z.infer<typeof OverlayLinkRef>;
