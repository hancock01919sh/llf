import { z } from 'zod';

export const LogoItem = z.object({});

export type LogoItem = z.infer<typeof LogoItem>;
