/**
 * Where to 301 a request so it lands on the trailing-slash URL, or null.
 *
 * Next's own `trailingSlash` redirect drops the query string, which would lose the `?i=` slugs on
 * /find-my-tips/results (Spike P3). `middleware.ts` issues the 301 itself with the query intact,
 * mirroring rule 3 of the CloudFront viewer-request function (TDD §6.2).
 *
 * @param url Request target (path and query), e.g. `/find-my-tips/results?i=banana,milk`.
 */
export function slashRedirect(url: string | undefined): string | null {
  if (!url) return null;
  const q = url.indexOf('?');
  const rawPath = q === -1 ? url : url.slice(0, q);
  const search = q === -1 ? '' : url.slice(q);
  // A leading `//` or `/\` would make the Location header point at another host.
  const path = rawPath.replace(/^[/\\]+/, '/');
  if (!path.startsWith('/') || path.endsWith('/')) return null;
  const last = path.slice(path.lastIndexOf('/') + 1);
  if (last.includes('.')) return null;
  return `${path}/${search}`;
}
