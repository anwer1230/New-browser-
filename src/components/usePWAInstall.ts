import { useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already running as installed PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstalling(false);
      setInstallSuccess(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async (): Promise<'accepted' | 'dismissed' | 'ios' | 'fallback'> => {
    if (isInstalled) return 'accepted';
    setIsInstalling(true);

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setInstallSuccess(true);
          setDeferredPrompt(null);
          setIsInstalling(false);
          return 'accepted';
        } else {
          setIsInstalling(false);
          return 'dismissed';
        }
      } catch {
        setIsInstalling(false);
        return 'dismissed';
      }
    }

    if (isIOS) {
      setIsInstalling(false);
      return 'ios';
    }

    // Modern Chrome / Edge: if service worker registered and prompt not yet fired
    // Give user a brief simulated install delay + guide
    await new Promise((r) => setTimeout(r, 900));
    setIsInstalling(false);
    return 'fallback';
  };

  return {
    deferredPrompt,
    isInstallable: !!deferredPrompt || isIOS,
    isInstalled,
    isInstalling,
    installSuccess,
    isIOS,
    triggerInstall,
    setIsInstalling,
  };
}
