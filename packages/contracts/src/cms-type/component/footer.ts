import { z } from 'zod';
import { Iconlink } from '../shared/iconlink';
import { Links } from '../shared/links';
import { OverlayLink } from '../shared/overlay-link';

export const Footer = z.object({
  Link: z
    .lazy((): z.ZodType => Links)
    .array()
    .optional(),
  Iconlink: z
    .lazy((): z.ZodType => Iconlink)
    .array()
    .optional(),
  Legal_Copy: z.string().optional(),
  Overlaylink: z
    .lazy((): z.ZodType => OverlayLink)
    .array()
    .optional(),
});

export type Footer = z.infer<typeof Footer>;
