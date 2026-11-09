import { z } from 'zod';
import { IconlinkRef, IconlinkDeepRef } from '../shared/iconlink';
import { LinksRef, LinksDeepRef } from '../shared/links';
import { OverlayLinkRef, OverlayLinkDeepRef } from '../shared/overlay-link';

export const Footer = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  link: z.array(z.lazy(() => LinksRef)),
  iconLink: z.array(z.lazy(() => IconlinkRef)),
  legalCopy: z.string(),
  overlayLink: z.array(z.lazy(() => OverlayLinkRef)),
});

export const FooterRef = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  legalCopy: z.string(),
});

export const FooterDeepRef = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  link: z.array(z.lazy((): z.ZodType<LinksDeepRef>  => LinksDeepRef)),
  iconLink: z.array(z.lazy((): z.ZodType<IconlinkDeepRef>  => IconlinkDeepRef)),
  legalCopy: z.string(),
  overlayLink: z.array(z.lazy((): z.ZodType<OverlayLinkDeepRef>  => OverlayLinkDeepRef)),
});

export type FooterDeepRef = z.infer<typeof FooterDeepRef>;

export type Footer = z.infer<typeof Footer>;

export type FooterRef = z.infer<typeof FooterRef>;
