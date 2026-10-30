import { z } from 'zod';
import { IconlinkSchema } from '../shared/iconlink';
import { LinksSchema } from '../shared/links';
import { OverlayLinkSchema } from '../shared/overlay-link';

export const FooterSchema = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string().optional(),
  link: z
    .lazy((): z.ZodType => LinksSchema)
    .array()
    .optional(),
  iconLink: z
    .lazy((): z.ZodType => IconlinkSchema)
    .array()
    .optional(),
  legalCopy: z.string().optional(),
  overlayLink: z
    .lazy((): z.ZodType => OverlayLinkSchema)
    .array()
    .optional(),
});

export type Footer = z.infer<typeof FooterSchema>;
