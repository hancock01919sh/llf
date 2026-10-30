import { z } from 'zod';
import { Block } from '../blocks';

export const OverlayLink = z.object({
  Label: z.string().optional(),
  Overlay_description: Block.array().optional(),
  href: z.string().optional(),
});

export type OverlayLink = z.infer<typeof OverlayLink>;
