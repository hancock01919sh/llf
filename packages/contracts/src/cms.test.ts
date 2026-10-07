import { describe, expect, it } from 'vitest';
import { HeroBlock, Page, Title } from './cms';

describe('cms schemas', () => {
  it('defaults the title heading level to h3', () => {
    expect(Title.parse({ copy: 'Hi' }).header).toBe('h3');
  });

  it('accepts Strapi nulls and strips unknown keys', () => {
    const page = Page.parse({
      id: 1,
      documentId: 'abc',
      title: 'Home',
      path: '/',
      seo: null,
      main: [{ __component: 'component.hero', id: 1, layout: 'Primary', newField: true }],
      createdAt: '2025-01-01',
    });
    expect(page).not.toHaveProperty('createdAt');
    const hero = HeroBlock.parse(page.main[0]);
    expect(hero.ctas).toEqual([]);
    expect(hero).not.toHaveProperty('newField');
  });
});
