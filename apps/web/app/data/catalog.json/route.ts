import { getCatalog } from '@/lib/data';

/** The matcher's catalog, served from a route handler with the page ISR window (TDD D36, §7.2). */
export const revalidate = 60;

export async function GET() {
  return Response.json(await getCatalog());
}
