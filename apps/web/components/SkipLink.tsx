import { strings } from '@/content/strings';

export const MAIN_ID = 'main';

/** First focusable element on every page (TDD §6.6). Visible on focus only. */
export function SkipLink() {
  return (
    <a
      href={`#${MAIN_ID}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-xs focus:left-xs focus:z-50 focus:rounded-pill focus:bg-interactive focus:px-md focus:py-xs focus:text-on-interactive"
    >
      {strings.skipLink}
    </a>
  );
}
