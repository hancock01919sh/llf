import { decodeEntities } from './entities';

const SCRIPT_RE = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
const LD_TYPE_RE = /\btype\s*=\s*["']?\s*application\/ld\+json\b/i;
const MAX_DEPTH = 8;

function isRecipeType(type: unknown): boolean {
  const matches = (value: unknown) =>
    typeof value === 'string' && /(^|[/#:])recipe$/i.test(value.trim());
  return Array.isArray(type) ? type.some(matches) : matches(type);
}

function toLines(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(toLines);
  if (value && typeof value === 'object') {
    const text = (value as Record<string, unknown>).text ?? (value as Record<string, unknown>).name;
    return typeof text === 'string' ? [text] : [];
  }
  return [];
}

function collect(node: unknown, out: string[], depth: number): void {
  if (depth > MAX_DEPTH || node === null || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) collect(item, out, depth + 1);
    return;
  }
  const record = node as Record<string, unknown>;
  if (isRecipeType(record['@type'])) {
    const lines = toLines(record.recipeIngredient ?? record.ingredients);
    for (const line of lines) {
      const clean = decodeEntities(line.replace(/<[^>]*>/g, ' '))
        .replace(/\s+/g, ' ')
        .trim();
      if (clean) out.push(clean);
    }
  }
  for (const [key, value] of Object.entries(record)) {
    if (key === 'recipeIngredient' || key === 'ingredients') continue;
    if (value && typeof value === 'object') collect(value, out, depth + 1);
  }
}

function parseJson(raw: string): unknown {
  const text = raw.trim().replace(/^<!--/, '').replace(/-->$/, '').trim();
  try {
    return JSON.parse(text);
  } catch {
    // Some CMSs emit raw control characters inside strings; retry once without them.
    try {
      // eslint-disable-next-line no-control-regex -- stripping control chars is the point
      return JSON.parse(text.replace(/[\u0000-\u001f]+/g, ' '));
    } catch {
      return undefined;
    }
  }
}

/**
 * Reads schema.org Recipe `recipeIngredient` lines from every JSON-LD block
 * in the page (handles `@graph`, `@type` arrays, and nested objects).
 * Returns null when the page has no Recipe with ingredients.
 */
export function extractRecipeIngredients(html: string): string[] | null {
  const lines: string[] = [];
  for (const match of html.matchAll(SCRIPT_RE)) {
    const [, attributes = '', body = ''] = match;
    if (!LD_TYPE_RE.test(attributes)) continue;
    collect(parseJson(body), lines, 0);
  }
  const unique = [...new Set(lines)];
  return unique.length > 0 ? unique : null;
}
