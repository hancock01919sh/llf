import type { ZodType } from 'zod';
import { z } from 'zod';
import { IconlinkRef, IconlinkDeepRef } from '../shared/iconlink';
import { LinksRef, LinksDeepRef } from '../shared/links';
import { OverlayLinkRef, OverlayLinkDeepRef } from '../shared/overlay-link';

export const Footer = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  link: z.array(z.lazy((): ZodType => LinksRef)),
  iconLink: z.array(z.lazy((): ZodType => IconlinkRef)),
  legalCopy: z.string(),
  overlayLink: z.array(z.lazy((): ZodType => OverlayLinkRef)),
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
  link: z.array(z.lazy((): ZodType => LinksDeepRef)),
  iconLink: z.array(z.lazy((): ZodType => IconlinkDeepRef)),
  legalCopy: z.string(),
  overlayLink: z.array(z.lazy((): ZodType => OverlayLinkDeepRef)),
});

export type FooterDeepRef = z.infer<typeof FooterDeepRef>;

export type Footer = z.infer<typeof Footer>;
