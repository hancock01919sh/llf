import { z } from 'zod';
import { Block } from '../blocks';
import { Links } from '../shared/links';
import { Media } from '../media';
import { TipsPopup } from '../component/tips-popup';

export const CategoryDetail = z.object({
  Title: z.string().optional(),
  Description: z.string().optional(),
  Image: Media.array().optional(),
  SubTitle: z.string().optional(),
  Statement: Block.array().optional(),
  Button: z.lazy((): z.ZodType => Links).optional(),
  Popup: z.lazy((): z.ZodType => TipsPopup).optional(),
  isFullwidth: z.boolean().default(false).optional(),
  Background_color: z.enum(['forest']).optional(),
});

export type CategoryDetail = z.infer<typeof CategoryDetail>;
