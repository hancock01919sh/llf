import type { DetectedType, ErrorCode, ExtractSource, InputType } from '@llf/contracts/find-tips';

/**
 * Allow-listed log fields (TDD §7.6, D20). User input — terms, text, image
 * bytes, URLs — never appears here; URLs are logged only as a hash.
 */
export type LogFields = {
  requestId: string;
  event: 'extract' | 'status' | 'reject' | 'catalog' | 'start';
  inputType?: InputType;
  detectedType?: DetectedType;
  source?: ExtractSource;
  code?: ErrorCode;
  status?: number;
  itemCount?: number;
  matchCount?: number;
  unmatchedCount?: number;
  gapTermsKept?: number;
  latencyMs?: number;
  provider?: string;
  model?: string;
  promptVersion?: string;
  inputTokens?: number;
  outputTokens?: number;
  urlHash?: string;
  catalogVersion?: string;
  port?: number;
};

export type Logger = (fields: LogFields) => void;

export const stdoutLogger: Logger = (fields) => {
  process.stdout.write(`${JSON.stringify({ ts: new Date().toISOString(), ...fields })}\n`);
};

export const silentLogger: Logger = () => {};
