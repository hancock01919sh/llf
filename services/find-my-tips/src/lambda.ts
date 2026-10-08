/**
 * AWS Lambda adapter (Phase B, TDD §7.3). Not wired yet: Phase A runs
 * `server.ts` on Render. Kept as a typed stub so the handler contract stays
 * runtime-agnostic.
 *
 * TODO(BD3244-24): read FIND_TIPS_MODE from SSM Parameter Store (30 s cache)
 *   so the kill switch works without a deploy.
 * TODO(BD3244-24): reject requests without the CloudFront `x-origin-verify`
 *   secret header (Secrets Manager).
 * TODO(BD3244-24): Lambda authorizer / WAF rate-based rule in front of the
 *   function; DynamoDB-backed CacheStore and CounterStore.
 */
export type LambdaUrlEvent = {
  rawPath: string;
  rawQueryString?: string;
  headers: Record<string, string | undefined>;
  body?: string;
  isBase64Encoded?: boolean;
  requestContext: { http: { method: string; sourceIp: string } };
};

export type LambdaUrlResult = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
};

export function handler(_event: LambdaUrlEvent): Promise<LambdaUrlResult> {
  return Promise.reject(new Error('find-my-tips: Lambda adapter not implemented (Phase B)'));
}
