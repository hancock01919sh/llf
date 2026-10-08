/**
 * Where to 301 a request so it lands on the static export's trailing-slash URL, or null.
 *
 * serve-handler's own trailingSlash redirect drops the query string, which would lose the
 * `?i=` slugs on /find-my-tips/results (Spike P3). This keeps the query and mirrors rule 3 of
 * the CloudFront viewer-request function (TDD §6.2).
 *
 * @param {string | undefined} url Request target as it arrives on `req.url` (path and query).
 * @returns {string | null}
 */
export function slashRedirect(url) {
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
