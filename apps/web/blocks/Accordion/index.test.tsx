import type { cmsType } from '@llf/contracts';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BlockAccordion } from './index';

// Shaped after the `component.accordion` block in apps/web/fixtures/cms/pages.json (page "find-my-tips").
const photo = {
  label: 'Photo of your fridge or pantry',
  description: 'Take the photo in good lighting.',
};
const recipe = { label: 'Recipe from a website', description: 'Paste a link to the recipe.' };

const block = {
  __component: 'component.accordion',
  id: 24,
  subTitle: 'Not sure what to try first? Here’s what works.',
  backgroundColor: 'forest-tint',
  isFullwidth: false,
  firstItemExpand: false,
  title: { copy: 'what can you upload?', header: 'h2' },
  accordionItem: [photo, recipe],
} satisfies cmsType.component.Accordion;

const renderBlock = (overrides: Partial<cmsType.component.Accordion> = {}) =>
  render(<BlockAccordion block={{ ...block, ...overrides }} index={1} pageTitle="Find My Tips" />);

const trigger = (label: string) => screen.getByRole('button', { name: label });
/** The panel a trigger controls, via the `aria-controls` wiring. */
const panel = (label: string) =>
  document.getElementById(trigger(label).getAttribute('aria-controls') ?? '') as HTMLElement;

describe('BlockAccordion', () => {
  afterEach(cleanup);

  it('renders the CMS title, subtitle and every item label', () => {
    renderBlock();
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('what can you upload?');
    expect(screen.getByText(block.subTitle)).toBeDefined();
    for (const entry of block.accordionItem) expect(trigger(entry.label)).toBeDefined();
  });

  it('starts collapsed', () => {
    renderBlock();
    for (const entry of block.accordionItem) {
      expect(trigger(entry.label).getAttribute('aria-expanded')).toBe('false');
      expect(panel(entry.label).getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('opens the first item by default when firstItemExpand is set', () => {
    renderBlock({ firstItemExpand: true });
    expect(trigger(photo.label).getAttribute('aria-expanded')).toBe('true');
    expect(trigger(recipe.label).getAttribute('aria-expanded')).toBe('false');
  });

  it('opens on click and keeps only one item open', () => {
    renderBlock();

    fireEvent.click(trigger(photo.label));
    expect(trigger(photo.label).getAttribute('aria-expanded')).toBe('true');
    expect(panel(photo.label).getAttribute('aria-hidden')).toBe('false');
    expect(panel(photo.label).textContent).toContain(photo.description);

    fireEvent.click(trigger(recipe.label));
    expect(trigger(recipe.label).getAttribute('aria-expanded')).toBe('true');
    expect(trigger(photo.label).getAttribute('aria-expanded')).toBe('false');
  });

  it('toggles from the keyboard', () => {
    renderBlock();
    const button = trigger(photo.label);
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(button.getAttribute('aria-expanded')).toBe('true');
    fireEvent.keyDown(button, { key: ' ' });
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });
});
