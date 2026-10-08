// CloudFront Function (cloudfront-js-2.0), viewer request, site default cache behavior.
// Deployed as this single file: no exports, no other imports, no build step (TDD §6.2).
// Keep the rules in step with apps/web/lib/slash-redirect.mjs, the Phase A equivalent.
import cf from 'cloudfront';

const CANONICAL_HOST = 'longlivefood.org';
const RELEASE_KEY = 'current_release';
const RELEASE_ID = /^[A-Za-z0-9._-]+$/;

const kvs = cf.kvs();

function isRedirectHost(host) {
  return (
    host === 'www.' + CANONICAL_HOST ||
    host.startsWith('finishthefridge.') ||
    host.startsWith('www.finishthefridge.')
  );
}

// Rebuilds the query string. CloudFront hands over values still URL-encoded.
// The runtime has ES 5.1 statements plus let/const/async (no for...of).
function serializeQuery(querystring) {
  const parts = [];
  for (const key in querystring) {
    const entry = querystring[key];
    const values = entry.multiValue ? entry.multiValue : [entry];
    for (let i = 0; i < values.length; i++) {
      parts.push(key + '=' + values[i].value);
    }
  }
  return parts.length ? '?' + parts.join('&') : '';
}

function needsSlash(uri) {
  if (uri.endsWith('/')) return false;
  return !uri.slice(uri.lastIndexOf('/') + 1).includes('.');
}

function redirect(location) {
  return {
    statusCode: 301,
    statusDescription: 'Moved Permanently',
    headers: { location: { value: location } },
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function handler(event) {
  const request = event.request;
  // A leading `//` or `/\` in a Location header would point at another host.
  const uri = request.uri.replace(/^[/\\]+/, '/');

  // 1. The API has its own cache behavior; this is only a guard.
  if (uri === '/api' || uri.startsWith('/api/')) return request;

  // 2. Alternate hosts go to the canonical one, slash already fixed so there's one hop.
  const hostHeader = request.headers.host;
  const host = hostHeader ? hostHeader.value.toLowerCase() : '';
  if (isRedirectHost(host)) {
    const path = needsSlash(uri) ? uri + '/' : uri;
    return redirect('https://' + CANONICAL_HOST + path + serializeQuery(request.querystring));
  }

  // 3. Extensionless paths get the trailing slash. The query (`?i=`) must survive.
  if (needsSlash(uri)) return redirect(uri + '/' + serializeQuery(request.querystring));

  // 4. Directory index.
  const key = uri.endsWith('/') ? uri + 'index.html' : uri;

  // 5. Release prefix from the KeyValueStore. A missing or bad key is a broken deploy.
  let release;
  try {
    release = await kvs.get(RELEASE_KEY, { format: 'string' });
  } catch (_err) {
    release = '';
  }
  if (!RELEASE_ID.test(release)) {
    return { statusCode: 503, statusDescription: 'Service Unavailable' };
  }
  request.uri = '/releases/' + release + key;
  return request;
}
