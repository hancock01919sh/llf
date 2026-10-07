import { getCatalog } from '@/lib/data';

/** The matcher's catalog. The tool service loads it from the deployed site (TDD §7.2). */
export const dynamic = 'force-static';

export async function GET() {
  return Response.json(await getCatalog());
}
