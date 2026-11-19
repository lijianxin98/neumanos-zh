/**
 * AI Terminal Settings Component
 *
 * Multi-provider AI configuration information and setup instructions.
 * Actual provider configuration is done via the AI Terminal's settings modal.
 */

import React from 'react';
export const AITerminalSettings: React.FC = () => {
  return (
    <div className="bento-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">🤖</span>
        <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
          AI 终端
        </h2>
      </div>

      <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
        多服务商 AI 助手，可自动识别本机 Ollama、LM Studio，也支持多家云服务商。主服务商失败时会自动切换，更稳定。
      </p>

      {/* Quick Info */}
      <div className="mb-6 p-4 bg-status-info-bg dark:bg-status-info-bg-dark border border-status-info-border dark:border-status-info-border-dark rounded-lg">
        <p className="text-sm text-status-info-text dark:text-status-info-text-dark mb-2">
          <strong>🎯 全新多服务商体系</strong>
        </p>
        <ul className="text-xs text-status-info-text dark:text-status-info-text-dark space-y-1">
          <li>• 可选本地模型（Ollama、LM Studio）以及多家云服务商（OpenRouter、Groq、HuggingFace、Mistral、Gemini、OpenAI、Claude、Grok）</li>
          <li>• 提供免费模型（OpenRouter、Groq、HuggingFace、Mistral）</li>
          <li>• 主服务商失败时自动切换</li>
          <li>• API 密钥加密存储并受密码保护</li>
          <li>• 按服务商统计用量</li>
        </ul>
      </div>

      {/* Configure Providers Button */}
      <div className="space-y-4">
        <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
          点击右下角的 AI 终端按钮，再点 ⚙️ 设置 来配置服务商。
        </p>

        <div className="p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg">
          <p className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-2">
            如何设置：
          </p>
          <ol className="text-sm text-text-light-secondary dark:text-text-dark-secondary space-y-1 list-decimal list-inside">
            <li>打开 AI 终端（右下角 🤖 按钮）</li>
            <li>点击终端标题栏的 ⚙️ 设置</li>
            <li>为常用服务商添加 API 密钥</li>
            <li>用 🔀 按钮选择模型</li>
            <li>开始对话！</li>
          </ol>
        </div>

        {/* Free Provider Quick Links */}
        <div className="p-4 bg-status-success-bg dark:bg-status-success-bg-dark border border-status-success-border dark:border-status-success-border-dark rounded-lg">
          <p className="text-sm font-semibold text-status-success-text dark:text-status-success-text-dark mb-2">
            免费服务商 API 密钥：
          </p>
          <ul className="text-sm text-status-success-text dark:text-status-success-text-dark space-y-1">
            <li>
              • <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">OpenRouter</a> — 可用 200+ 模型（Llama 3.3、Gemini 2.0）
            </li>
            <li>
              • <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">Groq</a> — 极速推理
            </li>
            <li>
              • <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">HuggingFace</a> — 海量开源模型
            </li>
            <li>
              • <a href="https://console.mistral.ai/api-keys/" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">Mistral</a> — 欧洲 AI 服务商
            </li>
          </ul>
        </div>

      </div>

      {/* Features List */}
      <div className="mt-6 p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg">
        <p className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-2">
          AI 终端能做什么？
        </p>
        <ul className="text-sm text-text-light-secondary dark:text-text-dark-secondary space-y-1">
          <li>💬 回答各类问题</li>
          <li>💻 生成并讲解代码（React、TypeScript、JavaScript）</li>
          <li>🔧 帮忙排查错误和问题</li>
          <li>📝 协助提升效率与规划</li>
          <li>🔄 服务商故障时自动切换</li>
          <li>📊 统计各服务商用量</li>
        </ul>
      </div>
    </div>
  );
};
