import { z } from 'zod';

export const collectionResponse = <T extends z.ZodType>(item: T) =>
  z.object({
    data: z.array(item),
    meta: z
      .object({
        pagination: z
          .object({
            page: z.number(),
            pageSize: z.number(),
            pageCount: z.number(),
            total: z.number(),
          })
          .optional(),
      })
      .optional(),
  });

export const singleResponse = <T extends z.ZodType>(item: T) => z.object({ data: item });
