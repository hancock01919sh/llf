import {
  BODY_MAX_BYTES,
  ExtractRequest,
  FIND_TIPS_API,
  type ExtractResponse,
  type ExtractSource,
  type InputType,
  type StatusResponse,
} from '@llf/contracts/find-tips';

import type { CacheStore, CounterStore } from './cache';
import type { CatalogSource } from './catalog';
import type { Config } from './config';
import { extractIngredients, type ExtractionProvider, type ExtractionUsage } from './extract';
import type { ExtractedItem } from '@llf/contracts/find-tips';
import { ToolError, errorResponse, json } from './http';
import { decodeImage } from './image';
import type { LogFields, Logger } from './log';
import { matchItems } from './match';
import { createQuota } from './quota';
import { createRateLimiter } from './rate-limit';
import { runUrlPipeline } from './url/pipeline';
import type { Resolver, Transport } from './url/safe-fetch';

export type AppDeps = {
  config: Config;
  catalog: CatalogSource;
  provider: ExtractionProvider;
  cache: CacheStore;
  counters: CounterStore;
  logger: Logger;
  resolve?: Resolver;
  transport?: Transport;
  now?: () => number;
  newRequestId?: () => string;
};

export type HandleOptions = { ip?: string };

type Outcome = {
  items: readonly ExtractedItem[];
  detectedType: ExtractResponse['detectedType'];
  readable: boolean;
  source: ExtractSource;
  usage?: ExtractionUsage;
  urlHash?: string;
};

const IMAGE_ERROR = {
  invalid: 'invalid_request',
  too_large: 'too_large',
  unsupported: 'unsupported_media_type',
} as const;

/**
 * Runtime-agnostic Find My Tips handler (TDD §7.3–§7.7). Adapters
 * (`server.ts` for Render, `lambda.ts` for AWS) translate to and from Web
 * `Request`/`Response`. Never logs user input: only the allow-listed fields
 * in `LogFields`.
 */
