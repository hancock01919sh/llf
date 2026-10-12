import { z } from 'zod';

/**
 * Find My Tips API contract (TDD §7.3).
 * The response carries catalog slugs and CMS titles only, never model text (AGENTS.md, TDD D21).
 */

export const INPUT_TYPES = ['url', 'image', 'text'] as const;
export const InputType = z.enum(INPUT_TYPES);
export type InputType = z.infer<typeof InputType>;

export const URL_MAX_LENGTH = 2048;
export const TEXT_MAX_LENGTH = 5000;
/** Request body cap for the tool API. A resized image is ~300–800 KB; base64 adds ~33%. */
export const BODY_MAX_BYTES = 4 * 1024 * 1024;
export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
/** The browser resizes photos to this longest edge and re-encodes them as JPEG before upload (TDD §7.6). */
export const IMAGE_MAX_DIMENSION = 1600;
export const IMAGE_JPEG_QUALITY = 0.8;

/** Tool API routes, same-origin behind the CDN (TDD §7.3). */
export const FIND_TIPS_API = {
  status: '/api/find-tips/status',
  extract: '/api/find-tips/extract',
} as const;

export const ExtractRequest = z.discriminatedUnion('inputType', [
  z.object({
    inputType: z.literal('url'),
    url: z.string().trim().min(1).max(URL_MAX_LENGTH),
  }),
  z.object({
    inputType: z.literal('image'),
    imageBase64: z.string().min(1),
    mimeType: z.enum(IMAGE_MIME_TYPES),
  }),
  z.object({
    inputType: z.literal('text'),
    text: z.string().trim().min(1).max(TEXT_MAX_LENGTH),
  }),
]);
export type ExtractRequest = z.infer<typeof ExtractRequest>;

export const DETECTED_TYPES = [
  'recipe',
  'receipt',
  'shopping_list',
  'dish',
  'fridge_photo',
  'unknown',
] as const;
export const DetectedType = z.enum(DETECTED_TYPES);
export type DetectedType = z.infer<typeof DetectedType>;

export const ExtractSource = z.enum(['jsonld', 'model', 'cache']);
export type ExtractSource = z.infer<typeof ExtractSource>;

export const IngredientMatch = z.object({
  slug: z.string().min(1),
  /** Catalog title from the CMS, never from the model. */
  title: z.string().min(1),
  /** True when a dish photo implies the ingredient (FR-3); shown as "likely". */
  inferred: z.boolean(),
});
export type IngredientMatch = z.infer<typeof IngredientMatch>;

export const ExtractResponse = z.object({
  requestId: z.string().min(1),
  detectedType: DetectedType,
  readable: z.boolean(),
  matches: z.array(IngredientMatch),
  /** A count only, never the raw strings. */
  unmatchedCount: z.number().int().nonnegative(),
  source: ExtractSource,
  catalogVersion: z.string().min(1),
});
export type ExtractResponse = z.infer<typeof ExtractResponse>;

export const ToolMode = z.enum(['live', 'jsonld-only', 'off']);
export type ToolMode = z.infer<typeof ToolMode>;

export const StatusResponse = z.object({
  mode: ToolMode,
  catalogVersion: z.string().min(1),
});
export type StatusResponse = z.infer<typeof StatusResponse>;

export const ERROR_CODES = [
  'invalid_request',
  'too_large',
  'unsupported_media_type',
  'url_not_allowed',
  'rate_limited',
  'unavailable',
  'upstream_error',
  'source_unavailable',
  'timeout',
  'not_found',
  'method_not_allowed',
  'server',
] as const;
export const ErrorCode = z.enum(ERROR_CODES);
export type ErrorCode = z.infer<typeof ErrorCode>;

/** Error body. `code` maps to a Tool Copy state in the UI; there is no free-text message. */
export const ErrorResponse = z.object({
  requestId: z.string().min(1),
  code: ErrorCode,
});
export type ErrorResponse = z.infer<typeof ErrorResponse>;

/**
 * What a provider adapter must return (TDD §7.4). Validated with Zod before use.
 * The JSON schema sent to providers mirrors this: every field required, no oneOf, maxItems 60.
 */
export const EXTRACTION_MAX_ITEMS = 60;
export const ExtractedItem = z.object({
  term: z.string().trim().min(1).max(200),
  isFood: z.boolean(),
  inferred: z.boolean(),
});
export type ExtractedItem = z.infer<typeof ExtractedItem>;

export const ExtractionResult = z.object({
  readable: z.boolean(),
  detectedType: DetectedType,
  items: z.array(ExtractedItem).max(EXTRACTION_MAX_ITEMS),
});
export type ExtractionResult = z.infer<typeof ExtractionResult>;

/** Portable JSON schema for the forced `report_ingredients` tool call (Anthropic, OpenAI, Bedrock). */
export const REPORT_INGREDIENTS_TOOL = {
  name: 'report_ingredients',
  description: 'Report the food ingredients found in the input.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['readable', 'detectedType', 'items'],
    properties: {
      readable: { type: 'boolean' },
      detectedType: { type: 'string', enum: [...DETECTED_TYPES] },
      items: {
        type: 'array',
        maxItems: EXTRACTION_MAX_ITEMS,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['term', 'isFood', 'inferred'],
          properties: {
            term: { type: 'string' },
            isFood: { type: 'boolean' },
            inferred: { type: 'boolean' },
          },
        },
      },
    },
  },
} as const;
