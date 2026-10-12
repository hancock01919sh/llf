import { describe, expect, it } from 'vitest';

import sharp from 'sharp';

import {
  IMAGE_MAX_BYTES,
  IMAGE_MAX_PIXELS,
  decodeImage,
  downscaleImage,
  sniffImage,
} from './image';

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP = new Uint8Array([
  ...new TextEncoder().encode('RIFF'),
  0,
  0,
  0,
  0,
  ...new TextEncoder().encode('WEBP'),
]);

const b64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64');

describe('sniffImage', () => {
  it('recognises JPEG, PNG and WebP magic bytes', () => {
    expect(sniffImage(JPEG)).toBe('image/jpeg');
    expect(sniffImage(PNG)).toBe('image/png');
    expect(sniffImage(WEBP)).toBe('image/webp');
  });

  it('rejects unknown or truncated bytes', () => {
    expect(sniffImage(new TextEncoder().encode('GIF89a'))).toBeNull();
    expect(sniffImage(WEBP.slice(0, 8))).toBeNull();
    expect(sniffImage(new Uint8Array())).toBeNull();
  });
});

describe('decodeImage', () => {
  it('decodes base64 whose bytes match the declared type', () => {
    const result = decodeImage(b64(PNG), 'image/png');
    expect(result).toEqual({ ok: true, bytes: PNG, mimeType: 'image/png' });
  });

  it('accepts a data URL prefix and stray whitespace', () => {
    const encoded = b64(JPEG);
    const result = decodeImage(
      `data:image/jpeg;base64,${encoded.slice(0, 4)}\n ${encoded.slice(4)}`,
      'image/jpeg',
    );
    expect(result.ok).toBe(true);
  });

  it('rejects empty or non-base64 input as invalid', () => {
    expect(decodeImage('', 'image/png')).toEqual({ ok: false, reason: 'invalid' });
    expect(decodeImage('not base64!', 'image/png')).toEqual({ ok: false, reason: 'invalid' });
  });

  it('rejects images over the server cap', () => {
    const encodedLength = Math.ceil(((IMAGE_MAX_BYTES + 1) * 4) / 3 / 4) * 4 + 8;
    expect(decodeImage('A'.repeat(encodedLength), 'image/png')).toEqual({
      ok: false,
      reason: 'too_large',
    });
  });

  it('rejects bytes that do not match the declared type', () => {
    expect(decodeImage(b64(JPEG), 'image/png')).toEqual({ ok: false, reason: 'unsupported' });
    expect(decodeImage(b64(new TextEncoder().encode('GIF89a')), 'image/png')).toEqual({
      ok: false,
      reason: 'unsupported',
    });
  });
});

describe('downscaleImage', () => {
  const make = (width: number, height: number, format: 'jpeg' | 'png' | 'webp') =>
    sharp({ create: { width, height, channels: 3, background: '#88aa44' } })
      [format]()
      .toBuffer()
      .then((b) => new Uint8Array(b));

  it('resizes JPEGs above 1 MP keeping aspect ratio', async () => {
    const input = await make(2000, 1000, 'jpeg');
    const out = await downscaleImage(input, 'image/jpeg');
    const meta = await sharp(out.bytes).metadata();
    expect(out.mimeType).toBe('image/jpeg');
    expect(meta.width! * meta.height!).toBeLessThanOrEqual(IMAGE_MAX_PIXELS);
    expect(meta.width! / meta.height!).toBeCloseTo(2, 1);
  });

  it('keeps WebP as WebP and re-encodes PNG as JPEG', async () => {
    const webp = await downscaleImage(await make(1600, 1200, 'webp'), 'image/webp');
    expect(webp.mimeType).toBe('image/webp');
    expect(sniffImage(webp.bytes)).toBe('image/webp');
    const png = await downscaleImage(await make(1600, 1200, 'png'), 'image/png');
    expect(png.mimeType).toBe('image/jpeg');
    expect(sniffImage(png.bytes)).toBe('image/jpeg');
  });

  it('returns small images unchanged', async () => {
    const input = await make(800, 600, 'jpeg');
    const out = await downscaleImage(input, 'image/jpeg');
    expect(out.bytes).toBe(input);
  });

  it('passes undecodable bytes through', async () => {
    const out = await downscaleImage(JPEG, 'image/jpeg');
    expect(out.bytes).toBe(JPEG);
  });
});
