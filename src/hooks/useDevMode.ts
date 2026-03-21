'use client';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'freediving_dev_mode';

const readFromStorage = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === 'true';
  } catch {
    return false;
  }
};

const writeToStorage = (value: boolean): void => {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // ignore
  }
};

export const useDevMode = (): [boolean, (value: boolean) => void] => {
  const [devModeEnabled, setDevModeEnabledState] = useState(false);

  useEffect(() => {
    setDevModeEnabledState(readFromStorage());
  }, []);

  const setDevModeEnabled = useCallback((value: boolean) => {
    setDevModeEnabledState(value);
    writeToStorage(value);
  }, []);

  return [devModeEnabled, setDevModeEnabled];
};
