import { readFile } from 'node:fs/promises';
import { z } from 'zod';

import type { GapClass } from '@llf/contracts/find-tips';

/**
 * Ground-truth label for one term fed into the gap step.
 * `personal` is not a real GapClass — it means "must never appear in a kept gap
 * output". Edible / inedible / compostable are kept by the step, `exclude` is
 * correctly dropped by the model, and `personal` is dropped by the filter
 * (denylist, `hasSensitiveSource`, or the model's exclude output).
 */
export const GapExpectedClass = z.enum([
  'edible',
  'inedible',
  'compostable',
  'exclude',
  'personal',
]);
export type GapExpectedClass = z.infer<typeof GapExpectedClass>;

const GapLabel = z.object({
  term: z.string().min(1).max(200),
  expectedClass: GapExpectedClass,
});

export const GapCase = z
  .object({
    id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
    /** Human note describing what this case exercises, optional. */
    note: z.string().min(1).optional(),
    terms: z.array(GapLabel).min(1).max(60),
  })
  .superRefine((value, ctx) => {
    const seen = new Set<string>();
    for (const label of value.terms) {
      const key = label.term.trim().toLowerCase();
      if (seen.has(key)) {
        ctx.addIssue({
          code: 'custom',
          path: ['terms'],
          message: `duplicate term "${label.term}" in case "${value.id}"`,
        });
        break;
      }
      seen.add(key);
    }
  });
export type GapCase = z.infer<typeof GapCase>;

export const GapSet = z
  .object({
    version: z.string().min(1),
    description: z.string().min(1).optional(),
    cases: z.array(GapCase).min(1),
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
export type GapSet = z.infer<typeof GapSet>;

export async function loadGapSet(path: string): Promise<GapSet> {
  const raw: unknown = JSON.parse(await readFile(path, 'utf8'));
  return GapSet.parse(raw);
}

/** Personal labels that must never reach the gap-step output. */
export const PERSONAL_LABELS: ReadonlySet<GapExpectedClass> = new Set(['personal']);

/** Ground-truth labels that SHOULD appear in the kept gap output. */
export const KEPT_LABELS: ReadonlySet<GapExpectedClass> = new Set<GapExpectedClass>([
  'edible',
  'inedible',
  'compostable',
]);

/** Real GapClass values a correct model can emit. */
export const MODEL_CLASSES: ReadonlySet<GapClass> = new Set<GapClass>([
  'edible',
  'inedible',
  'compostable',
  'exclude',
]);
