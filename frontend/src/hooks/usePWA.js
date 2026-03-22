import { useState, useEffect } from 'react';

/**
 * Hook to manage PWA installation state and events.
 */
export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const mql = window.matchMedia('(display-mode: standalone)');
    const checkStandalone = () => {
      const isStandaloneMode = mql.matches || window.navigator.standalone === true;
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();
    // Listen for live transitions (e.g. user installs while page is open)
    mql.addEventListener('change', checkStandalone);

    // Listen for install prompt
    const handler = (e) => {
      // Prevent browser from showing native prompt automatically
      e.preventDefault();
      // Save event so it can be triggered later
      setInstallPrompt(e);
      console.log('[PWA] beforeinstallprompt captured');
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      setInstallPrompt(null);
      setIsStandalone(true);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      mql.removeEventListener('change', checkStandalone);
    };
  }, []);

  const triggerInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    console.log(`[PWA] Install prompt outcome: ${outcome}`);
    setInstallPrompt(null);
  };

  const DISMISSED_KEY = 'pwa-banner-dismissed';
  const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  const isDismissed = () => {
    try {
      const ts = localStorage.getItem(DISMISSED_KEY);
      if (!ts) return false;
      return Date.now() - parseInt(ts, 10) < DISMISS_DURATION_MS;
    } catch { return false; }
  };

  const isIOS = /iPhone|iPad|iPod/.test(window.navigator.userAgent) && !window.MSStream;

  return {
    hasPrompt: !!installPrompt && !isDismissed(),
    isIOS,
    isStandalone,
    triggerInstall,
    dismissInstall: () => {
      try { localStorage.setItem(DISMISSED_KEY, String(Date.now())); } catch { /* noop */ }
      setInstallPrompt(null);
    }
  };
}
