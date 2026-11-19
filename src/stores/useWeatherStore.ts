import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { WeatherState, Coordinates, WeatherData } from '../types';
import { createSyncedStorage } from '../lib/syncedStorage';

interface WeatherStore extends WeatherState {
  setCity: (city: string) => void;
  setCoords: (coords: Coordinates) => void;
  setWeatherData: (data: WeatherData | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setUseGeolocation: (use: boolean) => void;
}

export const useWeatherStore = create<WeatherStore>()(
  persist(
    (set) => ({
      // Initial state
      city: '上海',
      coords: { lat: 31.2304, lng: 121.4737 }, // Default: 上海
      useGeolocation: false, // Don't auto-prompt for location
      weatherData: null,
      loading: false,
      error: null,

      // Actions
      setCity: (city) => set({ city }),
      setCoords: (coords) => set({ coords }),
      setWeatherData: (data) => set({ weatherData: data }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setUseGeolocation: (use) => set({ useGeolocation: use }),
    }),
    {
      name: 'weather-data',
      version: 1,
      migrate: (persistedState, version) => {
        const state = (persistedState ?? {}) as {
          city?: string;
          coords?: { lat: number; lng: number };
          useGeolocation?: boolean;
        };
        if (version < 1) {
          const lat = state.coords?.lat ?? 0;
          const lng = state.coords?.lng ?? 0;
          const isSanFranciscoDemo =
            Math.abs(lat - 37.7749) < 0.02 && Math.abs(lng + 122.4194) < 0.02;
          if (isSanFranciscoDemo) {
            return {
              ...state,
              city: '上海',
              coords: { lat: 31.2304, lng: 121.4737 },
            };
          }
        }
        return state;
      },
      storage: createJSONStorage(() => createSyncedStorage()),
      partialize: (state) => ({
        city: state.city,
        coords: state.coords,
        useGeolocation: state.useGeolocation,
      }),
    }
  )
);
