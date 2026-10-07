import Link from 'next/link';
import { strings } from '@/content/strings';

const NAV = [
  { href: '/tips/', label: strings.nav.tips },
  { href: '/find-my-tips/', label: strings.nav.findMyTips },
  { href: '/search/', label: strings.nav.search },
] as const;

/**
 * Site header (shell UI, TDD §6.4 / D22).
 * TODO(BD3244-8): nav links from Global, the search popover (§6.5), and the mobile menu.
 */
export function Header() {
  return (
    <header data-surface="paper" className="border-b border-line px-gutter lg:px-gutter-lg">
      <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-md py-sm">
        <Link href="/" className="font-display text-2xl uppercase">
          {strings.site.name}
        </Link>
        <nav aria-label={strings.nav.label}>
          <ul className="flex flex-wrap gap-md text-label font-semibold">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="underline-offset-4 hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
