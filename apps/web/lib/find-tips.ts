import { z } from 'zod';
import {
  ErrorResponse,
  ExtractResponse,
  ExtractSource,
  FIND_TIPS_API,
  RESULTS_MAX_SLUGS,
  IMAGE_JPEG_QUALITY,
  IMAGE_MIME_TYPES,
  IMAGE_MAX_DIMENSION,
  StatusResponse,
  TEXT_MAX_LENGTH,
  URL_MAX_LENGTH,
  InputType,
  type ExtractRequest,
  type IngredientMatch,
  type ToolMode,
} from '@llf/contracts';
import type { ToolErrorReason } from '@llf/contracts/analytics';

/**
 * Client helpers for the Find My Tips block (TDD §7.3, §7.10). Pure where possible so the state
 * mapping is unit-tested without a browser.
 */

export type InputProblem = 'invalidUrl' | 'unsupportedFile' | 'tooLarge' | 'empty';

export function validateUrl(value: string): InputProblem | null {
  const trimmed = value.trim();
  if (!trimmed) return 'empty';
  if (trimmed.length > URL_MAX_LENGTH) return 'invalidUrl';
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:' ? null : 'invalidUrl';
  } catch {
    return 'invalidUrl';
  }
}

export function validateText(value: string): InputProblem | null {
  const trimmed = value.trim();
  if (!trimmed) return 'empty';
  return trimmed.length > TEXT_MAX_LENGTH ? 'tooLarge' : null;
}

/** Original photo size before the browser resizes it. Phone photos are usually 2–12 MB. */
export const IMAGE_UPLOAD_MAX_BYTES = 25 * 1024 * 1024;

/** iOS Safari converts HEIC to JPEG when the input only accepts these types. */
export const IMAGE_ACCEPT = IMAGE_MIME_TYPES.join(',');

export function validateFile(file: File | null | undefined): InputProblem | null {
  if (!file) return 'empty';
  if (!(IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) return 'unsupportedFile';
  return file.size > IMAGE_UPLOAD_MAX_BYTES ? 'tooLarge' : null;
}

export type Outcome =
  | { kind: 'result'; response: ExtractResponse }
  | { kind: 'unavailable' }
  | { kind: 'rateLimited'; retryAfterMs: number }
  | { kind: 'invalidUrl' }
  | { kind: 'tooLarge' }
  | { kind: 'unsupportedFile' }
  | { kind: 'error'; reason: ToolErrorReason; retryable: boolean };

const DEFAULT_RETRY_AFTER_MS = 30_000;

function retryAfter(headers: Headers): number {
  const seconds = Number(headers.get('retry-after'));
  return Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds, 300) * 1000 : DEFAULT_RETRY_AFTER_MS;
}

/** Maps an HTTP response from `/extract` to a UI outcome (TDD §7.3 status table). */
export function classifyResponse(status: number, body: unknown, headers: Headers): Outcome {
  if (status === 200) {
    const parsed = ExtractResponse.safeParse(body);
    return parsed.success
      ? { kind: 'result', response: parsed.data }
      : { kind: 'error', reason: 'server', retryable: true };
  }
  // AWS WAF challenge or CAPTCHA (TDD §7.6). TODO(BD3244-10): load the WAF JS integration and retry.
  if (status === 202 || status === 405 || headers.get('x-amzn-waf-action')) {
    return { kind: 'error', reason: 'challenge', retryable: false };
  }
  if (status === 429) return { kind: 'rateLimited', retryAfterMs: retryAfter(headers) };
  if (status === 503) return { kind: 'unavailable' };
  if (status === 413) return { kind: 'tooLarge' };
  if (status === 415) return { kind: 'unsupportedFile' };
  if (status === 422) return { kind: 'invalidUrl' };
  const code = ErrorResponse.safeParse(body).data?.code;
  if (status === 400) return code === 'url_not_allowed' ? { kind: 'invalidUrl' } : { kind: 'error', reason: 'server', retryable: false };
  if (status === 504 || code === 'timeout') return { kind: 'error', reason: 'timeout', retryable: true };
  return { kind: 'error', reason: 'server', retryable: status >= 500 };
}

export function parseStatus(status: number, body: unknown): ToolMode {
  if (status !== 200) return 'off';
  return StatusResponse.safeParse(body).data?.mode ?? 'off';
}

