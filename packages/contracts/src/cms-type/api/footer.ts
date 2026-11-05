import { z } from 'zod';
import { IconlinkRef } from '../shared/iconlink';
import { LinksRef } from '../shared/links';
import { OverlayLinkRef } from '../shared/overlay-link';

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
  legalCopy: z.string(),
});

export type FooterDeepRef = z.infer<typeof FooterDeepRef>;

export type Footer = z.infer<typeof Footer>;
