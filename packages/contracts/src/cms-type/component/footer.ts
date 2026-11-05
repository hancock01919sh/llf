import type { ZodType } from 'zod';
import { z } from 'zod';
import { IconlinkRef, IconlinkDeepRef } from '../shared/iconlink';
import { LinksRef, LinksDeepRef } from '../shared/links';
import { OverlayLinkRef, OverlayLinkDeepRef } from '../shared/overlay-link';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Footer = z.object({
  __component: z.literal('component.footer'),
  id: z.number().int(),
  Link: nullish(z.array(z.lazy((): ZodType => LinksRef))),
  Iconlink: nullish(z.array(z.lazy((): ZodType => IconlinkRef))),
  Legal_Copy: nullish(z.string()),
  Overlaylink: nullish(z.array(z.lazy((): ZodType => OverlayLinkRef))),
});

export const FooterRef = z.object({
  __component: z.literal('component.footer'),
  id: z.number().int(),
  Legal_Copy: nullish(z.string()),
});

export const FooterDeepRef = z.object({
  __component: z.literal('component.footer'),
  id: z.number().int(),
  Link: nullish(z.array(z.lazy((): ZodType => LinksDeepRef))),
  Iconlink: nullish(z.array(z.lazy((): ZodType => IconlinkDeepRef))),
  Legal_Copy: nullish(z.string()),
  Overlaylink: nullish(z.array(z.lazy((): ZodType => OverlayLinkDeepRef))),
});

export type FooterDeepRef = z.infer<typeof FooterDeepRef>;

export type Footer = z.infer<typeof Footer>;
