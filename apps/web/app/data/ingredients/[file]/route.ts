import { getSluggedIngredients, toIngredientData } from '@/lib/data';

/**
 * One JSON file per ingredient for the results page (TDD D36, §6.2). Rendered on first request
 * and cached for the ISR window, so an ingredient added to the CMS needs no rebuild.
 */
export const revalidate = 60;

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const slug = file.replace(/\.json$/, '');
  const match = (await getSluggedIngredients()).find((item) => item.slug === slug);
  if (!match) return new Response(null, { status: 404 });
  return Response.json(toIngredientData(match));
}
