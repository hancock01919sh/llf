import { createHash, timingSafeEqual } from 'node:crypto';

const digest = (value: string) => createHash('sha256').update(value).digest();

/** The token from `Authorization: Bearer …` or `x-goog-api-key` (what the Gemini adapter sends). */
export function tokenFrom(headers: Headers): string | null {
  const bearer = /^Bearer\s+(.+)$/i.exec(headers.get('authorization') ?? '');
  return bearer?.[1]?.trim() || headers.get('x-goog-api-key');
}

/**
 * Resolves a token to the caller's position in the token list, or undefined. Logs carry the
 * position only, never the token (D20).
 */
export function createTokenCheck(tokens: readonly string[]) {
  const known = tokens.map(digest);
  return (token: string | null): number | undefined => {
    if (!token) return undefined;
    const candidate = digest(token);
    let match: number | undefined;
    // Compare against every token so timing doesn't reveal which one nearly matched.
    known.forEach((value, index) => {
      if (timingSafeEqual(value, candidate) && match === undefined) match = index;
    });
    return match;
  };
}
