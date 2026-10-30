import { z } from 'zod';
import { IconlinkRef } from '../shared/iconlink';
import { LinksRef } from '../shared/links';
import { OverlayLinkRef } from '../shared/overlay-link';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Footer = z.object({
  Link: nullish(LinksRef.array()),
  Iconlink: nullish(IconlinkRef.array()),
  Legal_Copy: nullish(z.string()),
  Overlaylink: nullish(OverlayLinkRef.array()),
});

export const FooterRef = z.object({
  Legal_Copy: nullish(z.string()),
});

export type Footer = z.infer<typeof Footer>;
