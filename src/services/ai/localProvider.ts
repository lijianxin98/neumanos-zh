/**
 * Local AI Provider
 * Detects and talks to OpenAI-compatible servers on the user's machine
 * (Ollama, LM Studio, llama.cpp, LocalAI, vLLM).
 *
 * Browser fetch only — never proxied through Vite (that would hit the
 * agent/dev machine, not the user's PC).
 */

import type {
  AIProvider,
  AIProviderMetadata,
  AIModel,
  AIMessageOptions,
  AIResponse,
} from './types';
import { ProviderError, ProviderErrorType } from './types';
import { logger } from '../logger';

const log = logger.module('AI:Local');

export type LocalAIRuntime = 'ollama' | 'lmstudio' | 'openai-compat';

export interface LocalAIScanHit {
  runtime: LocalAIRuntime | null;
  baseUrl: string;
  models: { id: string; name: string }[];
}

const SCAN_TIMEOUT_MS = 1500;
const AUTO_SCAN_COOLDOWN_MS = 15_000;

const METADATA: AIProviderMetadata = {
  id: 'local',
  name: '本地',
  displayName: '本地',
  description: '自动识别本机 Ollama、LM Studio 等。',

  requiresApiKey: false,
  hasFreeModels: true,
  freeModelIds: [],

  supportsCORS: true,
  requiresProxy: false,
  supportsStreaming: true,

  websiteUrl: undefined,
  docsUrl: undefined,
};

const PLACEHOLDER_MODEL: AIModel = {
  id: 'local-model',
  name: '本机模型',
  provider: 'local',
  speedRating: 4,
  qualityRating: 4,
  contextWindow: 8192,
  supportsStreaming: true,
  isFree: true,
  requiresApiKey: false,
  useCases: ['chat', 'code', 'reasoning'],
  description: '等待扫描本机已加载的模型',
};

const SCAN_CANDIDATES: Array<{
  runtime: LocalAIRuntime;
  bases: string[];
  paths: string[];
}> = [
  {
    runtime: 'ollama',
    bases: ['http://127.0.0.1:11434', 'http://localhost:11434'],
    paths: ['/api/tags', '/v1/models'],
  },
  {
    runtime: 'lmstudio',
    bases: ['http://127.0.0.1:1234', 'http://localhost:1234'],
    paths: ['/v1/models'],
  },
  {
    runtime: 'openai-compat',
    bases: ['http://127.0.0.1:8080', 'http://localhost:8080'],
    paths: ['/v1/models'],
  },
  {
    runtime: 'openai-compat',
    bases: ['http://127.0.0.1:8000', 'http://localhost:8000'],
    paths: ['/v1/models'],
  },
];

/**
 * Strip trailing slashes and an optional trailing /v1 so chat always
 * goes to `{base}/v1/chat/completions`.
 */
export function normalizeBaseUrl(url: string): string {
  let u = url.trim();
  u = u.replace(/\/+$/, '');
  u = u.replace(/\/v1$/i, '');
  return u;
}

export function inferRuntime(baseUrl: string): LocalAIRuntime {
  try {
    const port = new URL(baseUrl).port;
    if (port === '11434') return 'ollama';
    if (port === '1234') return 'lmstudio';
    return 'openai-compat';
  } catch {
    return 'openai-compat';
  }
}

export function isCorsLikeError(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  if (error instanceof Error && /failed to fetch|networkerror|load failed/i.test(error.message)) {
    return true;
  }
  return false;
}

export function corsHintText(origin: string = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'): string {
  return [
    `Ollama：启动时设置环境变量 OLLAMA_ORIGINS 包含本站来源（例如 ${origin}），或 OLLAMA_ORIGINS=*`,
    'LM Studio：在 Developer 设置里打开 CORS',
  ].join('\n');
}

function toAIModel(id: string, name: string): AIModel {
  return {
    id,
    name,
    provider: 'local',
    speedRating: 4,
    qualityRating: 4,
    contextWindow: 8192,
    supportsStreaming: true,
    isFree: true,
    requiresApiKey: false,
    useCases: ['chat', 'code', 'reasoning'],
    description: '本机模型',
  };
}

