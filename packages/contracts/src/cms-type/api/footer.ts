import { z } from 'zod';
import { IconlinkRef } from '../shared/iconlink';
import { LinksRef } from '../shared/links';
import { OverlayLinkRef } from '../shared/overlay-link';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Footer = z.object({
  id: z.number(),
  documentId: z.string(),
  title: nullish(z.string()),
  link: LinksRef.array().optional(),
  iconLink: IconlinkRef.array().optional(),
  legalCopy: nullish(z.string()),
  overlayLink: OverlayLinkRef.array().optional(),
});

export const FooterRef = z.object({
  id: z.number(),
  documentId: z.string(),
  title: nullish(z.string()),
  legalCopy: nullish(z.string()),
});

export type Footer = z.infer<typeof Footer>;
