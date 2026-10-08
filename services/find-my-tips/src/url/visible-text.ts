import { decodeEntities } from './entities';

export const VISIBLE_TEXT_MAX = 15_000;

const HIDDEN_BLOCKS =
  /<(script|style|noscript|template|svg|iframe|head|nav|footer|form)\b[\s\S]*?<\/\1\s*>/gi;
const COMMENTS = /<!--[\s\S]*?-->/g;
const BLOCK_TAGS =
  /<\/?(p|div|li|ul|ol|br|h[1-6]|tr|td|th|section|article|header|main|table|dd|dt)\b[^>]*>/gi;

function region(html: string, tag: string): string | undefined {
  const match = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}\\s*>`, 'i').exec(html);
  return match?.[1];
}

/**
 * Plain text of the page's main content (`<main>`, else `<article>`, else
 * `<body>`), with scripts, styles, and navigation removed, capped at `max`
 * characters. Used only as model input when a page has no Recipe JSON-LD.
 */
export function visibleText(html: string, max = VISIBLE_TEXT_MAX): string {
  const withoutComments = html.replace(COMMENTS, ' ');
  const source =
    region(withoutComments, 'main') ??
    region(withoutComments, 'article') ??
    region(withoutComments, 'body') ??
    withoutComments;
  const text = decodeEntities(
    source
      .replace(HIDDEN_BLOCKS, ' ')
      .replace(BLOCK_TAGS, '\n')
      .replace(/<[^>]*>/g, ' '),
  )
    .replace(/[ \t\f\v\u00a0]+/g, ' ')
    .replace(/ *\n[\n ]*/g, '\n')
    .trim();
  return text.length > max ? text.slice(0, max) : text;
}
