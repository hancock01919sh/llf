import { getSearchIndexJson } from '@/lib/data';

/** Site-search index, served on demand; @/lib/cms revalidates internally every 60s (TDD D36, §6.5). */
export const dynamic = 'force-dynamic';

export async function GET() {
  return new Response(JSON.stringify(await getSearchIndexJson()), {
    headers: { 'Content-Type': 'application/json' },
  });
}
