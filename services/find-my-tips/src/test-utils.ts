import type { Resolver, Transport, TransportResponse } from './url/safe-fetch';

/** Test-only fakes for the network edges. Never imported by runtime code. */

export function fakeResolver(answers: Record<string, string[]>): Resolver {
  return async (hostname) => {
    const found = answers[hostname];
    if (!found) throw new Error(`ENOTFOUND ${hostname}`);
    return found;
  };
}

export type FakePage = Partial<TransportResponse> & { html?: string };

export function fakeTransport(pages: Record<string, FakePage>): Transport & { calls: string[] } {
  const calls: string[] = [];
  const transport = async ({ url }: { url: URL }): Promise<TransportResponse> => {
    calls.push(url.href);
    const page = pages[url.href];
    if (!page) return { status: 404, headers: { 'content-type': 'text/html' }, body: new Uint8Array() };
    return {
      status: page.status ?? 200,
      headers: page.headers ?? { 'content-type': 'text/html; charset=utf-8' },
      body: page.body ?? new TextEncoder().encode(page.html ?? ''),
    };
  };
  return Object.assign(transport, { calls });
}

export function recipePage(ingredients: string[]): string {
  const jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Recipe', recipeIngredient: ingredients });
  return `<html><head><script type="application/ld+json">${jsonLd}</script></head><body><main>Recipe</main></body></html>`;
}

export const PUBLIC_IP = '93.184.216.34';
