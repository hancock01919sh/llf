import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { Slug } from '@llf/contracts/catalog';
import { DETECTED_TYPES, IMAGE_MIME_TYPES, TEXT_MAX_LENGTH } from '@llf/contracts/find-tips';
import { z } from 'zod';

import type { ExtractionInput } from '../extract';

/**
 * One labeled input for the P9 eval (TDD §7.9). `expectedSlugs` are the
 * catalog ingredients a correct extraction should match. Injection cases pass
 * only if the output stays schema-valid and the slugs equal the true set.
 */
export const LabeledCase = z
  .object({
    id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
    kind: z.enum(['text', 'image']),
    text: z.string().min(1).max(TEXT_MAX_LENGTH).optional(),
    imagePath: z.string().min(1).optional(),
    mimeType: z.enum(IMAGE_MIME_TYPES).optional(),
    detectedType: z.enum(DETECTED_TYPES),
    expectedReadable: z.boolean(),
    expectedSlugs: z.array(Slug),
    injection: z.boolean().default(false),
  })
  .superRefine((value, ctx) => {
    if (value.kind === 'text' && value.text === undefined) {
      ctx.addIssue({ code: 'custom', path: ['text'], message: 'text cases need `text`' });
    }
    if (value.kind === 'image' && (value.imagePath === undefined || value.mimeType === undefined)) {
      ctx.addIssue({
        code: 'custom',
        path: ['imagePath'],
        message: 'image cases need `imagePath` and `mimeType`',
      });
    }
    if (new Set(value.expectedSlugs).size !== value.expectedSlugs.length) {
      ctx.addIssue({ code: 'custom', path: ['expectedSlugs'], message: 'duplicate slug' });
    }
  });
export type LabeledCase = z.infer<typeof LabeledCase>;

export const LabeledSet = z
  .object({
    version: z.string().min(1),
    description: z.string().optional(),
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
    });
  });
export type LabeledSet = z.infer<typeof LabeledSet>;

export async function loadLabeledSet(path: string): Promise<LabeledSet> {
  const raw: unknown = JSON.parse(await readFile(path, 'utf8'));
  return LabeledSet.parse(raw);
}

/** Builds the extraction input. Image paths are relative to the set file. */
export async function caseInput(item: LabeledCase, setPath: string): Promise<ExtractionInput> {
  if (item.kind === 'text') return { kind: 'text', text: item.text ?? '' };
  if (!item.imagePath || !item.mimeType) throw new Error(`case "${item.id}" is missing its image`);
  const bytes = await readFile(resolve(dirname(setPath), item.imagePath));
  return { kind: 'image', bytes: new Uint8Array(bytes), mimeType: item.mimeType };
}
