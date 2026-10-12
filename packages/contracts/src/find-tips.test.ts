import { describe, expect, it } from 'vitest';
import {
  EXTRACTION_MAX_ITEMS,
  ErrorResponse,
  ExtractRequest,
  ExtractionResult,
  REPORT_INGREDIENTS_TOOL,
  TEXT_MAX_LENGTH,
} from './find-tips';

describe('ErrorResponse', () => {
  it('accepts the distinct blocked-site code', () => {
    expect(ErrorResponse.safeParse({ requestId: 'r', code: 'source_unavailable' }).success).toBe(
      true,
    );
    expect(ErrorResponse.safeParse({ requestId: 'r', code: 'nope' }).success).toBe(false);
  });
});

describe('ExtractRequest', () => {
  it('accepts each input type', () => {
    expect(ExtractRequest.parse({ inputType: 'url', url: 'https://a.example/r' }).inputType).toBe(
      'url',
    );
    expect(ExtractRequest.parse({ inputType: 'text', text: 'milk, eggs' }).inputType).toBe('text');
    expect(
      ExtractRequest.parse({ inputType: 'image', imageBase64: 'AAAA', mimeType: 'image/webp' })
        .inputType,
    ).toBe('image');
  });

  it('rejects oversize text and unsupported images', () => {
    expect(
      ExtractRequest.safeParse({ inputType: 'text', text: 'a'.repeat(TEXT_MAX_LENGTH + 1) })
        .success,
    ).toBe(false);
    expect(
      ExtractRequest.safeParse({ inputType: 'image', imageBase64: 'AAAA', mimeType: 'image/gif' })
        .success,
    ).toBe(false);
  });
});

describe('ExtractionResult', () => {
  it(`caps items at ${EXTRACTION_MAX_ITEMS}`, () => {
    const item = { term: 'milk', isFood: true, inferred: false };
    const base = { readable: true, detectedType: 'recipe' };
    expect(
      ExtractionResult.safeParse({ ...base, items: Array(EXTRACTION_MAX_ITEMS).fill(item) })
        .success,
    ).toBe(true);
    expect(
      ExtractionResult.safeParse({ ...base, items: Array(EXTRACTION_MAX_ITEMS + 1).fill(item) })
        .success,
    ).toBe(false);
  });

  it('keeps the provider JSON schema in step with the Zod schema', () => {
    const schema = REPORT_INGREDIENTS_TOOL.inputSchema;
    expect(schema.required).toEqual(Object.keys(ExtractionResult.shape));
    expect(schema.properties.items.items.required).toEqual(
      Object.keys(ExtractionResult.shape.items.element.shape),
    );
    expect(schema.properties.items.maxItems).toBe(EXTRACTION_MAX_ITEMS);
  });
});
