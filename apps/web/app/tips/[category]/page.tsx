import { toSlug } from '@llf/contracts';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs, type Crumb } from '@/components/Breadcrumbs';
import { CmsImage } from '@/components/CmsImage';
import { Heading } from '@/components/Heading';
import { JsonLd } from '@/components/JsonLd';
import { strings } from '@/content/strings';
import { getCategories, getCategory, requirePage } from '@/lib/cms';
import { resultsHref } from '@/lib/paths';
import { breadcrumbJsonLd, itemListJsonLd, pageMetadata } from '@/lib/seo';

interface Params {
  params: Promise<{ category: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getCategories()).map((category) => ({ category: category.slug }));
}

async function load({ params }: Params) {
  const { category: slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();
  return category;
}

export async function generateMetadata(props: Params): Promise<Metadata> {
  const category = await load(props);
  return pageMetadata({
    title: category.title,
    path: `/tips/${category.slug}/`,
    seo: category.seo,
    description: category.description,
  });
}

/**
 * Tips category page (Figma Category frames).
 * TODO(BD3244-26): the designed layout, tip cards, and the Tip Modal (BD3244-8).
 */
export default async function CategoryPage(props: Params) {
  const category = await load(props);
  const library = await requirePage('tips');
  const crumbs: Crumb[] = [
    { name: strings.breadcrumb.home, path: '/' },
    { name: library.title, path: '/tips/' },
    { name: category.title, path: `/tips/${category.slug}/` },
  ];
  const showIngredients = category.mode === 'Ingredients';
  const items = showIngredients
    ? (category.ingredients ?? []).map((ingredient) => ({
        key: ingredient.documentId,
        title: ingredient.title,
        image: ingredient.image,
        href: resultsHref([toSlug(ingredient.title)]),
        description: null,
      }))
    : (category.tips ?? []).map((tip) => ({
        key: tip.documentId,
        title: tip.title,
        image: null,
        href: null,
        description: tip.description ?? null,
      }));

  return (
    <div className="mx-auto flex max-w-page flex-col gap-lg px-gutter py-xl lg:px-gutter-lg">
      <Breadcrumbs items={crumbs} />
      <header className="flex flex-col gap-sm">
        <Heading as="h1" className="text-5xl">
          {category.title}
        </Heading>
        {category.description ? <p className="text-paragraph">{category.description}</p> : null}
      </header>
      <section aria-labelledby="category-items" className="flex flex-col gap-md">
        <Heading as="h2" id="category-items" className="text-3xl">
          {showIngredients ? strings.tips.ingredientsHeading : strings.tips.tipsHeading}
        </Heading>
        <ul className="grid gap-md md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.key} className="flex flex-col gap-xs rounded-sm border border-line p-md">
              <CmsImage media={item.image} className="aspect-square w-full object-cover" />
              <Heading as="h3" className="text-xl">
                {item.href ? (
                  <Link href={item.href} className="underline-offset-4 hover:underline">
                    {item.title}
                  </Link>
                ) : (
                  item.title
                )}
              </Heading>
              {item.description ? <p className="text-paragraph">{item.description}</p> : null}
            </li>
          ))}
        </ul>
      </section>
      <JsonLd data={[breadcrumbJsonLd(crumbs), itemListJsonLd(items.map((item) => item.title))]} />
    </div>
  );
}
