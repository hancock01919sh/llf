import { z } from 'zod';

export const LogoItem = z.object({});

export const LogoItemRef = z.object({});

export const LogoItemDeepRef = z.object({});

export type LogoItemDeepRef = z.infer<typeof LogoItemDeepRef>;

export type LogoItem = z.infer<typeof LogoItem>;
