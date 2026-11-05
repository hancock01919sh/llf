import { z } from 'zod';
import { IconlinkRef, IconlinkDeepRef } from '../shared/iconlink';
import { LinksRef, LinksDeepRef } from '../shared/links';
import { OverlayLinkRef, OverlayLinkDeepRef } from '../shared/overlay-link';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Footer = z.object({
  id: z.number().int(),
  Link: nullish(z.array(z.lazy(() => LinksRef))),
  Iconlink: nullish(z.array(z.lazy(() => IconlinkRef))),
  Legal_Copy: nullish(z.string()),
  Overlaylink: nullish(z.array(z.lazy(() => OverlayLinkRef))),
});

export const FooterRef = z.object({
  id: z.number().int(),
  Legal_Copy: nullish(z.string()),
});

export const FooterDeepRef = z.object({
  id: z.number().int(),
  Link: nullish(z.array(z.lazy((): z.ZodType<LinksDeepRef> => LinksDeepRef))),
  Iconlink: nullish(z.array(z.lazy((): z.ZodType<IconlinkDeepRef> => IconlinkDeepRef))),
  Legal_Copy: nullish(z.string()),
  Overlaylink: nullish(z.array(z.lazy((): z.ZodType<OverlayLinkDeepRef> => OverlayLinkDeepRef))),
});

export type FooterDeepRef = z.infer<typeof FooterDeepRef>;

export type Footer = z.infer<typeof Footer>;
