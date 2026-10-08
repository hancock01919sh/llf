export type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

export interface StrapiClientOptions {
  url: string;
  token: string;
  fetch?: Fetch;
}

export interface StrapiDocument {
  documentId: string;
  [key: string]: unknown;
}

export interface StrapiPage<T = unknown> {
  data: T[];
  pageCount: number;
}

export class StrapiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'StrapiError';
  }
}

// Same encoder as apps/web/lib/cms.ts: Strapi wants bracketed keys (populate[main][on][...]).
export function toQuery(params: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(params).flatMap(([key, value]) => {
    const name = prefix ? `${prefix}[${key}]` : key;
    if (value !== null && typeof value === 'object')
      return toQuery(value as Record<string, unknown>, name);
    return [`${encodeURIComponent(name)}=${encodeURIComponent(String(value))}`];
  });
}

export interface StrapiClient {
  find(plural: string, field: string, value: string): Promise<StrapiDocument | undefined>;
  create(plural: string, data: Record<string, unknown>): Promise<StrapiDocument>;
  update(
    plural: string,
    documentId: string,
    data: Record<string, unknown>,
  ): Promise<StrapiDocument>;
  list(plural: string, params: Record<string, unknown>): Promise<StrapiPage>;
}

export function createStrapiClient({
  url,
  token,
  fetch: fetchImpl = fetch,
}: StrapiClientOptions): StrapiClient {
  const base = url.replace(/\/+$/, '');

  async function request(method: string, path: string, body?: unknown): Promise<unknown> {
    const response = await fetchImpl(`${base}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) {
      // Strapi error bodies describe schema problems only; they never echo the token.
      const detail = await response.text().catch(() => '');
      throw new StrapiError(
        `${method} ${path} failed: ${response.status} ${detail.slice(0, 500)}`,
        response.status,
      );
    }
    return response.json();
  }

  function unwrap(body: unknown): StrapiDocument {
    const data = (body as { data?: unknown } | null)?.data;
    if (
      !data ||
      typeof data !== 'object' ||
      typeof (data as StrapiDocument).documentId !== 'string'
    ) {
      throw new StrapiError('Strapi response has no data.documentId', 0);
    }
    return data as StrapiDocument;
  }

  return {
    async find(plural, field, value) {
      // status=draft sees every document, published or not, so reruns never create duplicates.
      const query = toQuery({
        status: 'draft',
        filters: { [field]: { $eq: value } },
        pagination: { pageSize: 2 },
      });
      const body = (await request('GET', `/api/${plural}?${query.join('&')}`)) as {
        data?: unknown;
      };
      const data = Array.isArray(body.data) ? (body.data as StrapiDocument[]) : [];
      if (data.length > 1)
        throw new StrapiError(`${plural}: more than one document has ${field} = "${value}"`, 0);
      return data[0];
    },
    async create(plural, data) {
      return unwrap(await request('POST', `/api/${plural}?status=published`, { data }));
    },
    async update(plural, documentId, data) {
      return unwrap(
        await request('PUT', `/api/${plural}/${encodeURIComponent(documentId)}?status=published`, {
          data,
        }),
      );
    },
    async list(plural, params) {
      const body = (await request('GET', `/api/${plural}?${toQuery(params).join('&')}`)) as {
        data?: unknown;
        meta?: { pagination?: { pageCount?: number } };
      };
      return {
        data: Array.isArray(body.data) ? body.data : [],
        pageCount: body.meta?.pagination?.pageCount ?? 1,
      };
    },
  };
}
