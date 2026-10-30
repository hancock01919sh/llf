import { z } from 'zod';
import { Iconlink } from '../shared/iconlink';
import { Links } from '../shared/links';
import { OverlayLink } from '../shared/overlay-link';

export const Footer = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string().optional(),
  link: z
    .lazy((): z.ZodType => Links)
    .array()
    .optional(),
  iconLink: z
    .lazy((): z.ZodType => Iconlink)
    .array()
    .optional(),
  legalCopy: z.string().optional(),
  overlayLink: z
    .lazy((): z.ZodType => OverlayLink)
    .array()
    .optional(),
});

export type Footer = z.infer<typeof Footer>;
