import { z } from 'zod';

export const LogoItemSchema = z.object({
});

export type LogoItem = z.infer<typeof LogoItemSchema>;
