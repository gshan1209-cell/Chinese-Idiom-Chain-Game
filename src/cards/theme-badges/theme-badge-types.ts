export const THEME_CATEGORIES = [
  'military',
  'governance',
  'strategy',
  'arts',
  'perseverance',
  'selfCultivation',
  'relationships',
  'cautionary',
  'perspective',
] as const;

export type ThemeCategory = (typeof THEME_CATEGORIES)[number];

export interface ThemeBadgeRecord {
  readonly systemValue: ThemeCategory;
  readonly displayName: string;
  readonly assetId: string;
  readonly iconDefinition: string;
  readonly backgroundHex: string;
  readonly version: '1.0';
  readonly pixelWidth: 1024;
  readonly pixelHeight: 1280;
  readonly mimeType: 'image/png';
  readonly transparentBackground: true;
}

export interface ThemeBadgeRegistry {
  readonly schemaVersion: 1;
  readonly updatedAt: string;
  readonly badges: readonly ThemeBadgeRecord[];
}

export interface ThemeBadgeValidationResult {
  readonly errors: readonly string[];
  readonly summary: {
    readonly badgeCount: number;
    readonly approvedAssetCount: number;
  };
}
