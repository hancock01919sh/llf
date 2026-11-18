/**
 * Allow-listed proxy log fields (D20). Request and response bodies, tokens, and keys never appear
 * here; a caller is identified only by the position of their token in the token list. The tool
 * routes also log through find-my-tips' own allow-listed logger.
 */
export type ProxyLog = {
  event: 'request' | 'reject' | 'start';
  route?: 'tool' | 'relay' | 'docs';
  status?: number;
  reason?: string;
  model?: string;
  caller?: number;
  latencyMs?: number;
  port?: number;
  provider?: string;
};

export const stdoutLog = (fields: ProxyLog) =>
  process.stdout.write(`${JSON.stringify({ ts: new Date().toISOString(), ...fields })}\n`);
