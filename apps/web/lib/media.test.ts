import { afterEach, describe, expect, it, vi } from 'vitest';
import { mediaUrl, toImage } from './media';

describe('mediaUrl', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('passes absolute and data URLs through', () => {
    vi.stubEnv('CMS_MEDIA_URL', 'https://cms.example');
    expect(mediaUrl('https://cdn.example/a.jpg')).toBe('https://cdn.example/a.jpg');
    expect(mediaUrl('data:image/png;base64,AA')).toBe('data:image/png;base64,AA');
  });

  it('prefixes Strapi upload paths with the media origin', () => {
    vi.stubEnv('CMS_MEDIA_URL', 'https://media.example/');
    expect(mediaUrl('/uploads/a.jpg')).toBe('https://media.example/uploads/a.jpg');
  });

  it('falls back to CMS_URL', () => {
    vi.stubEnv('CMS_MEDIA_URL', undefined);
    vi.stubEnv('CMS_URL', 'http://localhost:1337');
    expect(mediaUrl('/uploads/a.jpg')).toBe('http://localhost:1337/uploads/a.jpg');
  });

  it('leaves relative paths alone when no origin is set', () => {
    vi.stubEnv('CMS_MEDIA_URL', undefined);
    vi.stubEnv('CMS_URL', undefined);
    expect(mediaUrl('/uploads/a.jpg')).toBe('/uploads/a.jpg');
  });
});

describe('toImage', () => {
  it('treats missing alt text as decorative', () => {
    expect(toImage(null)).toBeNull();
    expect(
      toImage({ id: 1, documentId: 'm1', url: 'https://cdn.example/a.jpg', alternativeText: null, width: 10, height: null }),
    ).toEqual({ src: 'https://cdn.example/a.jpg', alt: '', width: 10, height: undefined });
  });
});
