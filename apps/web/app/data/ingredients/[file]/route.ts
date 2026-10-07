import { getSluggedIngredients, toIngredientData } from '@/lib/data';

/** One JSON file per ingredient for the results page (TDD §6.2). */
export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getSluggedIngredients()).map(({ slug }) => ({ file: `${slug}.json` }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const slug = file.replace(/\.json$/, '');
  const match = (await getSluggedIngredients()).find((item) => item.slug === slug);
  if (!match) return new Response(null, { status: 404 });
  return Response.json(toIngredientData(match));
}
