import { z } from 'zod';
import { _404 } from '../component/_404';
import { _5050TextAndImage } from '../component/_5050-text-and-image';
import { Accordion } from '../component/accordion';
import { AssetsCards } from '../shared/assets-cards';
import { Carousel } from '../component/carousel';
import { CarouselSmall } from '../component/carousel-small';
import { CarouselStandard } from '../component/carousel-standard';
import { CategoryCarouselFeature } from '../component/category-carousel-feature';
import { CategoryDetail } from '../component/category-detail';
import { CategoryEmoji } from '../component/category-emoji';
import { ContentSpotlight } from '../component/content-spotlight';
import { Guide } from '../component/guide';
import { Header } from '../component/header';
import { Hero } from '../component/hero';
import { HighlightComponent } from '../component/highlight-component';
import { IngredientCarousel } from '../component/ingredient-carousel';
import { LogoCards } from '../component/logo-cards';
import { Search } from '../component/search';
import { Seo } from '../shared/seo';
import { TextAndImageCard } from '../component/text-and-image-card';
import { TipBanner } from '../component/tip-banner';
import { TipList } from '../custom/tip-list';
import { Tool } from '../custom/tool';
import { ToolInput } from '../component/tool-input';
import { ToolkitHeadline } from '../component/toolkit-headline';
import { ToolSpotlight } from '../component/tool-spotlight';

export const Page = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  path: z.string(),
  main: z
    .lazy((): z.ZodType =>
      z
        .union([
          Hero,
          Tool,
          Carousel,
          TipList,
          ToolSpotlight,
          HighlightComponent,
          CategoryEmoji,
          CategoryCarouselFeature,
          Header,
          LogoCards,
          ContentSpotlight,
          _5050TextAndImage,
          TextAndImageCard,
          ToolInput,
          Accordion,
          CarouselStandard,
          IngredientCarousel,
          TipBanner,
          CarouselSmall,
          Search,
          CategoryDetail,
          _404,
          ToolkitHeadline,
          AssetsCards,
          Guide,
        ])
        .array(),
    )
    .optional(),
  seo: z.lazy((): z.ZodType => Seo).optional(),
});

export type Page = z.infer<typeof Page>;
