import { cms, cmsType } from '@llf/contracts';
import type { ComponentType } from 'react';
import type { z } from 'zod';
import { Carousel } from './Carousel';
import { FindMyTips } from './FindMyTips';
import { Hero } from './Hero';
import { LinkList } from './LinkList';
import { SearchBox } from './SearchBox';
import { Teaser } from './Teaser';
import { TipList } from './TipList';
import { BlockToolInput } from './ToolInput';
import { BlockAccordion } from './Accordion';
import type { BlockProps } from './types';
import type { Surface } from '@/components/ModuleBoundary';
import { BlockHighlightComponent } from './HighlightComponent';
import { CategoryDetailComponent, CategoryDetailWithSearchSchema } from './CategoryDetail.tsx';
import { BlockNotFound } from './NotFound';
import { BlockSearch } from './Search/SearchBlock';

/**
 * Page `main` dynamic-zone blocks (TDD §6.4). To add one: a Strapi component, a Zod schema in
 * `packages/contracts/src/cms.ts`, a React component in this folder, a story, and an entry here.
 */
interface BlockEntry<S extends z.ZodType> {
  schema: S;
  Component: ComponentType<BlockProps<z.output<S>>>;
  /** Short name used for `data-module-type` and analytics (TDD §8). */
  type: string;
  surface?: Surface;
  isFullWidth?: boolean;
}

const entry = <S extends z.ZodType>(e: BlockEntry<S>) => e;

// TODO(BD3244-8): accordion, asset-list, and jump-nav blocks once their Strapi components exist.
export const blocks = {
  'component.hero': entry({ schema: cms.HeroBlock, Component: Hero, type: 'hero' }),
  'component.teaser': entry({ schema: cms.TeaserBlock, Component: Teaser, type: 'teaser' }),
  'component.link-list': entry({
    schema: cms.LinkListBlock,
    Component: LinkList,
    type: 'link-list',
  }),
  'component.carousel': entry({ schema: cms.CarouselBlock, Component: Carousel, type: 'carousel' }),
  'custom.search': entry({ schema: cms.SearchBlock, Component: SearchBox, type: 'search' }),
  'custom.tip-list': entry({ schema: cms.TipListBlock, Component: TipList, type: 'tip-list' }),
  'custom.tool': entry({ schema: cms.ToolBlock, Component: FindMyTips, type: 'tool' }),
  'component.tool-input': entry({
    schema: cmsType.component.ToolInputDeepRef,
    Component: BlockToolInput,
    type: 'tool-input',
    surface: 'paper',
  }),
  'component.accordion': entry({
    schema: cmsType.component.Accordion,
    Component: BlockAccordion,
    type: 'accordion',
  }),
  'component.highlight-component': entry({
    schema: cmsType.component.HighlightComponent,
    Component: BlockHighlightComponent,
    type: 'highlight-component',
  }),
  'component.category-detail': entry({
    schema: CategoryDetailWithSearchSchema,
    Component: CategoryDetailComponent,
    type: 'category-detail',
    surface: 'forest',
  }),
  'component.404': entry({
    schema: cmsType.component._404,
    Component: BlockNotFound,
    type: 'not-found',
  }),
  'component.search': entry({
    schema: CategoryDetailWithSearchSchema,
    Component: BlockSearch,
    type: 'search',
    isFullWidth: true,
  }),
} as const;

export type BlockKey = keyof typeof blocks;

export function isBlockKey(value: string): value is BlockKey {
  return Object.hasOwn(blocks, value);
}

/** Block-level layout, when the block has one, for `data-module-layout`. */
export function blockLayout(block: unknown): string | undefined {
  if (block && typeof block === 'object' && 'layout' in block && typeof block.layout === 'string') {
    return block.layout;
  }
  return undefined;
}
