import Link from 'next/link';
import { strings } from '@/content/strings';
import { pageHref } from '@/lib/paths';

export interface Crumb {
  name: string;
  path: string;
}

/** Visible breadcrumb trail. The last crumb is the current page. Pair with `breadcrumbJsonLd`. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label={strings.breadcrumb.label} className="text-label">
      <ol className="flex flex-wrap gap-xs">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={item.path} className="flex gap-xs">
              {last ? (
                <span aria-current="page">{item.name}</span>
              ) : (
                <>
                  <Link href={pageHref(item.path)} className="underline underline-offset-4">
                    {item.name}
                  </Link>
                  <span aria-hidden="true">/</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
