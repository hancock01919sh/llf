import { getSearchIndexJson } from '@/lib/data';

/** Site-search index, written to `out/data/search-index.json` by the static export (TDD §6.5). */
export const dynamic = 'force-static';

export async function GET() {
  return new Response(JSON.stringify(await getSearchIndexJson()), {
    headers: { 'Content-Type': 'application/json' },
  });
}
