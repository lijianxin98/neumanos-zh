/**
 * Aliyun Drive connector store.
 * Credentials and tokens stay on this device (IndexedDB via synced storage).
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createSyncedStorage } from '../lib/syncedStorage';

export interface AliyunDrivePersisted {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accessToken: string;
  expiresAt: number;
  driveId: string;
  nickName: string;
  avatar: string;
  connectedAt: string;
}

interface AliyunDriveState extends AliyunDrivePersisted {
  setCredentials: (clientId: string, clientSecret: string) => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string; expiresAt: number }) => void;
  setProfile: (profile: { driveId: string; nickName: string; avatar: string }) => void;
  disconnect: () => void;
  isAccessTokenFresh: () => boolean;
  isConnected: () => boolean;
}

const EMPTY: AliyunDrivePersisted = {
  clientId: '',
  clientSecret: '',
  refreshToken: '',
  accessToken: '',
  expiresAt: 0,
  driveId: '',
  nickName: '',
  avatar: '',
  connectedAt: '',
};

const FRESH_SKEW_MS = 60_000;

export const useAliyunDriveStore = create<AliyunDriveState>()(
  persist(
    (set, get) => ({
      ...EMPTY,

      setCredentials: (clientId, clientSecret) =>
        set({
          clientId: clientId.trim(),
          clientSecret: clientSecret.trim(),
        }),

      setTokens: ({ accessToken, refreshToken, expiresAt }) =>
        set({
          accessToken,
          refreshToken,
          expiresAt,
        }),

      setProfile: ({ driveId, nickName, avatar }) =>
        set({
          driveId,
          nickName,
          avatar,
        }),

      disconnect: () => set({ ...EMPTY }),

      isAccessTokenFresh: () => {
        const { accessToken, expiresAt } = get();
        return Boolean(accessToken) && Date.now() < expiresAt - FRESH_SKEW_MS;
      },

      isConnected: () => {
        const { refreshToken, accessToken } = get();
        return Boolean(refreshToken || accessToken);
      },
    }),
    {
      name: 'aliyun-drive-storage',
      storage: createJSONStorage(() => createSyncedStorage()),
      partialize: (state) => ({
        clientId: state.clientId,
        clientSecret: state.clientSecret,
        refreshToken: state.refreshToken,
        accessToken: state.accessToken,
        expiresAt: state.expiresAt,
        driveId: state.driveId,
        nickName: state.nickName,
        avatar: state.avatar,
        connectedAt: state.connectedAt,
      }),
    }
  )
);

export function waitForAliyunDriveHydration(): Promise<void> {
  if (useAliyunDriveStore.persist.hasHydrated()) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const unsub = useAliyunDriveStore.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });
  });
}
