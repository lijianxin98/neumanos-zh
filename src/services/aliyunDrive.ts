/**
 * Aliyun Drive (阿里云盘) official OpenAPI client.
 *
 * Browser calls go through the same-origin Vite proxy at `/aliyun-open`
 * (rewritten to https://openapi.alipan.com). OSS upload/download URLs are
 * hit directly — they are a different host and are subject to CORS.
 */

import { logger } from './logger';
import { useAliyunDriveStore } from '../stores/useAliyunDriveStore';

const log = logger.module('阿里云盘');

export const OPEN_API = '/aliyun-open';
export const BACKUP_FOLDER_NAME = '超级工作台';
export const AUTHORIZE_ORIGIN = 'https://openapi.alipan.com';

const CORS_UPLOAD_HINT =
  '上传被浏览器跨域拦住了，请先点「导出到本机」再手动拖进阿里云盘网页版。';
const CORS_DOWNLOAD_HINT =
  '浏览器无法直接读取该文件（跨域）。已在新标签打开下载链接，请下载后使用「导入」恢复。';

export class AliyunDriveError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'AliyunDriveError';
    this.code = code;
  }
}

const ERROR_ZH: Record<string, string> = {
  AccessTokenInvalid: '访问令牌无效，请重新授权登录',
  AccessTokenExpired: '访问令牌已过期，请重新授权登录',
  RefreshTokenExpired: '刷新令牌已过期，请重新授权登录',
  RefreshTokenInvalid: '刷新令牌无效，请重新授权登录',
  InvalidCode: '授权码无效或已使用，请重新点「授权登录」',
  InvalidParameter: '请求参数无效',
  InvalidClient: 'App ID 或 App Secret 不正确',
  invalid_client: 'App ID 或 App Secret 不正确',
  AppNotExists: '应用不存在，请检查 App ID 是否来自阿里云盘开放平台',
  invalid_grant: '授权码或刷新令牌无效，请重新授权',
  unauthorized_client: '应用未获授权，请检查开放平台应用配置',
  Forbidden: '没有权限执行此操作，请检查应用权限范围',
  ForbiddenFileInTheRecycleBin: '文件在回收站中，无法访问',
  NotFound: '未找到资源',
  'NotFound.FileId': '未找到该文件',
  AlreadyExist: '同名文件或文件夹已存在',
  'AlreadyExist.File': '同名文件或文件夹已存在',
  QuotaExhausted: '网盘容量不足',
  'QuotaExhausted.DriveCapacity': '网盘容量不足',
  TooManyRequests: '请求过于频繁，请稍后再试',
  MissingCredentials: '请先填写并保存 App ID 和 App Secret',
  MissingDrive: '尚未获取到云盘信息，请重新授权登录',
  MissingToken: '尚未连接阿里云盘，请先授权登录',
  StateMismatch: 'OAuth state 校验失败，请重新授权',
};

function mapAliyunError(code?: string, message?: string): string {
  if (code && ERROR_ZH[code]) return ERROR_ZH[code];
  if (code && ERROR_ZH[code.replace(/\./g, '')]) return ERROR_ZH[code.replace(/\./g, '')];
  if (message && /expired|过期/i.test(message) && /refresh/i.test(message)) {
    return ERROR_ZH.RefreshTokenExpired;
  }
  return message || (code ? `阿里云盘错误：${code}` : '阿里云盘请求失败');
}

export function isCorsFailure(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message || '';
  return (
    err.name === 'TypeError' ||
    /failed to fetch|networkerror|load failed|cors/i.test(msg)
  );
}

export function getRedirectUri(): string {
  return `${window.location.origin}/settings?tab=cloud`;
}

export function getAuthorizeUrl(clientId: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    scope: 'user:base,file:all:read,file:all:write',
    response_type: 'code',
  });
  return `${AUTHORIZE_ORIGIN}/oauth/authorize?${params.toString()}`;
}

export interface AliyunTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type?: string;
}

