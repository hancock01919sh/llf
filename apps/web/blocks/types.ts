import { SurfaceSchema, type Surface } from '@/components/ModuleBoundary';
import type { GlobalBackgroundColor } from '@/lib/const';
import { z } from 'zod';
export interface BlockProps<T> {
  block: T;
  /** Position in the dynamic zone. The first block may own the page's h1 (TDD §6.6). */
  index: number;
  pageTitle: string;
  type?: string;
  id?: string;
  layout?: string;
  isFullwidth?: boolean;
  Background_color?: Surface;
}

export const BlockBaseSchema = z.object({
  id: z.number().int(),
  Title: z.string(),
  Description: z.string().nullish(),
  CategorySlug: z.string().nullish(),
  isFullwidth: z.boolean().nullish(),
  Background_color: SurfaceSchema.nullish(),
});
export type BlockBaseProps = z.infer<typeof BlockBaseSchema>;
export const LinkSchema = z.object({
  Label: z.string(),
  href: z.string().nullable().default('#'),
  isDisplay: z.boolean().nullable(),
  isButton: z.boolean().nullable(),
  Buttontype: z.string().nullable(),
  NewTab: z.boolean().nullable(),
});
export type LinkProps = z.infer<typeof LinkSchema>;

export type ImageProps = {
  url: string;
  width?: number | string;
  height?: number | string;
  ext?: string;
  name?: string;
  alternativeText: string;
  documentId?: string;
};
export type ModuleBoundaryBgColor = keyof typeof GlobalBackgroundColor;

/** One entry in a Page's `main` dynamic zone, as Strapi returns it (TDD §6.4). */
export type CmsBlock = {
  id: number;
  __component: string;
} & Record<string, unknown>;

export interface SeoProps {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
}

/** A CMS page as returned by `getPageByName` / `getPages` (TDD D21). */
export type CmsPage = {
  title: string;
  path: string;
  main: CmsBlock[];
  seo?: SeoProps | null;
};
export type GlobalProps = {
  seo?: SeoProps | null;
  title: string;
  load: {
    title: string;
    Statement: string;
  };
};
