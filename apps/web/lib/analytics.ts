import type { DataLayerEvent, PageType } from '@llf/contracts/analytics';

/**
 * Typed GTM dataLayer push (TDD §8). Only events from `@llf/contracts/analytics` can be sent, and
 * none of them carry user text. Safe to call before GTM loads; GTM replays the queue.
 */
declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export function track(event: DataLayerEvent): void {
  if (typeof window === 'undefined') return;
  (window.dataLayer ??= []).push(event);
}

/** `page_type` for `page_view`, derived from the route (TDD §8). */
export function pageTypeFor(pathname: string): PageType {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/') return 'home';
  if (path === '/find-my-tips') return 'tool';
  if (path === '/find-my-tips/results') return 'results';
  if (path === '/tips') return 'library';
  if (path.startsWith('/tips/')) return 'category';
  if (path === '/search') return 'search';
  if (path === '/about') return 'about';
  return 'page';
}
