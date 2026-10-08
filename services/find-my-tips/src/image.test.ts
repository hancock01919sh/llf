import { describe, expect, it } from 'vitest';

import { IMAGE_MAX_BYTES, decodeImage, sniffImage } from './image';

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
