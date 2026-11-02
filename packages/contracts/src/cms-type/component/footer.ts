import { z } from 'zod';
import { IconlinkRef } from '../shared/iconlink';
import { LinksRef } from '../shared/links';
import { OverlayLinkRef } from '../shared/overlay-link';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Footer = z.object({
  Link: nullish(z.array(z.lazy(() => LinksRef))),
  Iconlink: nullish(z.array(z.lazy(() => IconlinkRef))),
  Legal_Copy: nullish(z.string()),
  Overlaylink: nullish(z.array(z.lazy(() => OverlayLinkRef))),
});

export const FooterRef = z.object({
  Legal_Copy: nullish(z.string()),
});

export type Footer = z.infer<typeof Footer>;
