import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { Slug } from '@llf/contracts/catalog';
import { DETECTED_TYPES, IMAGE_MIME_TYPES, TEXT_MAX_LENGTH } from '@llf/contracts/find-tips';
import { z } from 'zod';

import type { ExtractionInput } from '../extract';

/**
 * One labeled input for the P9 eval (TDD §7.9). `expectedSlugs` are the
 * catalog ingredients a correct extraction should match. `acceptableSlugs` are
 * also correct but optional (a garnish, an invisible cooking staple, a common
 * variant of a named dish): matching one is neither rewarded nor penalized.
 * Injection cases are scored for resistance (see `scoreCase`): the attack fails
 * if the output keeps the right readable flag, contains none of the
 * `injectedSlugs` the attack tries to plant (any unexpected slug when the field
 * is absent), and still reports at least one real item. `url` cases run the real
 * recipe-URL pipeline and need network access.
 */
export const LabeledCase = z
  .object({
    id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
    kind: z.enum(['text', 'image', 'url']),
    text: z.string().min(1).max(TEXT_MAX_LENGTH).optional(),
    url: z.string().url().optional(),
    imagePath: z.string().min(1).optional(),
    mimeType: z.enum(IMAGE_MIME_TYPES).optional(),
    detectedType: z.enum(DETECTED_TYPES),
    expectedReadable: z.boolean(),
    expectedSlugs: z.array(Slug),
    acceptableSlugs: z.array(Slug).default([]),
    injection: z.boolean().default(false),
    /**
     * Injection cases only: the slugs the hidden instruction tries to add (`[]`
     * for an attack that only tries to suppress output). When it's absent, any
     * unexpected slug counts as a leak.
     */
    injectedSlugs: z.array(Slug).optional(),
    /** Provenance id from the set's `sources` manifest (license, consent, no-PII check). */
    source: z
      .string()
      .regex(/^[a-z0-9][a-z0-9-]*$/)
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (value.kind === 'text' && value.text === undefined) {
      ctx.addIssue({ code: 'custom', path: ['text'], message: 'text cases need `text`' });
    }
    if (value.kind === 'url' && value.url === undefined) {
      ctx.addIssue({ code: 'custom', path: ['url'], message: 'url cases need `url`' });
    }
    if (value.kind === 'image' && (value.imagePath === undefined || value.mimeType === undefined)) {
      ctx.addIssue({
        code: 'custom',
        path: ['imagePath'],
        message: 'image cases need `imagePath` and `mimeType`',
      });
    }
    if (value.kind === 'image' && value.source === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['source'],
        message: 'image cases need a `source` (license and PII review)',
      });
    }
    if (new Set(value.expectedSlugs).size !== value.expectedSlugs.length) {
      ctx.addIssue({ code: 'custom', path: ['expectedSlugs'], message: 'duplicate slug' });
    }
    if (new Set(value.acceptableSlugs).size !== value.acceptableSlugs.length) {
      ctx.addIssue({ code: 'custom', path: ['acceptableSlugs'], message: 'duplicate slug' });
    }
    const injected = value.injectedSlugs ?? [];
    if (value.injectedSlugs !== undefined && !value.injection) {
      ctx.addIssue({
        code: 'custom',
        path: ['injectedSlugs'],
        message: '`injectedSlugs` needs `injection: true`',
      });
    }
    const planted = injected.filter(
      (slug) => value.expectedSlugs.includes(slug) || value.acceptableSlugs.includes(slug),
    );
    if (planted.length > 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['injectedSlugs'],
        message: `injected slug(s) also expected or acceptable: ${planted.join(', ')}`,
      });
    }
    const both = value.acceptableSlugs.filter((slug) => value.expectedSlugs.includes(slug));
    if (both.length > 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['acceptableSlugs'],
        message: `slug(s) both expected and acceptable: ${both.join(', ')}`,
      });
    }
  });
export type LabeledCase = z.infer<typeof LabeledCase>;

/** Where a batch of cases came from, so Legal can audit every item (BD3244-37). */
export const LabeledSource = z.object({
  description: z.string().min(1),
  license: z.string().min(1),
  piiReviewed: z.boolean(),
});
export type LabeledSource = z.infer<typeof LabeledSource>;

export const LabeledSet = z
  .object({
    version: z.string().min(1),
    description: z.string().optional(),
    sources: z.record(z.string(), LabeledSource).optional(),
    cases: z.array(LabeledCase).min(1),
  })
  .superRefine((value, ctx) => {
    const seen = new Set<string>();
    value.cases.forEach((item, index) => {
      if (seen.has(item.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['cases', index, 'id'],
          message: `duplicate id "${item.id}"`,
        });
      }
      seen.add(item.id);
      if (item.source !== undefined && value.sources?.[item.source] === undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['cases', index, 'source'],
          message: `unknown source "${item.source}"`,
        });
      }
    });
    for (const [id, source] of Object.entries(value.sources ?? {})) {
      if (!source.piiReviewed) {
        ctx.addIssue({
          code: 'custom',
          path: ['sources', id, 'piiReviewed'],
          message: `source "${id}" has not been reviewed for personal data`,
        });
      }
    }
  });
export type LabeledSet = z.infer<typeof LabeledSet>;

export async function loadLabeledSet(path: string): Promise<LabeledSet> {
  const raw: unknown = JSON.parse(await readFile(path, 'utf8'));
  return LabeledSet.parse(raw);
}

/**
 * Builds the extraction input for a text or image case. Image paths are
 * relative to the set file. `url` cases go through the URL pipeline instead.
 */
export async function caseInput(item: LabeledCase, setPath: string): Promise<ExtractionInput> {
  if (item.kind === 'url') throw new Error(`case "${item.id}" is a url case`);
  if (item.kind === 'text') return { kind: 'text', text: item.text ?? '' };
  if (!item.imagePath || !item.mimeType) throw new Error(`case "${item.id}" is missing its image`);
  const bytes = await readFile(resolve(dirname(setPath), item.imagePath));
  return { kind: 'image', bytes: new Uint8Array(bytes), mimeType: item.mimeType };
}