export interface AliyunUserInfo {
  id?: string;
  name?: string;
  avatar?: string;
  phone?: string;
}

export interface AliyunDriveInfo {
  user_id?: string;
  name?: string;
  avatar?: string;
  default_drive_id?: string;
  resource_drive_id?: string;
  backup_drive_id?: string;
}

export interface AliyunSpaceInfo {
  personal_space_info?: {
    used_size?: number;
    total_size?: number;
  };
}

export interface AliyunFileItem {
  file_id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  updated_at?: string;
  file_extension?: string;
  parent_file_id?: string;
}

export interface AliyunListResult {
  items: AliyunFileItem[];
  next_marker?: string;
}

export interface AliyunCreateResult {
  file_id: string;
  name?: string;
  type?: string;
  upload_id?: string;
  rapid_upload?: boolean;
  part_info_list?: Array<{
    part_number: number;
    upload_url: string;
    etag?: string;
  }>;
}

export interface AliyunDownloadUrl {
  url: string;
  expiration?: string;
  method?: string;
}

interface TokenRequestBody {
  client_id: string;
  client_secret: string;
  grant_type: 'authorization_code' | 'refresh_token';
  code?: string;
  refresh_token?: string;
}

async function readErrorPayload(res: Response): Promise<{ code?: string; message?: string }> {
  try {
    const data = (await res.json()) as Record<string, unknown>;
    const code = (data.code || data.error || data.errorCode) as string | undefined;
    const message = (data.message || data.error_description || data.msg) as string | undefined;
    return { code, message };
  } catch {
    return {};
  }
}

async function throwApiError(res: Response): Promise<never> {
  const { code, message } = await readErrorPayload(res);
  const resolvedCode = code || `HTTP_${res.status}`;
  throw new AliyunDriveError(resolvedCode, mapAliyunError(resolvedCode, message || res.statusText));
}

