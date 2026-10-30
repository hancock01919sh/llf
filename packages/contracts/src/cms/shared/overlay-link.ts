import { z } from 'zod';
import { BlockSchema } from '../blocks';

export const OverlayLinkSchema = z.object({
  Label: z.string().optional(),
  Overlay_description: BlockSchema.array().optional(),
  href: z.string().optional(),
});

export type OverlayLink = z.infer<typeof OverlayLinkSchema>;
