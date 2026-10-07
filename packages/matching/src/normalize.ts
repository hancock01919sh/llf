/** Leading measure words removed after quantities ("2 cups of milk" → "milk"). */
const UNITS = new Set([
  'bag',
  'bags',
  'bottle',
  'bottles',
  'box',
  'boxes',
  'bunch',
  'bunches',
  'c',
  'can',
  'cans',
  'carton',
  'cartons',
  'clove',
  'cloves',
  'container',
  'containers',
  'cup',
  'cups',
  'dash',
  'dashes',
  'dozen',
  'g',
  'gal',
  'gallon',
  'gallons',
  'gram',
  'grams',
  'handful',
  'handfuls',
  'head',
  'heads',
  'jar',
  'jars',
  'kg',
  'kilogram',
  'kilograms',
  'l',
  'lb',
  'lbs',
  'liter',
  'liters',
  'litre',
  'litres',
  'loaf',
  'ml',
  'ounce',
  'ounces',
  'oz',
  'package',
  'packages',
  'packet',
  'packets',
  'piece',
  'pieces',
  'pinch',
  'pinches',
  'pint',
  'pints',
  'pkg',
  'pound',
  'pounds',
  'qt',
  'quart',
  'quarts',
  'slice',
  'slices',
  'sprig',
  'sprigs',
  'stalk',
  'stalks',
  'stick',
  'sticks',
  't',
  'tablespoon',
  'tablespoons',
  'tbsp',
  'tbs',
  'teaspoon',
  'teaspoons',
  'tsp',
  'x',
  'of',
]);

/** Retail and packaging noise that is never part of an ingredient name. */
const NOISE = new Set(['brand', 'ct', 'count', 'pk', 'pack']);

/** Plurals the suffix rules would get wrong. */
const IRREGULAR: Record<string, string> = {
  calves: 'calf',
  halves: 'half',
  knives: 'knife',
  leaves: 'leaf',
  loaves: 'loaf',
  geese: 'goose',
  mice: 'mouse',
};

/** Words that end in s but aren't plural. */
const INVARIANT = new Set([
  'asparagus',
  'citrus',
  'couscous',
  'hummus',
  'molasses',
  'swiss',
  'brussels',
  'grits',
  'oats',
  'series',
  'species',
  'chips',
]);

export function singularize(word: string): string {
  if (word.length < 3 || INVARIANT.has(word)) return word;
  const irregular = IRREGULAR[word];
  if (irregular) return irregular;
  if (word.endsWith('ies') && word.length > 4) return `${word.slice(0, -3)}y`;
  if (word.endsWith('oes')) return word.slice(0, -2);
  if (/(?:ch|sh|x|z)es$/.test(word)) return word.slice(0, -2);
  if (/(?:ss|us|is)$/.test(word)) return word;
  if (word.endsWith('s')) return word.slice(0, -1);
  return word;
}

/**
 * normalize(term): lowercase → NFKD accent fold → strip quantities/units/brand noise
 * → singularize → collapse whitespace (TDD §7.5). Pure and deterministic.
 */
export function normalize(term: string): string {
  let s = term.replace(/[™®©]/g, ' ').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
  s = s.replace(/\([^)]*\)/g, ' ').replace(/\[[^\]]*\]/g, ' ');
  // A recipe line's name comes before the first comma ("2 cloves garlic, minced").
  s = s.split(',')[0] ?? '';
  s = s.replace(/&/g, ' and ');
  // Quantities: digits, decimals, fractions (NFKD turns ½ into 1⁄2), ranges.
  s = s.replace(/[\d\u2044/.\-–—]+/g, ' ');
  s = s.replace(/[^a-z\s]/g, ' ');

  const tokens = s.split(/\s+/).filter((t) => t && !NOISE.has(t));
  while (tokens.length > 1 && UNITS.has(tokens[0] as string)) tokens.shift();
  return tokens.map(singularize).join(' ');
}

export function tokens(normalized: string): string[] {
  return normalized ? normalized.split(' ') : [];
}
