
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState, useEffect } from 'react';

const STORAGE_KEY = 'manga-gongbang-api-key';

export const useApiKey = () => {
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [apiKey, setApiKeyState] = useState<string>('');

  // Load API key from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setApiKeyState(stored);
    }
  }, []);

  const setApiKey = useCallback((key: string) => {
    setApiKeyState(key);
    if (key) {
      localStorage.setItem(STORAGE_KEY, key);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const validateApiKey = useCallback(async (): Promise<boolean> => {
    // 1. User-entered key in localStorage (always wins)
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored.trim().length > 10) {
      return true;
    }

    // 2. Deployer-injected key baked in at build time (Vite inlines VITE_* vars)
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (envKey && envKey.trim().length > 10) {
      return true;
    }

    // 3. AI Studio runtime integration
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      try {
        const hasKey = await aistudio.hasSelectedApiKey();
        if (hasKey) return true;
      } catch (e) {
        console.warn('aistudio key check failed', e);
      }
    }

    // No key found → show dialog
    setShowApiKeyDialog(true);
    return false;
  }, []);

  const handleApiKeyDialogContinue = useCallback(async (newKey?: string) => {
    if (newKey) {
      setApiKey(newKey);
    }
    setShowApiKeyDialog(false);
  }, [setApiKey]);

  const getApiKey = useCallback((): string => {
    return (
      localStorage.getItem(STORAGE_KEY) ||
      import.meta.env.VITE_GEMINI_API_KEY ||
      (window as any).process?.env?.API_KEY ||
      ''
    );
  }, []);

  const clearApiKey = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setApiKeyState('');
  }, []);

  return {
    apiKey,
    showApiKeyDialog,
    setShowApiKeyDialog,
    validateApiKey,
    handleApiKeyDialogContinue,
    getApiKey,
    setApiKey,
    clearApiKey,
  };
};
