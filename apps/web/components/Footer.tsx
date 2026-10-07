import { format, strings } from '@/content/strings';

/**
 * Site footer (shell UI, D22).
 * TODO(BD3244-8): link groups, legal text, and social links from Global; "Manage Preferences" (OPEN-18).
 */
export function Footer() {
  return (
    <footer
      data-surface="forest"
      aria-label={strings.footer.label}
      className="px-gutter py-xl lg:px-gutter-lg"
    >
      <div className="mx-auto max-w-page">
        <p className="text-fg-muted">
          {format(strings.footer.copyright, { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
