import type { Metadata } from 'next';
import Link from 'next/link';
import { strings } from '@/content/strings';

export const metadata: Metadata = {
  title: strings.notFound.title,
  robots: { index: false, follow: false },
};

/** The 404 page is a site string, not CMS content (TDD D21). */
export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-page flex-col items-start gap-md px-gutter py-2xl lg:px-gutter-lg">
      <h1 className="font-display text-5xl uppercase">{strings.notFound.title}</h1>
      <p className="text-paragraph">{strings.notFound.body}</p>
      <Link
        href="/"
        className="rounded-pill bg-interactive px-md py-xs font-semibold text-on-interactive hover:bg-interactive-hover"
      >
        {strings.notFound.home}
      </Link>
    </div>
  );
}
