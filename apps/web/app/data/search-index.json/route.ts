import { getSearchIndexJson } from '@/lib/data';

/** Site-search index, served from a route handler with the page ISR window (TDD D36, §6.5). */
export const revalidate = 60;

export async function GET() {
  return new Response(JSON.stringify(await getSearchIndexJson()), {
    headers: { 'Content-Type': 'application/json' },
  });
}
