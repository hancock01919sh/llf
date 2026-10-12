import type { ExtractSource, InputType, ToolMode } from './find-tips';

/**
 * GA4 event map (TDD §8). Only slugs, enums, and counts: never search terms, ingredient text,
 * submitted URLs, or anything a model extracted.
 */

export const PAGE_TYPES = [
  'home',
  'tool',
  'results',
  'library',
  'category',
  'general_tips',
  'toolkit',
  'search',
  'about',
  'page',
] as const;
export type PageType = (typeof PAGE_TYPES)[number];

export const TOOL_ERROR_REASONS = [
  'rate_limited',
  'challenge',
  'timeout',
  'invalid_url',
  'too_large',
  'site_blocked',
  'server',
] as const;
export type ToolErrorReason = (typeof TOOL_ERROR_REASONS)[number];

export const TIP_ACTIONS = ['expand', 'share', 'copy', 'save', 'unsave'] as const;
export type TipAction = (typeof TIP_ACTIONS)[number];

export interface AnalyticsEvents {
  page_view: {
    page_location: string;
    page_path: string;
    page_type: PageType;
    content_id?: string;
  };
  module_view: {
    module_type: string;
    module_index: number;
    module_id: string;
    module_layout?: string;
    page_path: string;
  };
  cta_click: {
    cta_label: string;
    cta_href: string;
    cta_variant?: string;
    module_type?: string;
    module_index?: number;
  };
  site_search: { results_count: number; has_results: boolean };
  file_download: { file_name: string; content_id?: string };
  tips_tool_start: { input_type: InputType };
  tips_tool_submit: { input_type: InputType };
  tips_tool_result: {
    input_type: InputType;
    source: ExtractSource;
    ingredients_matched: number;
    unmatched_count: number;
    tips_shown: number;
    latency_ms: number;
    catalog_version: string;
  };
  tips_tool_no_match: { input_type: InputType; readable: boolean };
  tips_tool_unavailable: { mode: Exclude<ToolMode, 'live'> };
  tips_tool_error: { input_type: InputType; reason: ToolErrorReason };
  tip_view: { tip_slug: string; ingredient_slug?: string };
  tip_interaction: { tip_slug: string; action: TipAction };
}

export type AnalyticsEventName = keyof AnalyticsEvents;

export type DataLayerEvent = {
  [K in AnalyticsEventName]: { event: K } & AnalyticsEvents[K];
}[AnalyticsEventName];

/** Query parameters allowed through to `page_location`. Everything else, and the fragment, is dropped. */
export const PAGE_LOCATION_ALLOWED_PARAMS = ['i', 'gclid'] as const;
export const PAGE_LOCATION_ALLOWED_PREFIXES = ['utm_'] as const;

const isAllowedParam = (key: string) =>
  (PAGE_LOCATION_ALLOWED_PARAMS as readonly string[]).includes(key) ||
  PAGE_LOCATION_ALLOWED_PREFIXES.some((prefix) => key.startsWith(prefix));

/** Origin + path + allow-listed params. Never send an unsanitized URL to GA4 (TDD §8). */
export function sanitizePageLocation(href: string): string {
  const url = new URL(href);
  const kept = new URLSearchParams();
  for (const [key, value] of url.searchParams) {
    if (isAllowedParam(key)) kept.append(key, value);
  }
  const query = kept.toString();
  return `${url.origin}${url.pathname}${query ? `?${query}` : ''}`;
}
