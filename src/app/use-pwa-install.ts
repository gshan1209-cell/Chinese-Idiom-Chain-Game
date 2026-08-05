import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  isIosLikeDevice,
  isStandaloneDisplay,
  requestPwaInstallation,
  type InstallPromptEventLike
} from '../pwa/install';

interface BrowserInstallPromptEvent extends Event, InstallPromptEventLike {
  preventDefault(): void;
}

type UpdateServiceWorker = () => Promise<void>;

interface UpdateReadyDetail {
  readonly update: UpdateServiceWorker;
}

export type InstallStatusTone = 'info' | 'success' | 'error';

export interface PwaInstallController {
  readonly installed: boolean;
  readonly iosDevice: boolean;
  readonly promptAvailable: boolean;
  readonly installing: boolean;
  readonly instructionsOpen: boolean;
  readonly offlineReady: boolean;
  readonly updateReady: boolean;
  readonly statusMessage: string;
  readonly statusTone: InstallStatusTone;
  install(): Promise<void>;
  closeInstructions(): void;
  applyUpdate(): Promise<void>;
}

function readIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return isIosLikeDevice({
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints
  });
}

function readStandalone(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const iosNavigator = navigator as Navigator & { readonly standalone?: boolean };
  return isStandaloneDisplay(
    window.matchMedia('(display-mode: standalone)').matches,
    iosNavigator.standalone === true
  );
}

export function usePwaInstall(): PwaInstallController {
  const iosDevice = useMemo(readIosDevice, []);
  const [installed, setInstalled] = useState(readStandalone);
  const [promptEvent, setPromptEvent] = useState<BrowserInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateFunction, setUpdateFunction] = useState<UpdateServiceWorker | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    installed ? '已從主畫面啟動。' : '安裝後可像一般 App 一樣從主畫面開啟。'
  );
  const [statusTone, setStatusTone] = useState<InstallStatusTone>('info');

  useEffect(() => {
    const standaloneMedia = window.matchMedia('(display-mode: standalone)');

    const handleBeforeInstall = (event: Event) => {
      const installEvent = event as BrowserInstallPromptEvent;
      installEvent.preventDefault();
      setPromptEvent(installEvent);
      setStatusMessage('此裝置已可安裝中文成語接龍。');
      setStatusTone('info');
    };

    const handleInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
      setInstructionsOpen(false);
      setStatusMessage('安裝完成，可從手機主畫面開啟。');
      setStatusTone('success');
    };

    const handleDisplayModeChange = () => {
      if (readStandalone()) {
        setInstalled(true);
        setPromptEvent(null);
      }
    };

    const handleOfflineReady = () => {
      setOfflineReady(true);
    };

    const handleUpdateReady = (event: Event) => {
      const detail = (event as CustomEvent<UpdateReadyDetail>).detail;
      if (detail?.update !== undefined) {
        setUpdateFunction(() => detail.update);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);
    window.addEventListener('cicg:pwa-offline-ready', handleOfflineReady);
    window.addEventListener('cicg:pwa-update-ready', handleUpdateReady);
    standaloneMedia.addEventListener('change', handleDisplayModeChange);

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller !== null) {
      setOfflineReady(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
      window.removeEventListener('cicg:pwa-offline-ready', handleOfflineReady);
      window.removeEventListener('cicg:pwa-update-ready', handleUpdateReady);
      standaloneMedia.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const install = useCallback(async () => {
    if (installed) return;
    if (promptEvent === null) {
      if (iosDevice) {
        setInstructionsOpen(true);
        setStatusMessage('請依照下方三個步驟加入主畫面。');
      } else {
        setStatusMessage('瀏覽器尚未提供安裝按鈕，請稍後再試或使用瀏覽器選單。');
      }
      setStatusTone('info');
      return;
    }

    setInstalling(true);
    try {
      const choice = await requestPwaInstallation(promptEvent);
      setPromptEvent(null);
      if (choice.outcome === 'accepted') {
        setStatusMessage('已接受安裝，完成後可從主畫面開啟。');
        setStatusTone('success');
      } else {
        setStatusMessage('已取消安裝，仍可直接在瀏覽器遊玩。');
        setStatusTone('info');
      }
    } catch {
      setPromptEvent(null);
      setStatusMessage('安裝提示無法開啟，仍可直接在瀏覽器遊玩。');
      setStatusTone('error');
    } finally {
      setInstalling(false);
    }
  }, [installed, iosDevice, promptEvent]);

  const closeInstructions = useCallback(() => {
    setInstructionsOpen(false);
  }, []);

  const applyUpdate = useCallback(async () => {
    if (updateFunction === null) return;
    try {
      await updateFunction();
    } catch {
      setStatusMessage('更新失敗，請重新整理頁面後再試。');
      setStatusTone('error');
    }
  }, [updateFunction]);

  return {
    installed,
    iosDevice,
    promptAvailable: promptEvent !== null,
    installing,
    instructionsOpen,
    offlineReady,
    updateReady: updateFunction !== null,
    statusMessage,
    statusTone,
    install,
    closeInstructions,
    applyUpdate
  };
}
