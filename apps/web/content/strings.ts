import { z } from 'zod';

/**
 * Short UI strings: labels, hints, aria text, and the 404 page (TDD D21, §6.4).
 * Content, Tool Copy, and long-form text come from Strapi instead. Edit values freely, but keep keys
 * stable: components reference them, and copy-change PRs only touch this folder (AGENTS.md).
 * `{name}` placeholders are filled by `format()`.
 */
const text = z.string().min(1);

const SiteStrings = z.object({
  site: z.object({ name: text }),
  skipLink: text,
  nav: z.object({
    label: text,
    home: text,
    tips: text,
    findMyTips: text,
    search: text,
  }),
  footer: z.object({ label: text, copyright: text }),
  breadcrumb: z.object({ label: text, home: text }),
  carousel: z.object({ previous: text, next: text, slide: text }),
  search: z.object({
    label: text,
    placeholder: text,
    submit: text,
    pageTitle: text,
    loading: text,
    empty: text,
    resultsCount: text,
    noResults: text,
    unavailable: text,
  }),
  tips: z.object({
    pageTitle: text,
    ingredientsHeading: text,
    tipsHeading: text,
  }),
  // TODO(BD3244-11): move tool-state copy to the Tool Copy single type once it exists (TDD §5.2, §7).
  tool: z.object({
    pageTitle: text,
    urlHint: text,
    uploadHint: text,
    tabs: z.object({ url: text, image: text, text: text }),
    chooseFile: text,
    fileChosen: text,
    submitting: text,
    unavailable: text,
    jsonldOnly: text,
    noMatch: text,
    unreadable: text,
    error: text,
    rateLimited: text,
    invalidUrl: text,
    tooLarge: text,
    checking: text,
    tabsLabel: text,
    textLabel: text,
    textHint: text,
    cancel: text,
    stillWorking: text,
    retry: text,
    partial: text,
    likely: text,
    remove: text,
    seeTips: text,
    browseTips: text,
    searchSite: text,
    unsupportedFile: text,
    required: text,
    challenge: text,
    siteBlocked: text,
    timeout: text,
    retryIn: text,
    startOver: text,
  }),
  results: z.object({
    pageTitle: text,
    heading: text,
    loading: text,
    empty: text,
    error: text,
    startOver: text,
    tipsFor: text,
    wasted: text,
    count: text,
    noTips: text,
  }),
  notFound: z.object({ title: text, body: text, home: text }),
  home: z.object({ featuredTitle: text }),
  global: z.object({
    download: text,
  }),
  toolkit: z.object({
    download: text,
    filetype: text,
    filename: text,
  }),
});
export type SiteStrings = z.infer<typeof SiteStrings>;

export const strings: SiteStrings = SiteStrings.parse({
  site: { name: 'Long Live Food' },
  skipLink: 'Skip to main content',
  nav: {
    label: 'Main',
    home: 'Long Live Food home',
    tips: 'Tips',
    findMyTips: 'Find My Tips',
    search: 'Search',
  },
  footer: { label: 'Footer', copyright: '© {year} Ad Council' },
  breadcrumb: { label: 'Breadcrumb', home: 'Home' },
  carousel: { previous: 'Previous', next: 'Next', slide: '{index} of {total}' },
  search: {
    label: 'Search the site',
    placeholder: 'Search tips and ingredients',
    submit: 'Search',
    pageTitle: 'Search',
    loading: 'Loading search…',
    empty: 'Type a word to search tips and ingredients.',
    resultsCount: '{count} results',
    noResults: 'No results. Try another word.',
    unavailable: 'Search is unavailable right now. Please try again later.',
  },
  tips: {
    pageTitle: 'Tips',
    ingredientsHeading: 'Ingredients',
    tipsHeading: 'Tips',
  },
  tool: {
    pageTitle: 'Find My Tips',
    urlHint: 'Paste a link to a recipe page.',
    uploadHint: 'A JPEG, PNG, or WebP photo of a recipe, receipt, list, or dish.',
    tabs: { url: 'Link', image: 'Photo', text: 'Type it' },
    chooseFile: 'Choose a photo',
    fileChosen: 'Selected: {name}',
    submitting: 'Finding your tips…',
    unavailable: 'Find My Tips is taking a break. Browse all tips instead.',
    jsonldOnly: 'Right now we can only read recipe links.',
    noMatch: "We couldn't find any ingredients we have tips for.",
    unreadable: "We couldn't read that. Try a clearer photo or another link.",
    error: 'Something went wrong. Please try again.',
    rateLimited: "You're going a bit fast. Please wait a moment and try again.",
    invalidUrl: "That link doesn't look right. Check it and try again.",
    tooLarge: "That's too big for us to read. Try a smaller photo or shorter list.",
    checking: 'Getting Find My Tips ready…',
    tabsLabel: 'How do you want to share your recipe?',
    textLabel: 'Type your ingredients',
    textHint: 'One per line or separated by commas.',
    cancel: 'Cancel',
    stillWorking: 'Still working. Thanks for waiting.',
    retry: 'Try again',
    partial: 'We found tips for {matched} of your {total} items.',
    likely: "We think these are in your recipe. Remove any that aren't.",
    remove: 'Remove {title}',
    seeTips: 'See my tips',
    browseTips: 'Browse all tips',
    searchSite: 'Search the site',
    unsupportedFile: 'Use a JPEG, PNG, or WebP image.',
    required: 'Add a link, photo, or list first.',
    siteBlocked:
      "That recipe site won't let us read it. Paste the ingredient list or upload a photo instead.",
    challenge: "We couldn't confirm you're human. Reload the page and try again.",
    timeout: 'That took too long. Please try again.',
    retryIn: 'You can try again in {seconds} seconds.',
    startOver: 'Start over',
  },
  results: {
    pageTitle: 'Your tips',
    heading: 'Your tips',
    loading: 'Loading your tips…',
    empty: 'No ingredients to show yet.',
    error: "We couldn't load these tips. Please try again.",
    startOver: 'Start over',
    tipsFor: 'Tips for {title}',
    wasted: 'Waste level {level} of 5',
    count: '{ingredients} ingredients, {tips} tips',
    noTips: 'No tips for this ingredient yet.',
  },
  notFound: {
    title: 'Oops. We dropped the beet.',
    body: '404 — Page not found',
    home: 'Go to the home page',
  },
  home: { featuredTitle: 'Browse by category' },
  global:{
    download: 'Download',
  },
  toolkit:{
    download: 'Download',
    filetype: 'File type',
    filename: 'File name',
  }
});

/** Fills `{name}` placeholders. Unknown placeholders are left as-is so missing values show up in review. */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
