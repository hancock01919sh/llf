import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Button, buttonVariants } from './button';

afterEach(cleanup);

describe('Button', () => {
  it('renders a type="button" primary by default', () => {
    render(<Button>Find tips</Button>);
    const button = screen.getByRole('button', { name: 'Find tips' });
    expect(button.getAttribute('type')).toBe('button');
    expect(button.className).toContain('bg-surface-mint');
    expect(button.className).toContain('h-12.5');
  });

  it('keeps an explicit submit type', () => {
    render(<Button type="submit">Go</Button>);
    expect(screen.getByRole('button').getAttribute('type')).toBe('submit');
  });

  it('renders the child element with asChild', () => {
    render(
      <Button asChild variant="secondary">
        <a href="/library/">Browse</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Browse' });
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('type')).toBeNull();
    expect(link.className).toContain('bg-ink-terra');
  });

  it('is disabled and styled inactive', () => {
    render(<Button disabled>Save</Button>);
    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.className).toContain('disabled:bg-ink-terra-15');
  });

  it('exposes the Saved state through aria-pressed', () => {
    render(
      <Button variant="save" aria-pressed>
        Saved
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Saved', pressed: true });
    expect(button.className).toContain('h-control-compact');
    expect(button.className).not.toMatch(/(^| )h-12\.5( |$)/);
  });

  it('lets callers override classes', () => {
    render(<Button className="px-10">Go</Button>);
    expect(screen.getByRole('button').className).toMatch(/(^| )px-10( |$)/);
    expect(screen.getByRole('button').className).not.toMatch(/(^| )px-6( |$)/);
  });

  it.each(['primary', 'secondary', 'tertiary', 'save', 'share'] as const)(
    'every %s variant has a focus ring and a disabled style',
    (variant) => {
      const classes = buttonVariants({ variant });
      expect(classes).toContain('focus-visible:outline-focus');
      expect(classes).toMatch(/disabled:text-ink-terra-40/);
    },
  );
});