async function tokenRequest(body: TokenRequestBody): Promise<AliyunTokenResponse> {
  const res = await fetch(`${OPEN_API}/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    await throwApiError(res);
  }
  const data = (await res.json()) as AliyunTokenResponse;
  if (!data.access_token) {
    throw new AliyunDriveError('InvalidTokenResponse', '未返回 access_token，请检查凭证与授权码');
  }
  return data;
}

function applyTokens(data: AliyunTokenResponse): void {
  const expiresAt = Date.now() + Math.max(1, data.expires_in || 7200) * 1000;
  useAliyunDriveStore.getState().setTokens({
    accessToken: data.access_token,
    refreshToken: data.refresh_token || useAliyunDriveStore.getState().refreshToken,
    expiresAt,
  });
}

let refreshInFlight: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const { clientId, clientSecret, refreshToken } = useAliyunDriveStore.getState();
  if (!clientId || !clientSecret) {
    throw new AliyunDriveError('MissingCredentials', ERROR_ZH.MissingCredentials);
  }
  if (!refreshToken) {
    throw new AliyunDriveError('MissingToken', ERROR_ZH.MissingToken);
  }
  log.info('Refreshing access token');
  const data = await tokenRequest({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
  applyTokens(data);
  const next = useAliyunDriveStore.getState().accessToken;
  if (!next) {
    throw new AliyunDriveError('MissingToken', ERROR_ZH.MissingToken);
  }
  return next;
}

async function getFreshAccessToken(): Promise<string> {
  const store = useAliyunDriveStore.getState();
  if (store.accessToken && store.isAccessTokenFresh()) {
    return store.accessToken;
  }
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export interface OpenApiFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  retryOn401?: boolean;
}

/**
 * Same-origin fetch against the Vite `/aliyun-open` proxy.
 * Attaches Bearer token, refreshes when stale, and retries once on 401.
 */
export async function openApiFetch<T>(path: string, options: OpenApiFetchOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, retryOn401 = true } = options;
  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (auth) {
    headers.Authorization = `Bearer ${await getFreshAccessToken()}`;
  }

  const res = await fetch(`${OPEN_API}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {
    const cloned = res.clone();
    const { code } = await readErrorPayload(cloned);
    const tokenInvalid =
      res.status === 401 ||
      code === 'AccessTokenInvalid' ||
      code === 'AccessTokenExpired';
    if (tokenInvalid && auth && retryOn401) {
      log.warn('Access token rejected, refreshing once and retrying', { code, status: res.status });
      useAliyunDriveStore.setState({ expiresAt: 0 });
      const token = await getFreshAccessToken();
      const retryHeaders = { ...headers, Authorization: `Bearer ${token}` };
      const retry = await fetch(`${OPEN_API}${path}`, {
        method,
        headers: retryHeaders,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (!retry.ok) {
        await throwApiError(retry);
      }
      if (retry.status === 204) return undefined as T;
      return (await retry.json()) as T;
    }
    await throwApiError(res);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function exchangeAuthorizationCode(code: string): Promise<void> {
  const { clientId, clientSecret } = useAliyunDriveStore.getState();
  if (!clientId || !clientSecret) {
    throw new AliyunDriveError('MissingCredentials', ERROR_ZH.MissingCredentials);
  }
  log.info('Exchanging authorization code');
  const data = await tokenRequest({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    code,
  });
  applyTokens(data);
  useAliyunDriveStore.setState({ connectedAt: new Date().toISOString() });
  await hydrateProfile();
}

export async function connectWithRefreshToken(refreshToken: string): Promise<void> {
  const { clientId, clientSecret } = useAliyunDriveStore.getState();
  if (!clientId || !clientSecret) {
    throw new AliyunDriveError('MissingCredentials', ERROR_ZH.MissingCredentials);
  }
  log.info('Connecting with pasted refresh token');
  const data = await tokenRequest({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
  applyTokens(data);
  useAliyunDriveStore.setState({ connectedAt: new Date().toISOString() });
  await hydrateProfile();
}

export async function getUserInfo(): Promise<AliyunUserInfo> {
  return openApiFetch<AliyunUserInfo>('/oauth/users/info', { method: 'GET' });
}

export async function getDriveInfo(): Promise<AliyunDriveInfo> {
  return openApiFetch<AliyunDriveInfo>('/adrive/v1.0/user/getDriveInfo', {
    method: 'POST',
    body: {},
  });
}

export async function getSpaceInfo(): Promise<AliyunSpaceInfo | null> {
  try {
    return await openApiFetch<AliyunSpaceInfo>('/adrive/v1.0/user/getSpaceInfo', {
      method: 'POST',
      body: {},
    });
  } catch (error) {
    log.warn('getSpaceInfo failed (optional)', { error });
    return null;
  }
}

export async function hydrateProfile(): Promise<void> {
  const info = await getDriveInfo();
  let nickName = info.name || '';
  let avatar = info.avatar || '';
  try {
    const user = await getUserInfo();
    nickName = user.name || nickName;
    avatar = user.avatar || avatar;
  } catch (error) {
    log.warn('users/info failed, using drive info', { error });
  }
  const driveId = info.default_drive_id || info.backup_drive_id || '';
  useAliyunDriveStore.getState().setProfile({
    driveId,
    nickName,
    avatar,
  });
}

function requireDriveId(): string {
  const id = useAliyunDriveStore.getState().driveId;
  if (!id) {
    throw new AliyunDriveError('MissingDrive', ERROR_ZH.MissingDrive);
  }
  return id;
}

async function resolveDriveId(driveId?: string): Promise<string> {
  if (driveId) return driveId;
  const existing = useAliyunDriveStore.getState().driveId;
  if (existing) return existing;
  await hydrateProfile();
  return requireDriveId();
}

export async function listFiles(
  parentFileId: string = 'root',
  driveId?: string
): Promise<AliyunListResult> {
  const data = await openApiFetch<{ items?: AliyunFileItem[]; next_marker?: string }>(
    '/adrive/v1.0/openFile/list',
    {
      method: 'POST',
      body: {
        drive_id: driveId || requireDriveId(),
        parent_file_id: parentFileId,
        limit: 100,
        order_by: 'updated_at',
        order_direction: 'DESC',
      },
    }
  );
  return {
    items: Array.isArray(data.items) ? data.items : [],
    next_marker: data.next_marker,
  };
}

function isAlreadyExistsError(err: unknown): boolean {
  if (!(err instanceof AliyunDriveError)) return false;
  return (
    err.code === 'HTTP_409' ||
    /AlreadyExist/i.test(err.code) ||
    /already exist|已存在/i.test(err.message)
  );
}

export async function ensureFolder(
  name: string,
  parentFileId: string = 'root',
  driveId?: string
): Promise<string> {
  const resolvedDriveId = await resolveDriveId(driveId);
  try {
    const created = await openApiFetch<AliyunCreateResult>('/adrive/v1.0/openFile/create', {
      method: 'POST',
      body: {
        drive_id: resolvedDriveId,
        parent_file_id: parentFileId,
        name,
        type: 'folder',
        check_name_mode: 'refuse',
      },
    });
    if (created.file_id) return created.file_id;
  } catch (error) {
    if (!isAlreadyExistsError(error)) throw error;
    log.info('Folder already exists, looking it up by name', { name });
  }
  const { items } = await listFiles(parentFileId, resolvedDriveId);
  const found = items.find((item) => item.type === 'folder' && item.name === name);
  if (!found) {
    throw new AliyunDriveError('NotFound', `找不到文件夹「${name}」`);
  }
  return found.file_id;
}

export async function uploadBlob(
  blob: Blob,
  filename: string,
  parentFileId: string = 'root',
  driveId?: string
): Promise<AliyunCreateResult> {
  const resolvedDriveId = await resolveDriveId(driveId);
  const created = await openApiFetch<AliyunCreateResult>('/adrive/v1.0/openFile/create', {
    method: 'POST',
    body: {
      drive_id: resolvedDriveId,
      parent_file_id: parentFileId,
      name: filename,
      type: 'file',
      check_name_mode: 'auto_rename',
      size: blob.size,
      part_info_list: [{ part_number: 1 }],
    },
  });

  if (created.rapid_upload) {
    log.info('Rapid upload succeeded, skipping OSS PUT');
    return created;
  }

  const uploadUrl = created.part_info_list?.[0]?.upload_url;
  if (!uploadUrl) {
    throw new AliyunDriveError('InvalidParameter', '未返回上传地址，无法上传文件');
  }

  try {
    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
    });
    if (!putRes.ok) {
      throw new AliyunDriveError(
        `HTTP_${putRes.status}`,
        `上传分片失败（HTTP ${putRes.status}）`
      );
    }
  } catch (error) {
    if (error instanceof AliyunDriveError) throw error;
    if (isCorsFailure(error)) {
      throw new AliyunDriveError('CorsBlocked', CORS_UPLOAD_HINT);
    }
    throw error;
  }

  if (!created.file_id || !created.upload_id) {
    throw new AliyunDriveError('InvalidParameter', '创建文件响应缺少 file_id 或 upload_id');
  }

  await openApiFetch('/adrive/v1.0/openFile/complete', {
    method: 'POST',
    body: {
      drive_id: resolvedDriveId,
      file_id: created.file_id,
      upload_id: created.upload_id,
    },
  });

  log.info('Upload complete', { filename, size: blob.size });
  return created;
}

export async function getDownloadUrl(
  fileId: string,
  driveId?: string
): Promise<AliyunDownloadUrl> {
  const data = await openApiFetch<AliyunDownloadUrl>('/adrive/v1.0/openFile/getDownloadUrl', {
    method: 'POST',
    body: {
      drive_id: await resolveDriveId(driveId),
      file_id: fileId,
    },
  });
  if (!data.url) {
    throw new AliyunDriveError('NotFound', '未获取到下载地址');
  }
  return data;
}

export { CORS_UPLOAD_HINT, CORS_DOWNLOAD_HINT };
