import { readFileSync } from 'node:fs';

import { AwsClient } from 'google-auth-library';
import type { AwsSecurityCredentials, AwsSecurityCredentialsSupplier } from 'google-auth-library';

import type { Config } from '../config';

/**
 * OAuth token source for Gemini on Vertex AI in Ad Council's Google Cloud project (TDD D37,
 * `docs/runbooks/vertex-gemini.md` §3). Staging and prod run on Fargate, which has no EC2 metadata
 * service, so Google's default credential discovery cannot work: the client gets a custom AWS
 * credentials supplier that reads the ECS container credentials instead.
 */

/** ECS serves container credentials on a link-local address, not the EC2 metadata service. */
const ECS_CREDENTIALS_BASE_URL = 'http://169.254.170.2';
/** Refresh before expiry so a call never signs with a token that dies in flight. */
const REFRESH_SKEW_MS = 60_000;

type EcsCredentials = {
  AccessKeyId: string;
  SecretAccessKey: string;
  Token?: string;
};

export interface VertexTokenOptions {
  /** Injected in tests. */
  fetch?: typeof fetch;
  env?: NodeJS.ProcessEnv;
  now?: () => number;
}

/**
 * Reads the WIF credential config gcloud generated (`create-cred-config --aws`). The value is
 * either the path the pipeline provides or the JSON itself.
 */
function readWifConfig(value: string): Record<string, unknown> {
  const text = value.trimStart().startsWith('{') ? value : readFileSync(value, 'utf8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('find-my-tips: GOOGLE_WIF_CREDENTIALS is not valid JSON');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('find-my-tips: GOOGLE_WIF_CREDENTIALS is not a JSON object');
  }
  return parsed as Record<string, unknown>;
}

function containerCredentialsUrl(env: NodeJS.ProcessEnv): {
  url: string;
  authorization: string | undefined;
} {
  const relative = env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI;
  if (relative) return { url: `${ECS_CREDENTIALS_BASE_URL}${relative}`, authorization: undefined };
  const full = env.AWS_CONTAINER_CREDENTIALS_FULL_URI;
  if (full) return { url: full, authorization: env.AWS_CONTAINER_AUTHORIZATION_TOKEN };
  throw new Error(
    'find-my-tips: no ECS container credentials (AWS_CONTAINER_CREDENTIALS_RELATIVE_URI or ' +
      'AWS_CONTAINER_CREDENTIALS_FULL_URI); Fargate has no EC2 metadata service',
  );
}

/** ECS container credentials in the shape `AwsClient` asks a supplier for. */
export function createEcsCredentialsSupplier(
  options: VertexTokenOptions = {},
): AwsSecurityCredentialsSupplier {
  const doFetch = options.fetch ?? fetch;
  const env = options.env ?? process.env;

  return {
    async getAwsRegion(): Promise<string> {
      const region = env.AWS_REGION ?? env.AWS_DEFAULT_REGION;
      if (!region) throw new Error('find-my-tips: AWS_REGION is not set');
      return region;
    },
    async getAwsSecurityCredentials(): Promise<AwsSecurityCredentials> {
      const { url, authorization } = containerCredentialsUrl(env);
      const res = await doFetch(url, { headers: authorization ? { authorization } : undefined });
      if (!res.ok) {
        await res.body?.cancel();
        throw new Error(`find-my-tips: ECS credentials HTTP ${res.status}`);
      }
      const body = (await res.json()) as EcsCredentials;
      if (!body.AccessKeyId || !body.SecretAccessKey) {
        throw new Error('find-my-tips: ECS credentials are incomplete');
      }
      return {
        accessKeyId: body.AccessKeyId,
        secretAccessKey: body.SecretAccessKey,
        ...(body.Token ? { token: body.Token } : {}),
      };
    },
  };
}

/**
 * Returns the token source for Vertex without an API key, or `undefined` on dev and local, where
 * the Gemini API key still applies. The token is cached until shortly before it expires.
 */
export function createVertexAccessTokenSource(
  config: Config,
  options: VertexTokenOptions = {},
): (() => Promise<string>) | undefined {
  if (!config.geminiVertex || config.geminiApiKey) return undefined;

  const raw = config.googleWifCredentials;
  if (!raw) {
    throw new Error(
      'find-my-tips: GOOGLE_WIF_CREDENTIALS is required when GEMINI_VERTEX=1 and GEMINI_API_KEY is unset',
    );
  }

  // `AwsClient` rejects a config with both a credential source and a supplier, and the generated
  // credential source points at the EC2 metadata service, which does not exist on Fargate.
  const externalAccount = { ...readWifConfig(raw) };
  delete externalAccount.credential_source;

  const client = new AwsClient({
    ...externalAccount,
    aws_security_credentials_supplier: createEcsCredentialsSupplier(options),
  } as unknown as ConstructorParameters<typeof AwsClient>[0]);

  const now = options.now ?? Date.now;
  let cached: { token: string; expiresAt: number } | undefined;
  let pending: Promise<string> | undefined;

  async function refresh(): Promise<string> {
    const { token, res } = await client.getAccessToken();
    if (!token) throw new Error('find-my-tips: Google returned no access token');
    const expiry = res?.data?.expiry_date;
    // No expiry means no cache: the next call refreshes instead of reusing a dead token.
    cached = { token, expiresAt: typeof expiry === 'number' ? expiry : now() };
    return token;
  }

  return async function accessToken(): Promise<string> {
    if (cached && now() < cached.expiresAt - REFRESH_SKEW_MS) return cached.token;
    // One refresh at a time: a cold start with concurrent requests must not fan out to STS.
    pending ??= refresh().finally(() => {
      pending = undefined;
    });
    return pending;
  };
}
