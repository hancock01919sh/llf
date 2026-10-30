import { z } from 'zod';

export const MetaPaginationSchema = z.looseObject({
  page: z.number(),
  pageSize: z.number(),
  pageCount: z.number(),
  total: z.number(),
});

export function SingleResponse<T extends z.ZodType>(schema: T) {
  return z.looseObject({
    data: schema,
    meta: z.looseObject({}),
  });
}

export function ListResponse<T extends z.ZodType>(schema: T) {
  return z.looseObject({
    data: z.array(schema),
    meta: z.looseObject({
      pagination: MetaPaginationSchema,
    }),
  });
}

export type MetaPagination = z.infer<typeof MetaPaginationSchema>;
export type Single<T extends z.ZodType> = {
  data: z.output<T>;
  meta: Record<string, unknown>;
};
export type List<T extends z.ZodType> = {
  data: Array<z.output<T>>;
  meta: {
    pagination: MetaPagination;
  } & Record<string, unknown>;
};
