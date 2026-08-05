export interface DeviceSignals {
  readonly userAgent: string;
  readonly platform: string;
  readonly maxTouchPoints: number;
}

export type InstallOutcome = 'accepted' | 'dismissed';

export interface InstallChoice {
  readonly outcome: InstallOutcome;
  readonly platform: string;
}

export interface InstallPromptEventLike {
  prompt(): Promise<void>;
  readonly userChoice: Promise<InstallChoice>;
}

export function isIosLikeDevice(signals: DeviceSignals): boolean {
  const classicIos = /iPad|iPhone|iPod/i.test(`${signals.userAgent} ${signals.platform}`);
  const modernIpadOs = signals.platform === 'MacIntel' && signals.maxTouchPoints > 1;
  return classicIos || modernIpadOs;
}

export function isStandaloneDisplay(
  displayModeStandalone: boolean,
  navigatorStandalone: boolean
): boolean {
  return displayModeStandalone || navigatorStandalone;
}

export async function requestPwaInstallation(
  event: InstallPromptEventLike
): Promise<InstallChoice> {
  await event.prompt();
  return event.userChoice;
}
