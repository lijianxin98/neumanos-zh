/**
 * Provider Settings Modal
 * Configure AI provider API keys with encryption
 *
 * Features:
 * - Configure AI providers including local (Ollama / LM Studio) plus cloud BYOK
 * - Encrypted API key storage
 * - Visual provider status (configured/unconfigured)
 * - Test API key validation
 * - Provider documentation links
 * - Free vs paid tier indicators
 * - CORS compatibility warnings
 */

import { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { PasswordPrompt } from './PasswordPrompt';
import { ConfirmDialog } from './ConfirmDialog';
import { useTerminalStore } from '../stores/useTerminalStore';
import { AIProviderRouter, PROVIDER_METADATA } from '../services/ai/providerRouter';
import { toast } from '../stores/useToastStore';
import {
  localProvider,
  scanLocalAI,
  corsHintText,
  normalizeBaseUrl,
  type LocalAIScanHit,
  type LocalAIRuntime,
} from '../services/ai/localProvider';

interface ProviderSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  router: AIProviderRouter;
}

export function ProviderSettings({ isOpen, onClose, router }: ProviderSettingsProps) {
  const {
    // providers is unused (using router.getAllProviders() instead)
    encryptionPassword,
    passwordHash,
    isPasswordExpired,
    setProviderApiKey,
    clearProviderApiKey,
    setEncryptionPassword,
    setActiveProvider,
    enableCrossModuleContext,
    setEnableCrossModuleContext,
    localAiBaseUrl,
    setLocalAiBaseUrl,
    activeProvider,
  } = useTerminalStore();

  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [apiKeyInputs, setApiKeyInputs] = useState<Record<string, string>>({});
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [validating, setValidating] = useState<Record<string, boolean>>({});
  const [validationResults, setValidationResults] = useState<Record<string, boolean | null>>({});
  const [providerToClear, setProviderToClear] = useState<string | null>(null);

  // Local AI scan UI
  const [localScanning, setLocalScanning] = useState(false);
  const [localHits, setLocalHits] = useState<LocalAIScanHit[]>([]);
  const [localCorsFailed, setLocalCorsFailed] = useState(false);
  const [customLocalUrl, setCustomLocalUrl] = useState(localAiBaseUrl || '');
  const [localStatusTick, setLocalStatusTick] = useState(0);
  const didAutoScanRef = useRef(false);

  // Get provider metadata (sync - no SDK loading needed for display)
  const providerMetadataList = PROVIDER_METADATA;
  const providerStatus = router.getProviderStatus();
  void localStatusTick; // re-read providerStatus after local scan

  // Check if password is needed
  useEffect(() => {
    if (!encryptionPassword || isPasswordExpired()) {
      // Password needed but don't show prompt automatically
      // User will trigger it when trying to save an API key
    }
  }, [encryptionPassword, isPasswordExpired]);

  // Apply saved local URL and run one auto-scan when this modal opens
  useEffect(() => {
    if (!isOpen) {
      didAutoScanRef.current = false;
      return;
    }

    let cancelled = false;

    const hydrateAndMaybeScan = async () => {
      await router.getProvider('local');

      const saved = useTerminalStore.getState().localAiBaseUrl;
      if (saved) {
        localProvider.setBaseUrl(saved);
        setCustomLocalUrl(saved);
        await localProvider.refreshModels().catch(() => {});
        router.setProviderApiKey('local', 'local');
        setLocalHits(localProvider.getLastHits());
        setLocalCorsFailed(localProvider.getLastCorsFailure());
        setLocalStatusTick((n) => n + 1);
        return;
      }

      if (didAutoScanRef.current) return;
      didAutoScanRef.current = true;

      setLocalScanning(true);
      try {
        const hits = await scanLocalAI(false);
        if (cancelled) return;
        setLocalHits(hits);
        setLocalCorsFailed(localProvider.getLastCorsFailure());
        if (hits.length > 0) {
          const first = hits[0];
          localProvider.applyScanHit(first);
          setLocalAiBaseUrl(first.baseUrl);
          setCustomLocalUrl(first.baseUrl);
          router.setProviderApiKey('local', 'local');
          const current = useTerminalStore.getState().activeProvider;
          if (!current) {
            const modelId = first.models[0]?.id || localProvider.getDefaultModel().id;
            setActiveProvider('local', modelId);
          }
        }
        setLocalStatusTick((n) => n + 1);
      } finally {
        if (!cancelled) setLocalScanning(false);
      }
    };

    hydrateAndMaybeScan();
    return () => {
      cancelled = true;
    };
  }, [isOpen, router, setActiveProvider, setLocalAiBaseUrl]);

  const handlePasswordSubmit = (password: string, hash: string, duration: 'daily' | 'weekly' | 'monthly') => {
    setEncryptionPassword(password, hash, duration);
    setShowPasswordPrompt(false);

    // If user was trying to save a provider, save it now
    if (selectedProvider && apiKeyInputs[selectedProvider]) {
      saveProviderKey(selectedProvider, apiKeyInputs[selectedProvider], password);
    }
  };

  const saveProviderKey = async (providerId: string, apiKey: string, password: string) => {
    try {
      await setProviderApiKey(providerId, apiKey, password);
      setApiKeyInputs((prev) => ({ ...prev, [providerId]: '' }));
      setValidationResults((prev) => ({ ...prev, [providerId]: null }));

      // Store API key in router (will be applied when provider loads)
      router.setProviderApiKey(providerId, apiKey);

      // Try to load provider and set as active
      const provider = await router.getProvider(providerId);
      if (provider) {
        // Auto-switch to this provider after saving
        const defaultModel = provider.getDefaultModel();
        if (defaultModel) {
          setActiveProvider(providerId, defaultModel.id);
        }
      }
    } catch (error) {
      console.error('Failed to save API key:', error);
      toast.error('保存 API 密钥失败', '请重试。');
    }
  };

  const handleSaveApiKey = (providerId: string) => {
    const apiKey = apiKeyInputs[providerId];
    if (!apiKey || !apiKey.trim()) return;

    // Check if password is needed
    if (!encryptionPassword || isPasswordExpired()) {
      setSelectedProvider(providerId);
      setShowPasswordPrompt(true);
      return;
    }

    saveProviderKey(providerId, apiKey, encryptionPassword);
  };

  const handleClearApiKey = (providerId: string) => {
    setProviderToClear(providerId);
  };

  const confirmClearApiKey = () => {
    if (providerToClear) {
      clearProviderApiKey(providerToClear);
      setApiKeyInputs((prev) => ({ ...prev, [providerToClear]: '' }));
      setValidationResults((prev) => ({ ...prev, [providerToClear]: null }));
      setProviderToClear(null);
    }
  };

  const handleTestApiKey = async (providerId: string) => {
    const apiKey = apiKeyInputs[providerId];
    if (!apiKey || !apiKey.trim()) {
      toast.warning('请先输入 API 密钥');
      return;
    }

    setValidating((prev) => ({ ...prev, [providerId]: true }));

    try {
      // Load provider SDK on-demand for validation
      const provider = await router.getProvider(providerId);
      if (!provider) {
        throw new Error('未找到服务商');
      }

      const isValid = await provider.validateApiKey(apiKey);
      setValidationResults((prev) => ({ ...prev, [providerId]: isValid }));

      if (isValid) {
        toast.success('API 密钥有效', `${providerStatus[providerId]?.name} 已就绪。`);
      } else {
        toast.error('API 密钥无效', `请检查 ${providerStatus[providerId]?.name} 密钥。`);
      }
    } catch (error: unknown) {
      console.error('API key validation error:', error);
      setValidationResults((prev) => ({ ...prev, [providerId]: false }));
      const message = error instanceof Error ? error.message : '未知错误';
      toast.error('校验出错', message);
    } finally {
      setValidating((prev) => ({ ...prev, [providerId]: false }));
    }
  };

  const toggleShowApiKey = (providerId: string) => {
    setShowApiKeys((prev) => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const runtimeLabel = (runtime: LocalAIRuntime | null) => {
    if (runtime === 'ollama') return 'Ollama';
    if (runtime === 'lmstudio') return 'LM Studio';
    if (runtime === 'openai-compat') return 'OpenAI 兼容';
    return '未知运行时';
  };

  const selectLocalHit = (hit: LocalAIScanHit) => {
    localProvider.applyScanHit(hit);
    setLocalAiBaseUrl(hit.baseUrl);
    setCustomLocalUrl(hit.baseUrl);
    router.setProviderApiKey('local', 'local');
    const modelId = hit.models[0]?.id || localProvider.getDefaultModel().id;
    setActiveProvider('local', modelId);
    setLocalHits(localProvider.getLastHits().length ? localProvider.getLastHits() : [hit]);
    setLocalCorsFailed(false);
    setLocalStatusTick((n) => n + 1);
    toast.success('已识别本机 AI', `${runtimeLabel(hit.runtime)} · ${hit.baseUrl}`);
  };

  const handleScanLocal = async () => {
    setLocalScanning(true);
    try {
      const hits = await scanLocalAI(true);
      setLocalHits(hits);
      setLocalCorsFailed(localProvider.getLastCorsFailure());
      if (hits.length > 0) {
        const saved = useTerminalStore.getState().localAiBaseUrl;
        const first = hits[0];
        localProvider.applyScanHit(first);
        if (!saved) {
          setLocalAiBaseUrl(first.baseUrl);
          setCustomLocalUrl(first.baseUrl);
        }
        router.setProviderApiKey('local', 'local');
        const current = useTerminalStore.getState().activeProvider;
        if (!current) {
          const modelId = first.models[0]?.id || localProvider.getDefaultModel().id;
          setActiveProvider('local', modelId);
        }
        toast.success('已识别本机 AI', `${runtimeLabel(first.runtime)} · ${first.models.length} 个模型`);
      } else {
        toast.warning('未发现本机 AI', '请确认 Ollama / LM Studio 等已启动。');
      }
      setLocalStatusTick((n) => n + 1);
    } catch (error) {
      console.error('Local AI scan failed:', error);
      setLocalCorsFailed(localProvider.getLastCorsFailure());
      toast.error('扫描失败', error instanceof Error ? error.message : '未知错误');
    } finally {
      setLocalScanning(false);
    }
  };

  const handleUseCustomLocalUrl = async () => {
    const url = normalizeBaseUrl(customLocalUrl);
    if (!url) {
      toast.warning('请填写本机服务地址');
      return;
    }
    setLocalScanning(true);
    try {
      localProvider.setBaseUrl(url);
      await localProvider.refreshModels();
      setLocalAiBaseUrl(url);
      router.setProviderApiKey('local', 'local');
      const modelId = localProvider.getDefaultModel().id;
      setActiveProvider('local', modelId);
      setLocalHits([
        {
          runtime: localProvider.getRuntime(),
          baseUrl: url,
          models: localProvider.models.map((m) => ({ id: m.id, name: m.name })),
        },
      ]);
      setLocalCorsFailed(localProvider.getLastCorsFailure());
      setLocalStatusTick((n) => n + 1);
      if (localProvider.getLastCorsFailure()) {
        toast.error('无法访问该地址', corsHintText());
      } else {
        toast.success('已使用此地址', url);
      }
    } catch (error) {
      setLocalCorsFailed(localProvider.getLastCorsFailure());
      toast.error('无法使用此地址', error instanceof Error ? error.message : '未知错误');
    } finally {
      setLocalScanning(false);
    }
  };

  const handleClearLocal = () => {
    localProvider.clearBaseUrl();
    setLocalAiBaseUrl(null);
    router.clearProviderApiKey('local');
    setLocalHits([]);
    setCustomLocalUrl('');
    setLocalCorsFailed(false);
    setLocalStatusTick((n) => n + 1);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="AI 服务商设置"
        maxWidth="2xl"
      >
        <div className="space-y-3">
          {/* Header Description */}
          <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
            <p className="mb-1">
              配置 AI 服务商 API 密钥。密钥使用 AES-256-CBC 加密并保存在本地。
            </p>
            <p className="text-[10px]">
              <span className="text-accent-green">🟢 免费</span>模型可用
              {' • '}
              <span className="text-accent-blue">🔵 付费</span> BYOK（自带密钥）
              {' • '}
              <span className="text-accent-yellow">⚠️</span> 需要后端代理（CORS）
            </p>
          </div>

          {/* Provider List */}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {Object.entries(providerMetadataList).map(([providerId, metadata]) => {
              const status = providerStatus[providerId];
              const isLocal = providerId === 'local';
              const isConfigured = isLocal
                ? localProvider.isConfigured() || !!localAiBaseUrl
                : status?.configured || false;

              return (
                <div
                  key={providerId}
                  className="p-3 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-button"
                >
                  {/* Provider Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2.5 flex-1">
                      {/* Provider Favicon */}
                      {metadata.websiteUrl && (
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${new URL(metadata.websiteUrl).hostname}&sz=32`}
                          alt=""
                          className="w-5 h-5 mt-0.5 rounded-sm flex-shrink-0"
                          onError={(e) => {
                            // Hide on error - fall back to no icon
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                          {metadata.displayName}
                        </h3>
                        {metadata.hasFreeModels && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-accent-green/10 text-accent-green rounded">
                            免费模型
                          </span>
                        )}
                        {!metadata.supportsCORS && metadata.requiresProxy && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 bg-accent-yellow/10 text-accent-yellow rounded cursor-help"
                            title="此服务商会拦截浏览器直连（CORS）。请改用 OpenRouter，它可访问该服务商模型并直接在浏览器中使用。"
                          >
                            ⚠️ 需要代理
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                        {metadata.description}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-text-light-secondary dark:text-text-dark-secondary">
                        <span>{status?.modelCount || 0} 个模型</span>
                        {metadata.apiKeyUrl && (
                          <>
                            <span>•</span>
                            <a
                              href={metadata.apiKeyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent-blue hover:text-accent-blue-hover"
                            >
                              获取 API 密钥 →
                            </a>
                          </>
                        )}
                        {metadata.docsUrl && (
                          <>
                            <span>•</span>
                            <a
                              href={metadata.docsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent-blue hover:text-accent-blue-hover"
                            >
                              文档 →
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-1.5">
                      {isLocal ? (
                        isConfigured ? (
                          <span className="text-[10px] px-1.5 py-0.5 bg-accent-green/10 text-accent-green rounded">
                            ✓ 已识别
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary rounded">
                            未发现
                          </span>
                        )
                      ) : isConfigured ? (
                        <span className="text-[10px] px-1.5 py-0.5 bg-accent-green/10 text-accent-green rounded">
                          ✓ 已配置
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary rounded">
                          未配置
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Local AI controls (no API key) */}
                  {isLocal && (
                    <div className="space-y-1.5">
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={handleScanLocal}
                          disabled={localScanning}
                          className="px-2.5 py-1 bg-accent-blue hover:bg-accent-blue-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-button text-xs transition-all duration-standard ease-smooth"
                        >
                          {localScanning ? '扫描中...' : '扫描本机'}
                        </button>
                        {isConfigured && (
                          <button
                            type="button"
                            onClick={() => {
                              const modelId = localProvider.getDefaultModel().id;
                              setActiveProvider('local', modelId);
                              toast.success('已切换到本地', modelId);
                            }}
                            className="px-2.5 py-1 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-surface-light dark:hover:bg-surface-dark border border-border-light dark:border-border-dark rounded-button text-xs text-text-light-primary dark:text-text-dark-primary transition-all duration-standard ease-smooth"
                          >
                            {activeProvider === 'local' ? '当前服务商' : '设为当前'}
                          </button>
                        )}
                        {isConfigured && (
                          <button
                            type="button"
                            onClick={handleClearLocal}
                            className="px-2.5 py-1 bg-accent-red/10 hover:bg-accent-red/20 border border-accent-red/20 rounded-button text-xs text-accent-red transition-all duration-standard ease-smooth"
                          >
                            清除地址
                          </button>
                        )}
                      </div>

                      {localHits.length > 0 && (
                        <div className="space-y-1.5">
                          {localHits.map((hit) => (
                            <div
                              key={hit.baseUrl}
                              className="p-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-button"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-text-light-primary dark:text-text-dark-primary">
                                    {runtimeLabel(hit.runtime)}
                                  </p>
                                  <p className="text-[10px] text-text-light-secondary dark:text-text-dark-secondary truncate">
                                    {hit.baseUrl}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => selectLocalHit(hit)}
                                  className="flex-shrink-0 px-2 py-0.5 bg-accent-blue hover:bg-accent-blue-hover text-white rounded-button text-[10px]"
                                >
                                  使用
                                </button>
                              </div>
                              {hit.models.length > 0 && (
                                <ul className="mt-1 text-[10px] text-text-light-secondary dark:text-text-dark-secondary space-y-0.5">
                                  {hit.models.slice(0, 8).map((m) => (
                                    <li key={m.id}>• {m.name}</li>
                                  ))}
                                  {hit.models.length > 8 && (
                                    <li>…共 {hit.models.length} 个模型</li>
                                  )}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={customLocalUrl}
                          onChange={(e) => setCustomLocalUrl(e.target.value)}
                          placeholder="自定义地址，例如 http://127.0.0.1:11434"
                          className="flex-1 px-2.5 py-1.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-button focus:outline-none focus:ring-2 focus:ring-accent-blue text-text-light-primary dark:text-text-dark-primary text-xs"
                          autoComplete="off"
                        />
                        <button
                          type="button"
                          onClick={handleUseCustomLocalUrl}
                          disabled={!customLocalUrl.trim() || localScanning}
                          className="px-2.5 py-1 bg-accent-blue hover:bg-accent-blue-hover disabled:bg-surface-light-elevated dark:disabled:bg-surface-dark-elevated disabled:text-text-light-tertiary dark:disabled:text-text-dark-tertiary disabled:cursor-not-allowed text-white rounded-button text-xs transition-all duration-standard ease-smooth"
                        >
                          使用此地址
                        </button>
                      </div>

                      {localCorsFailed && (
                        <div className="p-2 bg-accent-yellow/10 border border-accent-yellow/20 rounded-button text-[10px] text-accent-yellow space-y-1 whitespace-pre-line">
                          <p>浏览器无法访问本机服务（可能是 CORS 限制）：</p>
                          <p>{corsHintText()}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* API Key Input — hidden for providers that do not need a key */}
                  {metadata.requiresApiKey !== false && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1.5">
                      <div className="flex-1 relative">
                        <input
                          type={showApiKeys[providerId] ? 'text' : 'password'}
                          value={apiKeyInputs[providerId] || ''}
                          onChange={(e) =>
                            setApiKeyInputs((prev) => ({ ...prev, [providerId]: e.target.value }))
                          }
                          placeholder={
                            isConfigured
                              ? '输入新 API 密钥以替换现有密钥'
                              : `输入你的 ${metadata.apiKeyLabel || 'API 密钥'}`
                          }
                          className="w-full px-2.5 py-1.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-button focus:outline-none focus:ring-2 focus:ring-accent-blue text-text-light-primary dark:text-text-dark-primary text-xs"
                          autoComplete="off"
                        />
                        <button
                          type="button"
                          onClick={() => toggleShowApiKey(providerId)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary text-[10px]"
                        >
                          {showApiKeys[providerId] ? '隐藏' : '显示'}
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleSaveApiKey(providerId)}
                        disabled={!apiKeyInputs[providerId]?.trim()}
                        className="px-2.5 py-1 bg-accent-blue hover:bg-accent-blue-hover disabled:bg-surface-light-elevated dark:disabled:bg-surface-dark-elevated disabled:text-text-light-tertiary dark:disabled:text-text-dark-tertiary disabled:cursor-not-allowed text-white rounded-button text-xs transition-all duration-standard ease-smooth"
                      >
                        {isConfigured ? '更新' : '保存'}
                      </button>

                      <button
                        onClick={() => handleTestApiKey(providerId)}
                        disabled={!apiKeyInputs[providerId]?.trim() || validating[providerId]}
                        className="px-2.5 py-1 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-surface-light dark:hover:bg-surface-dark disabled:opacity-50 disabled:cursor-not-allowed border border-border-light dark:border-border-dark rounded-button text-xs text-text-light-primary dark:text-text-dark-primary transition-all duration-standard ease-smooth"
                      >
                        {validating[providerId] ? '测试中...' : '测试密钥'}
                      </button>

                      {isConfigured && (
                        <button
                          onClick={() => handleClearApiKey(providerId)}
                          className="px-2.5 py-1 bg-accent-red/10 hover:bg-accent-red/20 border border-accent-red/20 rounded-button text-xs text-accent-red transition-all duration-standard ease-smooth"
                        >
                          移除
                        </button>
                      )}

                      {/* Validation Result */}
                      {validationResults[providerId] !== null && (
                        <span
                          className={`px-1.5 py-1 text-[10px] rounded-button ${
                            validationResults[providerId]
                              ? 'bg-accent-green/10 text-accent-green'
                              : 'bg-accent-red/10 text-accent-red'
                          }`}
                        >
                          {validationResults[providerId] ? '✓ 有效' : '✗ 无效'}
                        </span>
                      )}
                    </div>
                  </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* AI Context Settings */}
          <div className="pt-3 border-t border-border-light dark:border-border-dark space-y-2">
            <h3 className="text-xs font-semibold text-text-light-primary dark:text-text-dark-primary">
              AI 上下文
            </h3>
            <div className="flex items-start justify-between gap-4 p-3 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-button">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-text-light-primary dark:text-text-dark-primary">
                  跨模块上下文
                </div>
                <div className="text-[11px] text-text-light-secondary dark:text-text-dark-secondary mt-0.5">
                  在 AI 对话中包含笔记、任务、日历和习惯数据
                </div>
              </div>
              <button
                role="switch"
                aria-checked={enableCrossModuleContext}
                onClick={() => setEnableCrossModuleContext(!enableCrossModuleContext)}
                className={`flex-shrink-0 relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue ${
                  enableCrossModuleContext
                    ? 'bg-accent-blue'
                    : 'bg-surface-dark dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark'
                }`}
                aria-label="切换跨模块上下文"
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                    enableCrossModuleContext ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end pt-3 border-t border-border-light dark:border-border-dark">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-accent-blue hover:bg-accent-blue-hover text-white rounded-button text-xs transition-all duration-standard ease-smooth"
            >
              完成
            </button>
          </div>
        </div>
      </Modal>

      {/* Password Prompt Modal */}
      <PasswordPrompt
        isOpen={showPasswordPrompt}
        onSubmit={handlePasswordSubmit}
        onCancel={() => {
          setShowPasswordPrompt(false);
          setSelectedProvider(null);
        }}
        mode={passwordHash ? 'unlock' : 'setup'}
        existingPasswordHash={passwordHash || undefined}
      />

      {/* Confirm Clear API Key Dialog */}
      <ConfirmDialog
        isOpen={providerToClear !== null}
        onClose={() => setProviderToClear(null)}
        onConfirm={confirmClearApiKey}
        title="移除 API 密钥"
        message={providerToClear ? `确定移除 ${providerStatus[providerToClear]?.name || providerToClear} 的 API 密钥？再次使用该服务商需要重新输入。` : ''}
        confirmText="移除"
        variant="danger"
      />
    </>
  );
}
