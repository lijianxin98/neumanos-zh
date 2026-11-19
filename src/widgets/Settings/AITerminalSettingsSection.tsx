import React, { useState, useMemo, useEffect } from 'react';
import { useTerminalStore } from '../../stores/useTerminalStore';
import type { QuickNoteMode } from '../../stores/useTerminalStore';
import { ProviderSettings } from '../../components/ProviderSettings';
import { createDefaultRouter, PROVIDER_METADATA } from '../../services/ai/providerRouter';
import { localProvider, scanLocalAI } from '../../services/ai/localProvider';
import { logger } from '../../services/logger';

const log = logger.module('AI:Settings');

const QUICK_NOTE_MODES: { value: QuickNoteMode; label: string; description: string }[] = [
  {
    value: 'permanent',
    label: '长期保留',
    description: '一直用同一份快记。准备好后再手动归档。',
  },
  {
    value: 'daily',
    label: '每天',
    description: '每天一份新快记。旧的会变成普通笔记。',
  },
  {
    value: 'auto-archive',
    label: '自动归档',
    description: '超过指定天数的条目会自动移入每日笔记。',
  },
];

const AUTO_ARCHIVE_OPTIONS = [
  { value: 3, label: '3 天' },
  { value: 7, label: '7 天' },
  { value: 14, label: '14 天' },
  { value: 30, label: '30 天' },
];

/**
 * AI Terminal Settings Section
 * Provides functional AI provider configuration directly in Settings.
 * Changes sync with AI Terminal since both use the same store.
 */
