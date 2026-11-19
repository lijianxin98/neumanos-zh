/**
 * Aliyun Drive settings — official OpenAPI backup connector.
 * Credentials stay on this device (IndexedDB). UI is Simplified Chinese.
 * Only the backup folder is listed; this is not a general file manager.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Cloud,
  CloudOff,
  Download,
  Eye,
  EyeOff,
  RefreshCw,
  Unplug,
  Upload,
  ExternalLink,
} from 'lucide-react';
import {
  useAliyunDriveStore,
  waitForAliyunDriveHydration,
} from '../../stores/useAliyunDriveStore';
import {
  AliyunDriveError,
  BACKUP_FOLDER_NAME,
  CORS_DOWNLOAD_HINT,
  connectWithRefreshToken,
  ensureFolder,
  exchangeAuthorizationCode,
  getAuthorizeUrl,
  getDownloadUrl,
  getRedirectUri,
  getSpaceInfo,
  hydrateProfile,
  isCorsFailure,
  listFiles,
  uploadBlob,
  type AliyunFileItem,
  type AliyunSpaceInfo,
} from '../../services/aliyunDrive';
import {
  buildBrainBackupBlob,
  formatFileSize,
  importBrainFile,
} from '../../services/brainBackup';
import { logger } from '../../services/logger';

const log = logger.module('阿里云盘');

const handledOAuthCodes = new Set<string>();

function formatBackupFilename(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `超级工作台-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}.brain`;
}

function formatUpdatedAt(value?: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('zh-CN', { hour12: false });
}

function isBrainFile(item: AliyunFileItem): boolean {
  if (item.type !== 'file') return false;
  const ext = (item.file_extension || '').toLowerCase();
  return ext === 'brain' || item.name.toLowerCase().endsWith('.brain');
}

export const AliyunDriveSettings: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const clientId = useAliyunDriveStore((s) => s.clientId);
  const clientSecret = useAliyunDriveStore((s) => s.clientSecret);
  const refreshToken = useAliyunDriveStore((s) => s.refreshToken);
  const accessToken = useAliyunDriveStore((s) => s.accessToken);
  const nickName = useAliyunDriveStore((s) => s.nickName);
  const avatar = useAliyunDriveStore((s) => s.avatar);
  const connectedAt = useAliyunDriveStore((s) => s.connectedAt);
  const setCredentials = useAliyunDriveStore((s) => s.setCredentials);
  const disconnect = useAliyunDriveStore((s) => s.disconnect);

  const connected = Boolean(refreshToken || accessToken);

  const [appId, setAppId] = useState(clientId);
  const [appSecret, setAppSecret] = useState(clientSecret);
  const [refreshTokenPaste, setRefreshTokenPaste] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [showRefresh, setShowRefresh] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(() => useAliyunDriveStore.persist.hasHydrated());

  const backupFolderIdRef = useRef<string | null>(null);
  const [files, setFiles] = useState<AliyunFileItem[]>([]);
  const [listing, setListing] = useState(false);
  const [space, setSpace] = useState<AliyunSpaceInfo | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<AliyunFileItem | null>(null);

  const redirectUri = useMemo(() => (typeof window !== 'undefined' ? getRedirectUri() : ''), []);
  const oauthHandledRef = useRef(false);

  const displayedFiles = useMemo(() => {
    const items = files.filter((item) => item.type === 'file');
    return [...items].sort((a, b) => Number(isBrainFile(b)) - Number(isBrainFile(a)));
  }, [files]);

  useEffect(() => {
    setAppId(clientId);
    setAppSecret(clientSecret);
  }, [clientId, clientSecret]);

  useEffect(() => {
    let cancelled = false;
    waitForAliyunDriveHydration().then(() => {
      if (!cancelled) setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const showError = (err: unknown) => {
    const text = err instanceof AliyunDriveError ? err.message : err instanceof Error ? err.message : String(err);
    setMessage({ type: 'error', text });
    log.error(text, { error: err });
  };

  const refreshBackupList = useCallback(async () => {
    setListing(true);
    try {
      const folderId =
        backupFolderIdRef.current ?? (await ensureFolder(BACKUP_FOLDER_NAME, 'root'));
      backupFolderIdRef.current = folderId;
      const result = await listFiles(folderId);
      setFiles(result.items);
      const spaceInfo = await getSpaceInfo();
      if (spaceInfo) setSpace(spaceInfo);
    } catch (error) {
      showError(error);
    } finally {
      setListing(false);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || !connected) return;
    refreshBackupList();
    hydrateProfile().catch((err) => log.warn('hydrateProfile on mount failed', { error: err }));
    // Only on connect/hydrate
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, connected]);

  useEffect(() => {
    if (!hydrated) return;
    const code = searchParams.get('code');
    if (!code || oauthHandledRef.current) return;
    if (handledOAuthCodes.has(code)) return;
    handledOAuthCodes.add(code);
    oauthHandledRef.current = true;

    const run = async () => {
      setBusy('oauth');
      setMessage({ type: 'info', text: '正在用授权码换取令牌…' });
      try {
        await exchangeAuthorizationCode(code);
        setMessage({ type: 'success', text: '授权成功，已连接到阿里云盘。' });
        setSearchParams({ tab: 'cloud' }, { replace: true });
        await refreshBackupList();
      } catch (error) {
        showError(error);
        setSearchParams({ tab: 'cloud' }, { replace: true });
      } finally {
        setBusy(null);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, searchParams]);

  const handleSaveCredentials = async () => {
    if (!appId.trim() || !appSecret.trim()) {
      setMessage({ type: 'error', text: '请填写 App ID 和 App Secret' });
      return;
    }
    setCredentials(appId, appSecret);
    if (refreshTokenPaste.trim()) {
      setBusy('refresh');
      try {
        await connectWithRefreshToken(refreshTokenPaste.trim());
        setRefreshTokenPaste('');
        setMessage({ type: 'success', text: '凭证已保存，并已用 Refresh Token 连接。' });
        await refreshBackupList();
      } catch (error) {
        showError(error);
      } finally {
        setBusy(null);
      }
      return;
    }
    setMessage({ type: 'success', text: '凭证已保存在本机浏览器。' });
  };

  const handleAuthorize = () => {
    if (!appId.trim() || !appSecret.trim()) {
      setMessage({ type: 'error', text: '请先填写并保存 App ID 和 App Secret' });
      return;
    }
    setCredentials(appId, appSecret);
    window.location.href = getAuthorizeUrl(appId.trim());
  };

  const handleDisconnect = () => {
    disconnect();
    setAppId('');
    setAppSecret('');
    setRefreshTokenPaste('');
    setFiles([]);
    backupFolderIdRef.current = null;
    setSpace(null);
    setMessage({ type: 'info', text: '已断开连接，本机凭证已清除。' });
  };

  const handleBackup = async () => {
    setBusy('backup');
    setMessage(null);
    try {
      const folderId =
        backupFolderIdRef.current ?? (await ensureFolder(BACKUP_FOLDER_NAME, 'root'));
      backupFolderIdRef.current = folderId;
      const { blob } = await buildBrainBackupBlob({ compressed: true });
      const filename = formatBackupFilename();
      await uploadBlob(blob, filename, folderId);
      setMessage({ type: 'success', text: `已备份到「${BACKUP_FOLDER_NAME}/${filename}」。` });
      await refreshBackupList();
    } catch (error) {
      showError(error);
    } finally {
      setBusy(null);
    }
  };

  const handleOpenDownload = async (item: AliyunFileItem) => {
    try {
      const { url } = await getDownloadUrl(item.file_id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      showError(error);
    }
  };

  const handleRestore = async (item: AliyunFileItem) => {
    setBusy(`restore:${item.file_id}`);
    setMessage(null);
    try {
      const { url } = await getDownloadUrl(item.file_id);
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`下载失败（HTTP ${res.status}）`);
        const blob = await res.blob();
        const file = new File([blob], item.name.endsWith('.brain') ? item.name : `${item.name}.brain`, {
          type: 'application/octet-stream',
        });
        const result = await importBrainFile(file);
        if (result.success) {
          setMessage({ type: 'success', text: `${result.message} 即将刷新页面…` });
          setTimeout(() => window.location.reload(), 2000);
        } else {
          setMessage({ type: 'error', text: result.message });
        }
      } catch (fetchErr) {
        if (isCorsFailure(fetchErr) || fetchErr instanceof TypeError) {
          window.open(url, '_blank', 'noopener,noreferrer');
          setMessage({ type: 'warning', text: CORS_DOWNLOAD_HINT });
        } else {
          throw fetchErr;
        }
      }
    } catch (error) {
      showError(error);
    } finally {
      setBusy(null);
      setConfirmRestore(null);
    }
  };

  const used = space?.personal_space_info?.used_size;
  const total = space?.personal_space_info?.total_size;

  return (
    <div className="space-y-6">
      <div className="bento-card p-6">
        <div className="flex items-center gap-3 mb-4">
          {connected ? (
            <Cloud className="w-5 h-5 text-accent-primary" />
          ) : (
            <CloudOff className="w-5 h-5 text-accent-primary" />
          )}
          <div>
            <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
              云盘备份
            </h2>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              把工作台数据备份到阿里云盘。凭证只存在本机。
            </p>
          </div>
        </div>

        <ol className="mb-6 space-y-2 text-sm text-text-light-secondary dark:text-text-dark-secondary list-decimal list-inside">
          <li>
            打开{' '}
            <a
              href="https://www.alipan.com/developer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-primary hover:underline inline-flex items-center gap-1"
            >
              阿里云盘开放平台
              <ExternalLink className="w-3 h-3" />
            </a>{' '}
            创建应用
          </li>
          <li>回调地址填当前页展示的 Redirect URI</li>
          <li>把 App ID、App Secret 贴进来并保存</li>
          <li>点「授权登录」</li>
        </ol>

        <div className="mb-4 p-3 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg">
          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mb-1">Redirect URI</p>
          <code className="text-xs break-all text-text-light-primary dark:text-text-dark-primary">
            {redirectUri}
          </code>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
              App ID
            </label>
            <input
              type="text"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              autoComplete="off"
              placeholder="开放平台应用 App ID"
              className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
              App Secret
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={appSecret}
                onChange={(e) => setAppSecret(e.target.value)}
                autoComplete="off"
                placeholder="开放平台应用 App Secret"
                className="w-full px-3 py-2 pr-10 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
              <button
                type="button"
                onClick={() => setShowSecret((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-light-tertiary dark:text-text-dark-tertiary hover:text-text-light-primary dark:hover:text-text-dark-primary"
                aria-label={showSecret ? '隐藏 Secret' : '显示 Secret'}
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
              Refresh Token（可选）
            </label>
            <div className="relative">
              <input
                type={showRefresh ? 'text' : 'password'}
                value={refreshTokenPaste}
                onChange={(e) => setRefreshTokenPaste(e.target.value)}
                autoComplete="off"
                placeholder="若已有官方开放平台 refresh_token，可贴在这里"
                className="w-full px-3 py-2 pr-10 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
              <button
                type="button"
                onClick={() => setShowRefresh((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-light-tertiary dark:text-text-dark-tertiary hover:text-text-light-primary dark:hover:text-text-dark-primary"
                aria-label={showRefresh ? '隐藏 Refresh Token' : '显示 Refresh Token'}
              >
                {showRefresh ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
              仅接受阿里云盘开放平台颁发的 refresh_token，不要用网页版 cookie。
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSaveCredentials}
            disabled={busy !== null}
            className="px-4 py-2 bg-accent-blue hover:bg-accent-blue-hover text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {busy === 'refresh' ? '连接中…' : '保存凭证'}
          </button>
          <button
            type="button"
            onClick={handleAuthorize}
            disabled={busy !== null}
            className="px-4 py-2 bg-accent-primary hover:opacity-90 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {busy === 'oauth' ? '授权中…' : '授权登录'}
          </button>
          {connected && (
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={busy !== null}
              className="px-4 py-2 inline-flex items-center gap-2 bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary text-sm font-medium rounded-lg border border-border-light dark:border-border-dark hover:bg-border-light dark:hover:bg-border-dark transition-colors disabled:opacity-50"
            >
              <Unplug className="w-4 h-4" />
              断开连接
            </button>
          )}
        </div>

        <div className="mt-4 p-3 bg-status-info-bg dark:bg-status-info-bg-dark border border-status-info-border dark:border-status-info-border-dark rounded-lg">
          <p className="text-xs text-status-info-text dark:text-status-info-text-dark">
            <strong>本地优先：</strong>网盘只做备份。工作台数据仍以本机 IndexedDB 为准。凭证只存在本机浏览器。
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-status-success-bg dark:bg-status-success-bg-dark text-status-success-text dark:text-status-success-text-dark border border-status-success-border dark:border-status-success-border-dark'
              : message.type === 'error'
                ? 'bg-status-error-bg dark:bg-status-error-bg-dark text-status-error-text dark:text-status-error-text-dark border border-status-error-border dark:border-status-error-border-dark'
                : message.type === 'warning'
                  ? 'bg-status-warning-bg dark:bg-status-warning-bg-dark text-status-warning-text dark:text-status-warning-text-dark border border-status-warning-border dark:border-status-warning-border-dark'
                  : 'bg-status-info-bg dark:bg-status-info-bg-dark text-status-info-text dark:text-status-info-text-dark border border-status-info-border dark:border-status-info-border-dark'
          }`}
        >
          {message.text}
        </div>
      )}

      {connected && (
        <div className="bento-card p-6">
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              {avatar ? (
                <img
                  src={avatar}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover border border-border-light dark:border-border-dark"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-accent-primary/10 flex items-center justify-center">
                  <Cloud className="w-5 h-5 text-accent-primary" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium text-text-light-primary dark:text-text-dark-primary truncate">
                  {nickName || '已连接'}
                </p>
                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                  {connectedAt
                    ? `连接于 ${new Date(connectedAt).toLocaleString('zh-CN', { hour12: false })}`
                    : '已授权'}
                  {typeof used === 'number' && typeof total === 'number'
                    ? ` · 已用 ${formatFileSize(used)} / ${formatFileSize(total)}`
                    : ''}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-4">
            <button
              type="button"
              onClick={handleBackup}
              disabled={busy !== null}
              className="px-5 py-2.5 inline-flex items-center gap-2 text-sm font-medium rounded-lg bg-accent-blue hover:bg-accent-blue-hover text-white disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {busy === 'backup' ? '备份中…' : '立即备份到云盘'}
            </button>
            <button
              type="button"
              onClick={() => refreshBackupList()}
              disabled={listing || busy !== null}
              className="px-5 py-2.5 inline-flex items-center gap-2 text-sm font-medium rounded-lg border border-border-light dark:border-border-dark text-text-light-primary dark:text-text-dark-primary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${listing ? 'animate-spin' : ''}`} />
              刷新备份列表
            </button>
          </div>

          <p className="text-sm mb-4 text-text-light-secondary dark:text-text-dark-secondary">
            备份目录：超级工作台
          </p>

          {listing && displayedFiles.length === 0 ? (
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary py-8 text-center">
              加载中…
            </p>
          ) : displayedFiles.length === 0 ? (
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary py-8 text-center">
              还没有云盘备份。点「立即备份到云盘」做一次。
            </p>
          ) : (
            <ul className="divide-y divide-border-light dark:divide-border-dark">
              {displayedFiles.map((item) => (
                <li key={item.file_id} className="py-3 flex items-center gap-3">
                  <Download className="w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-light-primary dark:text-text-dark-primary truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                      {typeof item.size === 'number' ? `${formatFileSize(item.size)} · ` : ''}
                      {formatUpdatedAt(item.updated_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenDownload(item)}
                      className="px-2 py-1 text-xs rounded-md border border-border-light dark:border-border-dark hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated"
                    >
                      下载
                    </button>
                    {isBrainFile(item) && (
                      <button
                        type="button"
                        onClick={() => setConfirmRestore(item)}
                        className="px-2 py-1 text-xs rounded-md bg-accent-primary text-white hover:opacity-90"
                      >
                        恢复
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {confirmRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bento-card p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-2">
              从云盘恢复？
            </h3>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
              将用「{confirmRestore.name}」覆盖本机当前数据。建议先点「导出到本机」留一份备份。此操作不可撤销。
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmRestore(null)}
                className="px-4 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => handleRestore(confirmRestore)}
                disabled={busy !== null}
                className="px-4 py-2 text-sm rounded-lg bg-status-error text-white disabled:opacity-50"
              >
                {busy?.startsWith('restore') ? '恢复中…' : '确认覆盖并恢复'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