export function createApp(deps: AppDeps) {
  const now = deps.now ?? Date.now;
  const newRequestId = deps.newRequestId ?? (() => crypto.randomUUID());
  const { config, logger } = deps;
  const rateLimit = createRateLimiter(deps.counters, config.rateLimit, now);
  const quota = createQuota(deps.counters, config.quotaDailyModelCalls, now);
  const providerFields = {
    provider: deps.provider.name,
    model: config.model,
    promptVersion: config.promptVersion,
  };

  async function status(requestId: string, started: number): Promise<Response> {
    const { catalogVersion } = await deps.catalog.get();
    const body: StatusResponse = { mode: config.mode, catalogVersion };
    logger({ requestId, event: 'status', status: 200, latencyMs: now() - started, catalogVersion });
    return json(body, 200, { 'x-request-id': requestId });
  }

  async function readBody(req: Request): Promise<string> {
    const declared = Number(req.headers.get('content-length') ?? '0');
    if (Number.isFinite(declared) && declared > BODY_MAX_BYTES) throw new ToolError('too_large');
    const text = await req.text();
    if (new TextEncoder().encode(text).byteLength > BODY_MAX_BYTES)
      throw new ToolError('too_large');
    return text;
  }

  async function parseRequest(req: Request): Promise<ExtractRequest> {
    const contentType = req.headers.get('content-type') ?? '';
    if (!/^application\/json\b/i.test(contentType)) throw new ToolError('unsupported_media_type');
    const raw = await readBody(req);
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new ToolError('invalid_request');
    }
    const parsed = ExtractRequest.safeParse(data);
    if (!parsed.success) throw new ToolError('invalid_request');
    return parsed.data;
  }

  async function guard(inputType: InputType, ip: string): Promise<void> {
    if (config.mode === 'off') throw new ToolError('unavailable');
    if (inputType !== 'url') {
      if (config.mode === 'jsonld-only' || (await quota.exhausted(inputType))) {
        throw new ToolError('unavailable');
      }
    }
    const limit = await rateLimit(ip, inputType);
    if (!limit.allowed) {
      throw new ToolError('rate_limited', { 'retry-after': String(limit.retryAfterSeconds) });
    }
  }

  async function run(request: ExtractRequest, signal: AbortSignal): Promise<Outcome> {
    const extractOptions = {
      timeoutMs: config.modelTimeoutMs,
      model: config.model,
      promptVersion: config.promptVersion,
      signal,
    };
    switch (request.inputType) {
      case 'url': {
        const result = await runUrlPipeline(request.url, {
          cache: deps.cache,
          config,
          provider: deps.provider,
          quota,
          signal,
          ...(deps.resolve ? { resolve: deps.resolve } : {}),
          ...(deps.transport ? { transport: deps.transport } : {}),
        });
        return result;
      }
      case 'image': {
        const image = decodeImage(request.imageBase64, request.mimeType);
        if (!image.ok) throw new ToolError(IMAGE_ERROR[image.reason]);
        await quota.consume('image');
        const { result, usage } = await extractIngredients(
          deps.provider,
          { kind: 'image', bytes: image.bytes, mimeType: image.mimeType },
          extractOptions,
        );
        return { ...result, source: 'model', ...(usage ? { usage } : {}) };
      }
      case 'text': {
        await quota.consume('text');
        const { result, usage } = await extractIngredients(
          deps.provider,
          { kind: 'text', text: request.text },
          extractOptions,
        );
        return { ...result, source: 'model', ...(usage ? { usage } : {}) };
      }
    }
  }

  async function withTimeout<T>(task: (signal: AbortSignal) => Promise<T>): Promise<T> {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(new ToolError('timeout'));
      }, config.handlerTimeoutMs);
    });
    try {
      return await Promise.race([task(controller.signal), timeout]);
    } finally {
      clearTimeout(timer);
    }
  }

  async function extract(
    req: Request,
    requestId: string,
    ip: string,
    started: number,
  ): Promise<Response> {
    const fields: LogFields = { requestId, event: 'extract' };
    try {
      const request = await parseRequest(req);
      fields.inputType = request.inputType;
      await guard(request.inputType, ip);

      const outcome = await withTimeout((signal) => run(request, signal));
      const { catalogVersion, matcher } = await deps.catalog.get();
      const { matches, unmatchedCount } = matchItems(outcome.items, matcher);
      const body: ExtractResponse = {
        requestId,
        detectedType: outcome.detectedType,
        readable: outcome.readable,
        matches,
        unmatchedCount,
        source: outcome.source,
        catalogVersion,
      };
      logger({
        ...fields,
        ...(outcome.source === 'model' ? providerFields : {}),
        status: 200,
        detectedType: outcome.detectedType,
        source: outcome.source,
        itemCount: outcome.items.length,
        matchCount: matches.length,
        unmatchedCount,
        catalogVersion,
        latencyMs: now() - started,
        ...(outcome.usage
          ? { inputTokens: outcome.usage.inputTokens, outputTokens: outcome.usage.outputTokens }
          : {}),
        ...(outcome.urlHash ? { urlHash: outcome.urlHash } : {}),
      });
      return json(body);
    } catch (error) {
      return reject(error, { ...fields, event: 'reject' }, started);
    }
  }

  function reject(error: unknown, fields: LogFields, started: number): Response {
    const toolError = error instanceof ToolError ? error : new ToolError('server');
    const response = errorResponse(fields.requestId, toolError.code, toolError.headers);
    logger({
      ...fields,
      code: toolError.code,
      status: response.status,
      latencyMs: now() - started,
    });
    if (!(error instanceof ToolError)) {
      console.error(
        'find-my-tips: unhandled error',
        error instanceof Error ? error.name : 'unknown',
      );
    }
    return response;
  }

  async function handle(req: Request, options: HandleOptions = {}): Promise<Response> {
    const started = now();
    const requestId = newRequestId();
    const { pathname } = new URL(req.url);
    const fields: LogFields = { requestId, event: 'reject' };

    try {
      if (pathname === FIND_TIPS_API.status) {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          throw new ToolError('method_not_allowed', { allow: 'GET, HEAD' });
        }
        return await status(requestId, started);
      }
      if (pathname === FIND_TIPS_API.extract) {
        if (req.method !== 'POST') throw new ToolError('method_not_allowed', { allow: 'POST' });
        return await extract(req, requestId, options.ip ?? 'unknown', started);
      }
      throw new ToolError('not_found');
    } catch (error) {
      return reject(error, fields, started);
    }
  }

  return { handle };
}

export type App = ReturnType<typeof createApp>;
