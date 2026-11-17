import { getCatalog } from '@/lib/data';

/** The matcher's catalog, served on demand; @/lib/cms revalidates internally every 60s (TDD D36, §7.2). */
export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(await getCatalog());
}
