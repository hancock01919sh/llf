import { z } from 'zod';
import { BlockSchema } from '../blocks';
import { MediaSchema } from '../media';
import {LinksSchema } from '../shared/links';
import {TipsPopupSchema } from '../component/tips-popup';

export const CategoryDetailSchema = z.object({
  Title: z.string().optional(),
  Description: z.string().optional(),
  Image: MediaSchema.array().optional(),
  SubTitle: z.string().optional(),
  Statement: BlockSchema.array().optional(),
  Button: z.lazy((): z.ZodType => LinksSchema).optional(),
  Popup: z.lazy((): z.ZodType => TipsPopupSchema).optional(),
  isFullwidth: z.boolean().default(false).optional(),
  Background_color: z.enum(["forest"]).optional(),
});

export type CategoryDetail = z.infer<typeof CategoryDetailSchema>;
