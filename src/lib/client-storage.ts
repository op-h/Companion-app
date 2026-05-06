'use client';

import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_EVENT = 'study-companion-storage';

function emitStorageChange(key: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: { key } }));
}

export function writeLocalStorage(key: string, value: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, value);
  emitStorageChange(key);
}

export function readLocalStorageJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useLocalStorageJson<T>(key: string, fallback: T): T {
  const getSnapshot = useCallback(
    () => JSON.stringify(readLocalStorageJson<T>(key, fallback)),
    [fallback, key]
  );
  const getServerSnapshot = useCallback(() => JSON.stringify(fallback), [fallback]);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (typeof window === 'undefined') return () => {};

      const handleStorage = (event: StorageEvent) => {
        if (!event.key || event.key === key) onStoreChange();
      };

      const handleCustomStorage = (event: Event) => {
        const detail = (event as CustomEvent<{ key?: string }>).detail;
        if (!detail?.key || detail.key === key) onStoreChange();
      };

      window.addEventListener('storage', handleStorage);
      window.addEventListener(STORAGE_EVENT, handleCustomStorage);

      return () => {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener(STORAGE_EVENT, handleCustomStorage);
      };
    },
    [key]
  );

  return JSON.parse(useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)) as T;
}
