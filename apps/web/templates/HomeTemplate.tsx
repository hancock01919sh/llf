import type { ReactNode } from 'react';
import { Carousel } from '@/blocks/Carousel';
import { DynamicZone } from '@/blocks/DynamicZone';
import { Hero } from '@/blocks/Hero_old';
import { ModuleBoundary } from '@/components/ModuleBoundary';
import { RichText } from '@/components/RichText';
import { strings } from '@/content/strings';
import { PageHeading } from './PageHeading';
import type { TemplateProps } from './types';

/**
 * Home (Figma Home frames). The hero, intro, and featured categories are fixed slots on the Page
 * (TDD D21); `main` follows them for anything editors add below. Module indexes run page-wide.
 */
export function HomeTemplate({ page }: TemplateProps) {
  const slots: ReactNode[] = [];
  if (page.hero) {
    const index = slots.length;
    slots.push(
      <ModuleBoundary
        key="hero"
        type="hero"
        index={index}
        id={String(page.hero.id)}
        layout={page.hero.layout}
      >
        <Hero
          block={{ __component: 'component.hero', ...page.hero }}
          index={index}
          pageTitle={page.title}
        />
      </ModuleBoundary>,
    );
  }
  if (page.intro && page.intro.length > 0) {
    slots.push(
      <ModuleBoundary key="intro" type="intro" index={slots.length} id="intro">
        <RichText content={page.intro} className="max-w-prose text-paragraph" />
      </ModuleBoundary>,
    );
  }
  if (page.featured.length > 0) {
    const index = slots.length;
    slots.push(
      <ModuleBoundary key="featured" type="carousel" index={index} id="featured" layout="Basic">
        <Carousel
          block={{
            __component: 'component.carousel',
            id: 0,
            title: { copy: strings.home.featuredTitle, header: 'h2' },
            description: null,
            categories: page.featured,
            mode: 'categories',
            layout: 'Basic',
            ctas: [],
          }}
          index={index}
          pageTitle={page.title}
        />
      </ModuleBoundary>,
    );
  }
  return (
    <>
      <PageHeading page={page} />
      {slots}
      <DynamicZone page={page} offset={slots.length} />
    </>
  );
}