function parseModelList(json: unknown, path: string): { id: string; name: string }[] {
  if (!json || typeof json !== 'object') return [];
  const obj = json as Record<string, unknown>;

  if (path.includes('/api/tags') && Array.isArray(obj.models)) {
    return (obj.models as Array<{ name?: string; model?: string }>)
      .map((m) => {
        const name = (m.name || m.model || '').trim();
        return { id: name, name };
      })
      .filter((m) => m.id);
  }

  if (Array.isArray(obj.data)) {
    return (obj.data as Array<{ id?: string; name?: string }>)
      .map((m) => {
        const id = (m.id || m.name || '').trim();
        return { id, name: (m.name || m.id || id).trim() };
      })
      .filter((m) => m.id);
  }

  return [];
}

function safePort(baseUrl: string): string {
  try {
    return new URL(baseUrl).port || (baseUrl.startsWith('https') ? '443' : '80');
  } catch {
    return '';
  }
}

async function fetchWithTimeout(url: string, ms: number, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

interface ProbeOutcome {
  hit: LocalAIScanHit | null;
  corsFailure: boolean;
}

async function probeUrl(baseUrl: string, path: string, runtime: LocalAIRuntime): Promise<ProbeOutcome> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}${path}`, SCAN_TIMEOUT_MS, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return { hit: null, corsFailure: false };
    }
    const json: unknown = await res.json();
    const models = parseModelList(json, path);
    if (models.length === 0 && path !== '/api/tags') {
      // Empty model list still counts as a live server
      return {
        hit: { runtime, baseUrl, models: [] },
        corsFailure: false,
      };
    }
    if (models.length === 0) {
      return { hit: null, corsFailure: false };
    }
    return {
      hit: { runtime, baseUrl, models },
      corsFailure: false,
    };
  } catch (error) {
    return {
      hit: null,
      corsFailure: isCorsLikeError(error),
    };
  }
}

async function probeBaseUrl(baseUrl: string): Promise<ProbeOutcome> {
  const normalized = normalizeBaseUrl(baseUrl);
  const runtime = inferRuntime(normalized);
  const paths = runtime === 'ollama' ? ['/api/tags', '/v1/models'] : ['/v1/models'];

  let corsFailure = false;
  for (const path of paths) {
    const outcome = await probeUrl(normalized, path, runtime);
    if (outcome.corsFailure) corsFailure = true;
    if (outcome.hit) {
      return { hit: outcome.hit, corsFailure: false };
    }
  }
  return { hit: null, corsFailure };
}

let inFlightScan: Promise<LocalAIScanHit[]> | null = null;
let lastScanAt = 0;
let lastScanHits: LocalAIScanHit[] = [];

async function runScan(): Promise<LocalAIScanHit[]> {
  const tasks: Array<Promise<{ order: number; runtime: LocalAIRuntime; baseUrl: string; outcome: ProbeOutcome }>> = [];
  let order = 0;

  for (const candidate of SCAN_CANDIDATES) {
    for (const base of candidate.bases) {
      for (const path of candidate.paths) {
        const currentOrder = order++;
        tasks.push(
          probeUrl(base, path, candidate.runtime).then((outcome) => ({
            order: currentOrder,
            runtime: candidate.runtime,
            baseUrl: base,
            outcome,
          }))
        );
      }
    }
  }

  const results = await Promise.all(tasks);
  results.sort((a, b) => a.order - b.order);

  const hits: LocalAIScanHit[] = [];
  let corsFailure = false;

  for (const result of results) {
    if (result.outcome.corsFailure) corsFailure = true;
    const hit = result.outcome.hit;
    if (!hit) continue;

    const port = safePort(hit.baseUrl);
    const already = hits.find(
      (h) => h.runtime === hit.runtime && safePort(h.baseUrl) === port
    );
    if (already) {
      if (already.models.length === 0 && hit.models.length > 0) {
        already.models = hit.models;
      }
      continue;
    }
    hits.push({
      runtime: hit.runtime,
      baseUrl: hit.baseUrl,
      models: hit.models,
    });
  }

  localProvider.recordScan(hits, corsFailure);
  log.info('Local AI scan complete', {
    hits: hits.length,
    corsFailure,
    runtimes: hits.map((h) => h.runtime),
  });
  return hits;
}

/**
 * Scan well-known local AI endpoints in parallel (browser fetch).
 * Dedupes 127.0.0.1 vs localhost for the same runtime/port.
 */
export async function scanLocalAI(force: boolean = false): Promise<LocalAIScanHit[]> {
  if (inFlightScan) return inFlightScan;
  if (!force && lastScanAt && Date.now() - lastScanAt < AUTO_SCAN_COOLDOWN_MS) {
    return lastScanHits;
  }

  inFlightScan = runScan()
    .then((hits) => {
      lastScanAt = Date.now();
      lastScanHits = hits;
      return hits;
    })
    .finally(() => {
      inFlightScan = null;
    });

  return inFlightScan;
}

export class LocalProvider implements AIProvider {
  metadata = METADATA;
  models: AIModel[] = [];

  private baseUrl: string | null = null;
  private runtime: LocalAIRuntime | null = null;
  private lastHits: LocalAIScanHit[] = [];
  private lastCorsFailure = false;

  recordScan(hits: LocalAIScanHit[], corsFailure: boolean): void {
    this.lastHits = hits;
    this.lastCorsFailure = corsFailure;
  }

  getLastHits(): LocalAIScanHit[] {
    return this.lastHits;
  }

  getLastCorsFailure(): boolean {
    return this.lastCorsFailure;
  }

  getBaseUrl(): string | null {
    return this.baseUrl;
  }

  getRuntime(): LocalAIRuntime | null {
    return this.runtime;
  }

  isConfigured(): boolean {
    return !!this.baseUrl;
  }

  setApiKey(_apiKey: string): void {
    // Local runtimes usually have no key. Accept a dummy so the router
    // can mark this provider as configured without encryption.
  }

  getApiKey(): string | null {
    return this.baseUrl ? 'local' : null;
  }

  clearApiKey(): void {
    this.baseUrl = null;
    this.runtime = null;
    this.models = [];
  }

  setBaseUrl(url: string): void {
    this.baseUrl = normalizeBaseUrl(url);
    this.runtime = inferRuntime(this.baseUrl);
  }

  clearBaseUrl(): void {
    this.clearApiKey();
  }

  applyScanHit(hit: LocalAIScanHit): void {
    this.baseUrl = normalizeBaseUrl(hit.baseUrl);
    this.runtime = hit.runtime ?? inferRuntime(this.baseUrl);
    this.models = hit.models.map((m) => toAIModel(m.id, m.name));
    this.lastCorsFailure = false;
  }

  async scanLocalEndpoints(force: boolean = false): Promise<LocalAIScanHit[]> {
    return scanLocalAI(force);
  }

  async refreshModels(): Promise<AIModel[]> {
    if (!this.baseUrl) {
      this.models = [];
      return this.models;
    }

    const outcome = await probeBaseUrl(this.baseUrl);
    if (outcome.corsFailure) {
      this.lastCorsFailure = true;
    }
    if (outcome.hit) {
      this.applyScanHit(outcome.hit);
      return this.models;
    }
    return this.models;
  }

  async validateApiKey(_apiKey: string): Promise<boolean> {
    if (!this.baseUrl) return false;
    try {
      await this.refreshModels();
      return true;
    } catch {
      return false;
    }
  }

  getModel(modelId: string): AIModel | null {
    return this.models.find((m) => m.id === modelId) || null;
  }

  getDefaultModel(): AIModel {
    return this.models[0] || PLACEHOLDER_MODEL;
  }

  getFreeModels(): AIModel[] {
    return this.models.length > 0 ? this.models : [PLACEHOLDER_MODEL];
  }

  async sendMessage(model: string, options: AIMessageOptions): Promise<AIResponse> {
    if (!this.baseUrl) {
      throw new ProviderError(
        ProviderErrorType.INVALID_API_KEY,
        '未识别本机 AI 服务。请先扫描或填写本机服务地址。',
        'local'
      );
    }

    const messages: Array<{ role: string; content: string }> = [];

    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }

    if (options.conversationHistory) {
      options.conversationHistory.forEach((msg) => {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : msg.role === 'system' ? 'system' : 'user',
          content: msg.content,
        });
      });
    }

    messages.push({ role: 'user', content: options.prompt });

    const url = `${this.baseUrl}/v1/chat/completions`;
    const wantStream = !!(options.stream && options.onChunk);
    const body = {
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
      stream: wantStream,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: wantStream ? 'text/event-stream' : 'application/json',
          Authorization: 'Bearer ollama',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw await this.mapHttpError(response, model);
      }

      if (wantStream) {
        return this.readStream(response, model, options.onChunk!);
      }

      const json = (await response.json()) as {
        choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      };
      const content = json.choices?.[0]?.message?.content || '';

      return {
        content,
        model,
        provider: 'local',
        finishReason: (json.choices?.[0]?.finish_reason as 'stop' | 'length' | undefined) || 'stop',
        usage: json.usage
          ? {
              promptTokens: json.usage.prompt_tokens ?? 0,
              completionTokens: json.usage.completion_tokens ?? 0,
              totalTokens: json.usage.total_tokens ?? 0,
            }
          : undefined,
      };
    } catch (error: unknown) {
      if (error instanceof ProviderError) throw error;

      if (isCorsLikeError(error)) {
        this.lastCorsFailure = true;
        throw new ProviderError(
          ProviderErrorType.NETWORK_ERROR,
          `无法连接本机 AI（可能被 CORS 拦截）。\n${corsHintText()}`,
          'local',
          true
        );
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ProviderError(
          ProviderErrorType.TIMEOUT,
          '本机 AI 请求超时。请确认服务仍在运行。',
          'local',
          true
        );
      }

      const message = error instanceof Error ? error.message : '发生未知错误';
      throw new ProviderError(
        ProviderErrorType.UNKNOWN,
        `本机 AI 错误：${message}`,
        'local'
      );
    }
  }

  private async mapHttpError(response: Response, model: string): Promise<ProviderError> {
    let detail = '';
    try {
      const text = await response.text();
      detail = text.slice(0, 200);
    } catch {
      // ignore
    }

    if (response.status === 401 || response.status === 403) {
      return new ProviderError(
        ProviderErrorType.INVALID_API_KEY,
        '本机 AI 拒绝了请求。多数本地服务无需密钥；请检查服务设置。',
        'local'
      );
    }
    if (response.status === 404) {
      return new ProviderError(
        ProviderErrorType.MODEL_NOT_FOUND,
        `未找到模型「${model}」。请确认本机已加载该模型。`,
        'local'
      );
    }
    if (response.status === 429) {
      return new ProviderError(
        ProviderErrorType.RATE_LIMIT,
        '本机 AI 繁忙，请稍后重试。',
        'local',
        true
      );
    }

    return new ProviderError(
      ProviderErrorType.UNKNOWN,
      `本机 AI 返回错误 ${response.status}${detail ? `：${detail}` : ''}`,
      'local'
    );
  }

  private async readStream(
    response: Response,
    model: string,
    onChunk: (chunk: string) => void
  ): Promise<AIResponse> {
    if (!response.body) {
      throw new ProviderError(
        ProviderErrorType.NETWORK_ERROR,
        '本机 AI 未返回数据流。',
        'local'
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';
    let finishReason: 'stop' | 'length' | 'error' = 'stop';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Some servers send raw JSON chunks instead of SSE
        const payload = trimmed.startsWith('data:') ? trimmed.slice(5).trim() : trimmed;
        if (!payload || payload === '[DONE]') {
          continue;
        }

        try {
          const json = JSON.parse(payload) as {
            choices?: Array<{
              delta?: { content?: string };
              message?: { content?: string };
              finish_reason?: string | null;
            }>;
          };
          const choice = json.choices?.[0];
          const content = choice?.delta?.content || choice?.message?.content || '';
          if (content) {
            fullContent += content;
            onChunk(content);
          }
          if (choice?.finish_reason === 'length') finishReason = 'length';
        } catch {
          // ignore malformed SSE lines
        }
      }
    }

    return {
      content: fullContent,
      model,
      provider: 'local',
      finishReason,
    };
  }
}

export const localProvider = new LocalProvider();
