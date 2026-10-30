import { z } from 'zod';

export const LogoItem = z.object({});

export const LogoItemRef = z.object({});

export type LogoItem = z.infer<typeof LogoItem>;
