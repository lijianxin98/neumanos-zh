/**
 * Password Prompt Component
 * Handles encryption password setup and unlock for AI provider API keys
 *
 * Features:
 * - Setup mode: Create new password with confirmation
 * - Unlock mode: Enter existing password
 * - Password strength validation (min 12 chars, complexity)
 * - Configurable expiry (daily/weekly/monthly)
 * - Show/hide password toggle
 * - Security tips and best practices
 */

import { useState } from 'react';
import { Modal } from './Modal';
import { validatePassword, hashPassword } from '../services/encryption';

interface PasswordPromptProps {
  isOpen: boolean;
  onSubmit: (password: string, passwordHash: string, duration: 'daily' | 'weekly' | 'monthly') => void;
  onCancel: () => void;
  mode: 'setup' | 'unlock';
  existingPasswordHash?: string;
}

export function PasswordPrompt({
  isOpen,
  onSubmit,
  onCancel,
  mode,
  existingPasswordHash,
}: PasswordPromptProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [duration, setDuration] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate password
    const validation = validatePassword(password);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    // Setup mode: Check password confirmation
    if (mode === 'setup') {
      if (password !== confirmPassword) {
        setError('两次输入的密码不一致，请重试。');
        return;
      }

      // Create password hash and submit (async for WebCrypto)
      const hash = await hashPassword(password);
      onSubmit(password, hash, duration);
    } else {
      // Unlock mode: Verify password against existing hash (async for WebCrypto)
      const hash = await hashPassword(password);
      if (hash !== existingPasswordHash) {
        setError('密码不正确，请重试。');
        return;
      }

      onSubmit(password, hash, duration);
    }

    // Reset form
    setPassword('');
    setConfirmPassword('');
    setError(null);
  };

  const handleCancel = () => {
    setPassword('');
    setConfirmPassword('');
    setError(null);
    onCancel();
  };

  // Real-time password strength indicator
  const getPasswordStrength = (pwd: string): { strength: 'weak' | 'medium' | 'strong'; color: string } => {
    if (pwd.length < 12) return { strength: 'weak', color: 'text-accent-red' };

    let score = 0;
    if (pwd.length >= 16) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    if (score >= 3) return { strength: 'strong', color: 'text-accent-green' };
    if (score >= 2) return { strength: 'medium', color: 'text-accent-yellow' };
    return { strength: 'weak', color: 'text-accent-red' };
  };

  const passwordStrength = password ? getPasswordStrength(password) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={mode === 'setup' ? '设置加密密码' : '解锁 API 密钥'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mode Description */}
        <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
          {mode === 'setup' ? (
            <>
              <p className="mb-2">
                设置一个强密码来加密 AI 服务商的 API 密钥。此密码：
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>不会被存储或发送</li>
                <li>解密 API 密钥时需要用到</li>
                <li>忘记后无法找回</li>
              </ul>
            </>
          ) : (
            <p>输入密码以解密并访问已保存的 API 密钥。</p>
          )}
        </div>

        {/* Password Input */}
        <div>
          <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
            密码
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-button focus:outline-none focus:ring-2 focus:ring-accent-blue text-text-light-primary dark:text-text-dark-primary transition-all duration-standard ease-smooth"
              placeholder={mode === 'setup' ? '输入一个强密码' : '输入你的密码'}
              required
              minLength={12}
              autoFocus
              autoComplete={mode === 'setup' ? 'new-password' : 'current-password'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary text-xs"
            >
              {showPassword ? '隐藏' : '显示'}
            </button>
          </div>

          {/* Password Strength Indicator (Setup Mode Only) */}
          {mode === 'setup' && password && passwordStrength && (
            <div className="mt-1 flex items-center gap-2">
              <div className="flex-1 h-1 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    passwordStrength.strength === 'strong'
                      ? 'bg-accent-green w-full'
                      : passwordStrength.strength === 'medium'
                      ? 'bg-accent-yellow w-2/3'
                      : 'bg-accent-red w-1/3'
                  }`}
                />
              </div>
              <span className={`text-xs ${passwordStrength.color}`}>
                {passwordStrength.strength === 'strong' ? '强' : passwordStrength.strength === 'medium' ? '中' : '弱'}
              </span>
            </div>
          )}
        </div>

        {/* Confirm Password (Setup Mode Only) */}
        {mode === 'setup' && (
          <div>
            <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
              确认密码
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-button focus:outline-none focus:ring-2 focus:ring-accent-blue text-text-light-primary dark:text-text-dark-primary transition-all duration-standard ease-smooth"
              placeholder="再次输入密码"
              required
              minLength={12}
              autoComplete="new-password"
            />
          </div>
        )}

        {/* Password Expiry Duration (Setup Mode Only) */}
        {mode === 'setup' && (
          <div>
            <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
              密码有效期
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value as 'daily' | 'weekly' | 'monthly')}
              className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-button focus:outline-none focus:ring-2 focus:ring-accent-blue text-text-light-primary dark:text-text-dark-primary transition-all duration-standard ease-smooth"
            >
              <option value="daily">每天（每天需重新输入）</option>
              <option value="weekly">每周（每 7 天重新输入）</option>
              <option value="monthly">每月（每 30 天重新输入）</option>
            </select>
            <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
              到期后需要重新输入密码。频率越高越安全。
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-accent-red/10 border border-accent-red/20 rounded-button">
            <p className="text-sm text-accent-red">{error}</p>
          </div>
        )}

        {/* Security Tips (Setup Mode Only) */}
        {mode === 'setup' && (
          <div className="p-3 bg-accent-blue/10 border border-accent-blue/20 rounded-button">
            <p className="text-xs font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
              密码建议：
            </p>
            <ul className="text-xs text-text-light-secondary dark:text-text-dark-secondary space-y-0.5">
              <li>• 至少 12 个字符（建议 16 个以上）</li>
              <li>• 混合大小写字母、数字和符号</li>
              <li>• 建议用密码管理器生成并保存</li>
              <li>• 不要在其他地方重复使用此密码</li>
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 px-4 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-surface-light dark:hover:bg-surface-dark border border-border-light dark:border-border-dark rounded-button text-text-light-primary dark:text-text-dark-primary transition-all duration-standard ease-smooth"
          >
            取消
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-accent-blue hover:bg-accent-blue-hover text-white rounded-button transition-all duration-standard ease-smooth font-medium"
          >
            {mode === 'setup' ? '创建密码' : '解锁'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
