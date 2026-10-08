import type { IMAGE_MIME_TYPES } from '@llf/contracts/find-tips';

type ImageMime = (typeof IMAGE_MIME_TYPES)[number];

/** Base64 alphabet only (standard or URL-safe), optional padding. */
const BASE64 = /^[A-Za-z0-9+/_-]+={0,2}$/;

/** Decoded bytes the client may send: 1600 px JPEG at q0.8 is far below this. */
export const IMAGE_MAX_BYTES = 3 * 1024 * 1024;

export function sniffImage(bytes: Uint8Array): ImageMime | null {
  const at = (i: number) => bytes[i] ?? -1;
  if (at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff) return 'image/jpeg';
  if (at(0) === 0x89 && at(1) === 0x50 && at(2) === 0x4e && at(3) === 0x47) return 'image/png';
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));
  if (bytes.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  return null;
}

export type DecodedImage =
  | { ok: true; bytes: Uint8Array; mimeType: ImageMime }
  | { ok: false; reason: 'invalid' | 'too_large' | 'unsupported' };

/**
 * Decodes and checks an uploaded image (TDD §7.3). The bytes stay in memory
 * and are never written or logged. The declared MIME type must match the
 * magic bytes.
 */
export function decodeImage(base64: string, declared: ImageMime): DecodedImage {
  const stripped = base64.replace(/^data:[^;,]+;base64,/, '').replace(/\s+/g, '');
  if (!stripped || !BASE64.test(stripped)) return { ok: false, reason: 'invalid' };
  if (Math.floor((stripped.length * 3) / 4) > IMAGE_MAX_BYTES + 3) {
    return { ok: false, reason: 'too_large' };
  }
  const bytes = new Uint8Array(Buffer.from(stripped, 'base64'));
  if (bytes.length === 0) return { ok: false, reason: 'invalid' };
  if (bytes.length > IMAGE_MAX_BYTES) return { ok: false, reason: 'too_large' };
  const sniffed = sniffImage(bytes);
  if (!sniffed || sniffed !== declared) return { ok: false, reason: 'unsupported' };
  return { ok: true, bytes, mimeType: sniffed };
}
