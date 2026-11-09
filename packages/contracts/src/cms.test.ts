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

  // it('defaults a missing or null template to generic with empty slots', () => {
    // const base = { id: 1, documentId: 'abc', title: 'About', path: '/about' };
    // for (const page of [Page.parse(base), Page.parse({ ...base, template: null, hero: null })]) {
    //   expect(page.template).toBe('generic');
    //   expect(page.hero).toBeFalsy();
    //   expect(page.tool).toBeFalsy();
    //   expect(page.featured).toEqual([]);
    // }
  // });

  // it('parses the home and find-my-tips template slots', () => {
    // const home = Page.parse({
    //   id: 1,
    //   documentId: 'home',
    //   title: 'Home',
    //   path: '/',
    //   template: 'home',
    //   hero: { id: 3, eyebrow: 'Long Live Food', layout: 'Primary' },
    //   intro: [{ type: 'paragraph', children: [{ type: 'text', text: 'Hi' }] }],
    //   featured: [{ id: 2, documentId: 'cat', title: 'Fruits', slug: 'fruits', image: null }],
    // });
    // expect(home.template).toBe('home');
    // expect(home.hero?.eyebrow).toBe('Long Live Food');
    // expect(home.featured.map((c) => c.slug)).toEqual(['fruits']);
    // expect(home.intro).toHaveLength(1);
    // const tool = {
    //   id: 4,
    //   url_label: 'a',
    //   url_placeholder: 'b',
    //   upload_label: 'c',
    //   upload_placeholder: 'd',
    //   description: 'e',
    //   cta_label: 'f',
    // };
    // const fmt = Page.parse({
    //   id: 2,
    //   documentId: 'fmt',
    //   title: 'Find My Tips',
    //   path: '/find-my-tips',
    //   template: 'find-my-tips',
    //   tool,
    // });
    // expect(fmt.tool).toEqual(tool);
  // });

  // it('rejects an unknown template', () => {
  //   expect(() =>
  //     Page.parse({ id: 1, documentId: 'x', title: 'x', path: '/x', template: 'blog' }),
  //   ).toThrow();
  // });
});