/** `tips_tool_error.reason` for an outcome, or null when it isn't an error (TDD §8). */
export function errorReason(outcome: Outcome): ToolErrorReason | null {
  switch (outcome.kind) {
    case 'result':
    case 'unavailable':
      return null;
    case 'rateLimited':
      return 'rate_limited';
    case 'invalidUrl':
      return 'invalid_url';
    case 'tooLarge':
      return 'too_large';
    case 'unsupportedFile':
      // The browser re-encodes photos as JPEG, so a 415 means a client or server bug.
      return 'server';
    case 'error':
      return outcome.reason;
  }
}

/** Handler budget is 25 s and API Gateway cuts off near 30 s (TDD §7.6); the client gives up after that. */
export const CLIENT_TIMEOUT_MS = 35_000;
export const STILL_WORKING_MS = 10_000;
const AUTO_RETRY_STATUSES = new Set([502, 504]);

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

export async function fetchToolMode(fetcher: Fetcher = fetch): Promise<ToolMode> {
  try {
    const response = await fetcher(FIND_TIPS_API.status, { cache: 'no-store' });
    return parseStatus(response.status, await response.json().catch(() => null));
  } catch {
    return 'off';
  }
}

/**
 * POSTs to `/extract` and classifies the response. Retries once, silently, on 502/504 (TDD §7.6).
 * Rethrows when `signal` aborts so the caller can tell a cancel or timeout from a failure.
 */
export async function requestExtract(
  body: ExtractRequest,
  signal: AbortSignal,
  fetcher: Fetcher = fetch,
): Promise<Outcome> {
  for (let attempt = 0; ; attempt += 1) {
    let response: Response;
    try {
      response = await fetcher(FIND_TIPS_API.extract, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'same-origin',
        signal,
      });
    } catch (error) {
      if (signal.aborted) throw error;
      return { kind: 'error', reason: 'server', retryable: true };
    }
    if (attempt === 0 && AUTO_RETRY_STATUSES.has(response.status)) continue;
    const json: unknown = await response.json().catch(() => null);
    return classifyResponse(response.status, json, response.headers);
  }
}

export type ResultView =
  | { kind: 'unreadable' }
  | { kind: 'noMatch' }
  | { kind: 'likely'; confirmed: IngredientMatch[]; likely: IngredientMatch[] }
  | { kind: 'navigate'; slugs: string[] };

/** What to show for a 200 response (TDD §7.10). Partial matches navigate; the results page shows the note. */
export function resultView(response: ExtractResponse): ResultView {
  if (!response.readable) return { kind: 'unreadable' };
  if (response.matches.length === 0) return { kind: 'noMatch' };
  const likely = response.matches.filter((match) => match.inferred);
  const confirmed = response.matches.filter((match) => !match.inferred);
  if (likely.length > 0) return { kind: 'likely', confirmed, likely };
  return { kind: 'navigate', slugs: uniqueSlugs(confirmed) };
}

/** Deduped, capped at the results page's limit (TDD §6.1). */
export function uniqueSlugs(matches: IngredientMatch[]): string[] {
  return [...new Set(matches.map((match) => match.slug))].slice(0, RESULTS_MAX_SLUGS);
}

/** Resizes a photo to ≤ 1600 px on the longest edge and re-encodes it as JPEG (TDD §7.6). */
export async function toJpegBase64(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, IMAGE_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('canvas unavailable');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', IMAGE_JPEG_QUALITY),
  );
  if (!blob) throw new Error('encode failed');
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsDataURL(blob);
  });
  return dataUrl.slice(dataUrl.indexOf(',') + 1);
}

/**
 * What the tool hands to the results page so it can show the partial-match note and send
 * `tips_tool_result` once tips are counted. Counts and enums only, never user input (TDD D20).
 */
const ToolHandoff = z.object({
  inputType: InputType,
  source: ExtractSource,
  unmatchedCount: z.number().int().nonnegative(),
  latencyMs: z.number().nonnegative(),
  catalogVersion: z.string(),
});
export type ToolHandoff = z.infer<typeof ToolHandoff>;

const HANDOFF_KEY = 'llf:find-tips-result';

export function saveHandoff(handoff: ToolHandoff): void {
  try {
    sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(handoff));
  } catch {
    // Storage can be blocked; the results page still works without the handoff.
  }
}

/** Reads and clears the handoff, so a reload or a shared link doesn't repeat the event. */
export function takeHandoff(): ToolHandoff | null {
  try {
    const raw = sessionStorage.getItem(HANDOFF_KEY);
    sessionStorage.removeItem(HANDOFF_KEY);
    return raw ? (ToolHandoff.safeParse(JSON.parse(raw)).data ?? null) : null;
  } catch {
    return null;
  }
}
