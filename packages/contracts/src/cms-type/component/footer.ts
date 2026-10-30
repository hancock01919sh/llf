import { z } from 'zod';
import { IconlinkRef } from '../shared/iconlink';
import { LinksRef } from '../shared/links';
import { OverlayLinkRef } from '../shared/overlay-link';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Footer = z.object({
  Link: LinksRef.array().optional(),
  Iconlink: IconlinkRef.array().optional(),
  Legal_Copy: nullish(z.string()),
  Overlaylink: OverlayLinkRef.array().optional(),
});

export const FooterRef = z.object({
  Legal_Copy: nullish(z.string()),
});

export type Footer = z.infer<typeof Footer>;
