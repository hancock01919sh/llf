import { z } from 'zod';
import {_404Schema } from '../component/_404';
import {_5050TextAndImageSchema } from '../component/_5050-text-and-image';
import {AccordionSchema } from '../component/accordion';
import {AssetsCardsSchema } from '../shared/assets-cards';
import {CarouselSchema } from '../component/carousel';
import {CarouselSmallSchema } from '../component/carousel-small';
import {CarouselStandardSchema } from '../component/carousel-standard';
import {CategoryCarouselFeatureSchema } from '../component/category-carousel-feature';
import {CategoryDetailSchema } from '../component/category-detail';
import {CategoryEmojiSchema } from '../component/category-emoji';
import {ContentSpotlightSchema } from '../component/content-spotlight';
import {GuideSchema } from '../component/guide';
import {HeaderSchema } from '../component/header';
import {HeroSchema } from '../component/hero';
import {HighlightComponentSchema } from '../component/highlight-component';
import {IngredientCarouselSchema } from '../component/ingredient-carousel';
import {LogoCardsSchema } from '../component/logo-cards';
import {SearchSchema } from '../component/search';
import {SeoSchema } from '../shared/seo';
import {TextAndImageCardSchema } from '../component/text-and-image-card';
import {TipBannerSchema } from '../component/tip-banner';
import {TipListSchema } from '../custom/tip-list';
import {ToolInputSchema } from '../component/tool-input';
import {ToolkitHeadlineSchema } from '../component/toolkit-headline';
import {ToolSchema } from '../custom/tool';
import {ToolSpotlightSchema } from '../component/tool-spotlight';

export const PageSchema = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  path: z.string(),
  main: z.lazy((): z.ZodType => z.union([HeroSchema,ToolSchema,CarouselSchema,TipListSchema,ToolSpotlightSchema,HighlightComponentSchema,CategoryEmojiSchema,CategoryCarouselFeatureSchema,HeaderSchema,LogoCardsSchema,ContentSpotlightSchema,_5050TextAndImageSchema,TextAndImageCardSchema,ToolInputSchema,AccordionSchema,CarouselStandardSchema,IngredientCarouselSchema,TipBannerSchema,CarouselSmallSchema,SearchSchema,CategoryDetailSchema,_404Schema,ToolkitHeadlineSchema,AssetsCardsSchema,GuideSchema,]).array()).optional(),
  seo: z.lazy((): z.ZodType => SeoSchema).optional(),
});

export type Page = z.infer<typeof PageSchema>;