export const AITerminalSettingsSection: React.FC = () => {
  const providers = useTerminalStore((s) => s.providers);
  const activeProvider = useTerminalStore((s) => s.activeProvider);
  const activeModel = useTerminalStore((s) => s.activeModel);
  const encryptionPassword = useTerminalStore((s) => s.encryptionPassword);
  const isPasswordExpired = useTerminalStore((s) => s.isPasswordExpired);
  const localAiBaseUrl = useTerminalStore((s) => s.localAiBaseUrl);
  const setLocalAiBaseUrl = useTerminalStore((s) => s.setLocalAiBaseUrl);
  const setActiveProvider = useTerminalStore((s) => s.setActiveProvider);

  // Quick Note settings
  const quickNoteMode = useTerminalStore((s) => s.quickNoteMode);
  const autoArchiveDays = useTerminalStore((s) => s.autoArchiveDays);
  const setQuickNoteMode = useTerminalStore((s) => s.setQuickNoteMode);
  const setAutoArchiveDays = useTerminalStore((s) => s.setAutoArchiveDays);

  const [showProviderSettings, setShowProviderSettings] = useState(false);
  const [configuredCount, setConfiguredCount] = useState(0);

  // Create router for settings (shares store with AITerminal)
  const router = useMemo(() => createDefaultRouter(), []);

  const providerCount = Object.keys(PROVIDER_METADATA).length;

  // Initialize API keys, hydrate local AI, and count configured providers
  useEffect(() => {
    const initializeAndCount = async () => {
      // Initialize API keys from encrypted storage
      if (encryptionPassword && !isPasswordExpired()) {
        const allProviderIds = Object.keys(PROVIDER_METADATA);
        for (const providerId of allProviderIds) {
          if (providerId === 'local') continue;
          const providerConfig = providers[providerId];
          if (providerConfig && providerConfig.encryptedApiKey) {
            try {
              const decryptedKey = await useTerminalStore.getState().getProviderApiKey(providerId, encryptionPassword);
              if (decryptedKey) {
                router.setProviderApiKey(providerId, decryptedKey);
              }
            } catch (error) {
              log.error(`Failed to decrypt ${providerId} API key`, { error });
            }
          }
        }
      }

      // Local AI: no encryption password. Apply saved URL or scan once.
      await router.getProvider('local');
      const savedUrl = useTerminalStore.getState().localAiBaseUrl;
      if (savedUrl) {
        localProvider.setBaseUrl(savedUrl);
        await localProvider.refreshModels().catch(() => {});
        router.setProviderApiKey('local', 'local');
      } else {
        try {
          const hits = await scanLocalAI(false);
          if (hits.length > 0) {
            const first = hits[0];
            localProvider.applyScanHit(first);
            setLocalAiBaseUrl(first.baseUrl);
            router.setProviderApiKey('local', 'local');
            const current = useTerminalStore.getState().activeProvider;
            if (!current) {
              setActiveProvider('local', first.models[0]?.id || localProvider.getDefaultModel().id);
            }
          }
        } catch (error) {
          log.warn('Local AI auto-scan failed', { error });
        }
      }

      // Count configured providers
      const configured = await router.getConfiguredProviders();
      setConfiguredCount(configured.length);
    };

    initializeAndCount();
  }, [encryptionPassword, isPasswordExpired, providers, router, localAiBaseUrl, setLocalAiBaseUrl, setActiveProvider]);

  // Recount when providers change
  useEffect(() => {
    const countConfigured = async () => {
      const configured = await router.getConfiguredProviders();
      setConfiguredCount(configured.length);
    };
    countConfigured();
  }, [providers, router]);

  return (
    <div className="bento-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
              AI 终端
            </h2>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              {`多服务商 AI 助手，共 ${providerCount} 家可选，可自动识别本机 Ollama、LM Studio`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowProviderSettings(true)}
          className="px-4 py-2 bg-accent-blue hover:bg-accent-blue-hover text-white text-sm font-medium rounded-lg transition-colors"
        >
          配置服务商
        </button>
      </div>

      {/* Provider Status */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg">
          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mb-1">已配置服务商</p>
          <p className="text-2xl font-semibold text-text-light-primary dark:text-text-dark-primary">
            {configuredCount} <span className="text-sm font-normal text-text-light-secondary dark:text-text-dark-secondary">/ {providerCount}</span>
          </p>
        </div>
        <div className="p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg">
          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mb-1">当前服务商</p>
          <p className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary truncate">
            {activeProvider ? (
              <>
                {PROVIDER_METADATA[activeProvider]?.displayName || activeProvider}
                {activeModel && (
                  <span className="text-sm font-normal text-text-light-secondary dark:text-text-dark-secondary block truncate">
                    {activeModel}
                  </span>
                )}
              </>
            ) : (
              <span className="text-text-light-secondary dark:text-text-dark-secondary">未选择</span>
            )}
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="mb-6 p-4 bg-status-info-bg dark:bg-status-info-bg-dark border border-status-info-border dark:border-status-info-border-dark rounded-lg">
        <p className="text-sm text-status-info-text dark:text-status-info-text-dark mb-2">
          <strong>🎯 多服务商体系</strong>
        </p>
        <ul className="text-xs text-status-info-text dark:text-status-info-text-dark space-y-1">
          <li>• {providerCount} 家 AI 服务商（本地、OpenRouter、Groq、HuggingFace、Mistral、Gemini、OpenAI、Claude、Grok、DeepSeek）</li>
          <li>• 可自动识别本机 Ollama、LM Studio 等本地模型</li>
          <li>• 多数云服务商提供免费模型</li>
          <li>• 主服务商失败时自动切换</li>
          <li>• API 密钥加密存储并受密码保护</li>
        </ul>
      </div>

      {/* Quick Note Settings */}
      <div className="mb-6 p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">⚡</span>
          <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
            快记设置
          </h3>
        </div>

        {/* Mode Selection */}
        <div className="mb-4">
          <label className="block text-xs text-text-light-secondary dark:text-text-dark-secondary mb-2">
            快记模式
          </label>
          <div className="space-y-2">
            {QUICK_NOTE_MODES.map((mode) => (
              <label
                key={mode.value}
                className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  quickNoteMode === mode.value
                    ? 'bg-accent-yellow/10 border border-accent-yellow/30'
                    : 'bg-surface-light dark:bg-surface-dark hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated border border-transparent'
                }`}
              >
                <input
                  type="radio"
                  name="quickNoteMode"
                  value={mode.value}
                  checked={quickNoteMode === mode.value}
                  onChange={(e) => setQuickNoteMode(e.target.value as QuickNoteMode)}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                    {mode.label}
                  </span>
                  <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-0.5">
                    {mode.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Auto-Archive Days (only shown in auto-archive mode) */}
        {quickNoteMode === 'auto-archive' && (
          <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark">
            <label className="block text-xs text-text-light-secondary dark:text-text-dark-secondary mb-2">
              归档早于以下时间的条目
            </label>
            <select
              value={autoArchiveDays}
              onChange={(e) => setAutoArchiveDays(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-yellow"
            >
              {AUTO_ARCHIVE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-2">
              超过 {autoArchiveDays} 天的条目会自动移入对应的每日笔记。
            </p>
          </div>
        )}
      </div>

      {/* Chat History Privacy Note */}
      <div className="mb-6 p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark">
        <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
          <strong>隐私说明：</strong>聊天记录以明文保存在本地。可随时在 AI 终端中清除。
        </p>
      </div>

      {/* Free Provider Links */}
      <div className="p-4 bg-status-success-bg dark:bg-status-success-bg-dark border border-status-success-border dark:border-status-success-border-dark rounded-lg">
        <p className="text-sm font-semibold text-status-success-text dark:text-status-success-text-dark mb-2">
          获取免费 API 密钥：
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm text-status-success-text dark:text-status-success-text-dark">
          <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">
            OpenRouter →
          </a>
          <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">
            Groq →
          </a>
          <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">
            HuggingFace →
          </a>
          <a href="https://console.mistral.ai/api-keys/" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">
            Mistral →
          </a>
        </div>
      </div>

      {/* Provider Settings Modal */}
      <ProviderSettings
        isOpen={showProviderSettings}
        onClose={() => setShowProviderSettings(false)}
        router={router}
      />
    </div>
  );
};
