import { z } from 'zod';
import { _404Ref } from '../component/_404';
import { _5050TextAndImageRef } from '../component/_5050-text-and-image';
import { AccordionRef } from '../component/accordion';
import { AssetsCardsRef } from '../shared/assets-cards';
import { CarouselRef } from '../component/carousel';
import { CarouselSmallRef } from '../component/carousel-small';
import { CarouselStandardRef } from '../component/carousel-standard';
import { CategoryCarouselFeatureRef } from '../component/category-carousel-feature';
import { CategoryDetailRef } from '../component/category-detail';
import { CategoryEmojiRef } from '../component/category-emoji';
import { ContentSpotlightRef } from '../component/content-spotlight';
import { GuideRef } from '../component/guide';
import { HeaderRef } from '../component/header';
import { HeroRef } from '../component/hero';
import { HighlightComponentRef } from '../component/highlight-component';
import { IngredientCarouselRef } from '../component/ingredient-carousel';
import { LogoCardsRef } from '../component/logo-cards';
import { SearchRef } from '../component/search';
import { SeoRef } from '../shared/seo';
import { TextAndImageCardRef } from '../component/text-and-image-card';
import { TipBannerRef } from '../component/tip-banner';
import { TipListRef } from '../custom/tip-list';
import { ToolInputRef } from '../component/tool-input';
import { ToolkitHeadlineRef } from '../component/toolkit-headline';
import { ToolRef } from '../custom/tool';
import { ToolSpotlightRef } from '../component/tool-spotlight';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Page = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  path: z.string(),
  main: nullish(
    z.array(
      z.union([
        z.lazy(() => HeroRef),
        z.lazy(() => ToolRef),
        z.lazy(() => CarouselRef),
        z.lazy(() => TipListRef),
        z.lazy(() => ToolSpotlightRef),
        z.lazy(() => HighlightComponentRef),
        z.lazy(() => CategoryEmojiRef),
        z.lazy(() => CategoryCarouselFeatureRef),
        z.lazy(() => HeaderRef),
        z.lazy(() => LogoCardsRef),
        z.lazy(() => ContentSpotlightRef),
        z.lazy(() => _5050TextAndImageRef),
        z.lazy(() => TextAndImageCardRef),
        z.lazy(() => ToolInputRef),
        z.lazy(() => AccordionRef),
        z.lazy(() => CarouselStandardRef),
        z.lazy(() => IngredientCarouselRef),
        z.lazy(() => TipBannerRef),
        z.lazy(() => CarouselSmallRef),
        z.lazy(() => SearchRef),
        z.lazy(() => CategoryDetailRef),
        z.lazy(() => _404Ref),
        z.lazy(() => ToolkitHeadlineRef),
        z.lazy(() => AssetsCardsRef),
        z.lazy(() => GuideRef),
      ]),
    ),
  ),
  seo: nullish(z.lazy(() => SeoRef)),
});

export const PageRef = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  path: z.string(),
  main: nullish(
    z.array(
      z.union([
        z.lazy(() => HeroRef),
        z.lazy(() => ToolRef),
        z.lazy(() => CarouselRef),
        z.lazy(() => TipListRef),
        z.lazy(() => ToolSpotlightRef),
        z.lazy(() => HighlightComponentRef),
        z.lazy(() => CategoryEmojiRef),
        z.lazy(() => CategoryCarouselFeatureRef),
        z.lazy(() => HeaderRef),
        z.lazy(() => LogoCardsRef),
        z.lazy(() => ContentSpotlightRef),
        z.lazy(() => _5050TextAndImageRef),
        z.lazy(() => TextAndImageCardRef),
        z.lazy(() => ToolInputRef),
        z.lazy(() => AccordionRef),
        z.lazy(() => CarouselStandardRef),
        z.lazy(() => IngredientCarouselRef),
        z.lazy(() => TipBannerRef),
        z.lazy(() => CarouselSmallRef),
        z.lazy(() => SearchRef),
        z.lazy(() => CategoryDetailRef),
        z.lazy(() => _404Ref),
        z.lazy(() => ToolkitHeadlineRef),
        z.lazy(() => AssetsCardsRef),
        z.lazy(() => GuideRef),
      ]),
    ),
  ),
});

export type Page = z.infer<typeof Page>;
