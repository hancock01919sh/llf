import { z } from 'zod';
import {IconlinkSchema } from '../shared/iconlink';
import {LinksSchema } from '../shared/links';
import {OverlayLinkSchema } from '../shared/overlay-link';

export const FooterSchema = z.object({
  Link: z.lazy((): z.ZodType => LinksSchema).array().optional(),
  Iconlink: z.lazy((): z.ZodType => IconlinkSchema).array().optional(),
  Legal_Copy: z.string().optional(),
  Overlaylink: z.lazy((): z.ZodType => OverlayLinkSchema).array().optional(),
});

export type Footer = z.infer<typeof FooterSchema>;
