import { describe, expect, it } from 'vitest';

import { loadConfig } from '../config';
import { createEcsCredentialsSupplier, createVertexAccessTokenSource } from './vertex-token';

const WIF = {
  type: 'external_account',
  audience:
    '//iam.googleapis.com/projects/1/locations/global/workloadIdentityPools/llf-aws/providers/llf-aws-prod',
  subject_token_type: 'urn:ietf:params:aws:token-type:aws4_request',
  token_url: 'https://sts.googleapis.com/v1/token',
  service_account_impersonation_url:
    'https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/sa@p.iam.gserviceaccount.com:generateAccessToken',
  // gcloud points this at the EC2 metadata service, which Fargate does not have.
  credential_source: {
    environment_id: 'aws1',
    region_url: 'http://169.254.169.254/latest/meta-data/placement/availability-zone',
    url: 'http://169.254.169.254/latest/meta-data/iam/security-credentials',
    regional_cred_verification_url:
      'https://sts.{region}.amazonaws.com?Action=GetCallerIdentity&Version=2011-06-15',
  },
};

// `AwsClient` hands the supplier this context; the ECS endpoints don't use it.
const supplierCtx = {
  audience: WIF.audience,
  subjectTokenType: WIF.subject_token_type,
  transporter: {} as never,
};

const vertexConfig = (extra: Record<string, string> = {}) =>
  loadConfig({
    GEMINI_VERTEX: '1',
    GOOGLE_CLOUD_PROJECT: 'iconic-indexer-513915-t1',
    GOOGLE_WIF_CREDENTIALS: JSON.stringify(WIF),
    ...extra,
  });

const ECS_CREDENTIALS = {
  AccessKeyId: 'ASIAEXAMPLE',
  SecretAccessKey: 'secret',
  Token: 'session',
};

describe('createVertexAccessTokenSource', () => {
  it('stays off on dev, where the Gemini API key applies', () => {
    expect(createVertexAccessTokenSource(loadConfig({}))).toBeUndefined();
    expect(
      createVertexAccessTokenSource(vertexConfig({ GEMINI_API_KEY: 'dev-key' })),
    ).toBeUndefined();
  });

  it('requires the WIF config when Vertex runs without a key', () => {
    expect(() => loadConfig({ GEMINI_VERTEX: '1', GOOGLE_CLOUD_PROJECT: 'p' })).toThrow(
      /GOOGLE_WIF_CREDENTIALS/,
    );
  });

  it('rejects a WIF config that is not JSON', () => {
    const config = vertexConfig({ GOOGLE_WIF_CREDENTIALS: '{not json' });
    expect(() => createVertexAccessTokenSource(config)).toThrow(/not valid JSON/);
  });

  it('builds a token source from the WIF config', () => {
    expect(typeof createVertexAccessTokenSource(vertexConfig())).toBe('function');
  });
});

describe('createEcsCredentialsSupplier', () => {
  it('reads the region from the task environment', async () => {
    const supplier = createEcsCredentialsSupplier({ env: { AWS_REGION: 'us-east-1' } });
    await expect(supplier.getAwsRegion(supplierCtx)).resolves.toBe('us-east-1');
  });

  it('fails loudly without a region', async () => {
    const supplier = createEcsCredentialsSupplier({ env: {} });
    await expect(supplier.getAwsRegion(supplierCtx)).rejects.toThrow(/AWS_REGION/);
  });

  it('reads credentials from the ECS endpoint', async () => {
    let called = '';
    const supplier = createEcsCredentialsSupplier({
      env: { AWS_CONTAINER_CREDENTIALS_RELATIVE_URI: '/v2/credentials/abc' },
      fetch: (async (url: string) => {
        called = url;
        return Response.json(ECS_CREDENTIALS);
      }) as unknown as typeof fetch,
    });

    await expect(supplier.getAwsSecurityCredentials(supplierCtx)).resolves.toEqual({
      accessKeyId: ECS_CREDENTIALS.AccessKeyId,
      secretAccessKey: ECS_CREDENTIALS.SecretAccessKey,
      token: ECS_CREDENTIALS.Token,
    });
    expect(called).toBe('http://169.254.170.2/v2/credentials/abc');
  });

  it('sends the authorization token for a full URI', async () => {
    let headers: RequestInit['headers'];
    const supplier = createEcsCredentialsSupplier({
      env: {
        AWS_CONTAINER_CREDENTIALS_FULL_URI: 'http://127.0.0.1:1234/creds',
        AWS_CONTAINER_AUTHORIZATION_TOKEN: 'tok',
      },
      fetch: (async (_url: string, init?: RequestInit) => {
        headers = init?.headers;
        return Response.json(ECS_CREDENTIALS);
      }) as unknown as typeof fetch,
    });

    await supplier.getAwsSecurityCredentials(supplierCtx);
    expect(headers).toEqual({ authorization: 'tok' });
  });

  it('fails loudly without ECS credentials, never falling back to IMDS', async () => {
    const supplier = createEcsCredentialsSupplier({ env: {} });
    await expect(supplier.getAwsSecurityCredentials(supplierCtx)).rejects.toThrow(
      /no ECS container credentials/,
    );
  });

  it('reports a non-2xx response', async () => {
    const supplier = createEcsCredentialsSupplier({
      env: { AWS_CONTAINER_CREDENTIALS_RELATIVE_URI: '/v2/credentials/abc' },
      fetch: (async () => new Response(null, { status: 500 })) as unknown as typeof fetch,
    });
    await expect(supplier.getAwsSecurityCredentials(supplierCtx)).rejects.toThrow(/HTTP 500/);
  });
});
