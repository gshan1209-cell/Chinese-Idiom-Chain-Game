import {
  THEME_CATEGORIES,
  type ThemeBadgeValidationResult,
  type ThemeCategory,
} from './theme-badge-types.js';

interface ExpectedThemeBadge {
  readonly displayName: string;
  readonly assetId: string;
  readonly iconDefinition: string;
  readonly backgroundHex: string;
}

const EXPECTED_THEME_BADGES: Readonly<Record<ThemeCategory, ExpectedThemeBadge>> =
  Object.freeze({
    military: Object.freeze({
      displayName: '軍事',
      assetId: 'theme-badge-military-v1.0',
      iconDefinition: '劍與軍旗',
      backgroundHex: '#8E1E24',
    }),
    governance: Object.freeze({
      displayName: '內政',
      assetId: 'theme-badge-governance-v1.0',
      iconDefinition: '玉璽與卷軸',
      backgroundHex: '#176B52',
    }),
    strategy: Object.freeze({
      displayName: '智謀',
      assetId: 'theme-badge-strategy-v1.0',
      iconDefinition: '羽扇與棋盤',
      backgroundHex: '#5A338A',
    }),
    arts: Object.freeze({
      displayName: '文藝',
      assetId: 'theme-badge-arts-v1.0',
      iconDefinition: '毛筆與畫卷',
      backgroundHex: '#167A83',
    }),
    perseverance: Object.freeze({
      displayName: '勵志',
      assetId: 'theme-badge-perseverance-v1.0',
      iconDefinition: '山路與旭日',
      backgroundHex: '#C77B1F',
    }),
    selfCultivation: Object.freeze({
      displayName: '修身',
      assetId: 'theme-badge-self-cultivation-v1.0',
      iconDefinition: '蓮花與竹簡',
      backgroundHex: '#B95B79',
    }),
    relationships: Object.freeze({
      displayName: '人際',
      assetId: 'theme-badge-relationships-v1.0',
      iconDefinition: '相握之手',
      backgroundHex: '#9A5B22',
    }),
    cautionary: Object.freeze({
      displayName: '警世',
      assetId: 'theme-badge-cautionary-v1.0',
      iconDefinition: '警鐘與眼睛',
      backgroundHex: '#3F2B78',
    }),
    perspective: Object.freeze({
      displayName: '見識',
      assetId: 'theme-badge-perspective-v1.0',
      iconDefinition: '眼睛與遠山窗口',
      backgroundHex: '#1D5F9E',
    }),
  });

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isThemeCategory(value: unknown): value is ThemeCategory {
  return typeof value === 'string' &&
    THEME_CATEGORIES.includes(value as ThemeCategory);
}

function pushMismatch(
  errors: string[],
  systemValue: string,
  field: string,
  actual: unknown,
  expected: unknown,
): void {
  if (actual !== expected) {
    errors.push(
      `${systemValue}.${field} must be ${String(expected)}; received ${String(actual)}`,
    );
  }
}

export function validateThemeBadgeRegistry(
  registry: unknown,
  driveAssets: unknown,
): ThemeBadgeValidationResult {
  const errors: string[] = [];

  if (
    !isRecord(registry) ||
    registry.schemaVersion !== 1 ||
    typeof registry.updatedAt !== 'string' ||
    !Array.isArray(registry.badges)
  ) {
    return Object.freeze({
      errors: Object.freeze(['registry root must contain schemaVersion=1, updatedAt, and badges']),
      summary: Object.freeze({ badgeCount: 0, approvedAssetCount: 0 }),
    });
  }

  const driveAssetList =
    isRecord(driveAssets) && Array.isArray(driveAssets.assets)
      ? driveAssets.assets
      : [];
  const driveAssetById = new Map<string, Record<string, unknown>>();
  for (const candidate of driveAssetList) {
    if (isRecord(candidate) && typeof candidate.assetId === 'string') {
      driveAssetById.set(candidate.assetId, candidate);
    }
  }

  if (registry.badges.length !== THEME_CATEGORIES.length) {
    errors.push(`badges must contain exactly ${THEME_CATEGORIES.length} records`);
  }

  const seenCategories = new Set<string>();
  const seenAssetIds = new Set<string>();
  let approvedAssetCount = 0;

  registry.badges.forEach((candidate, index) => {
    if (!isRecord(candidate)) {
      errors.push(`badges[${index}] must be an object`);
      return;
    }

    const category = candidate.systemValue;
    if (!isThemeCategory(category)) {
      errors.push(`badges[${index}].systemValue is not one of the fixed nine categories`);
      return;
    }

    if (category !== THEME_CATEGORIES[index]) {
      errors.push(
        `badges[${index}].systemValue must preserve canonical order ${THEME_CATEGORIES[index]}`,
      );
    }

    if (seenCategories.has(category)) {
      errors.push(`${category}.systemValue is duplicated`);
    }
    seenCategories.add(category);

    const expected = EXPECTED_THEME_BADGES[category];
    pushMismatch(errors, category, 'displayName', candidate.displayName, expected.displayName);
    pushMismatch(errors, category, 'assetId', candidate.assetId, expected.assetId);
    pushMismatch(
      errors,
      category,
      'iconDefinition',
      candidate.iconDefinition,
      expected.iconDefinition,
    );
    pushMismatch(
      errors,
      category,
      'backgroundHex',
      candidate.backgroundHex,
      expected.backgroundHex,
    );
    pushMismatch(errors, category, 'version', candidate.version, '1.0');
    pushMismatch(errors, category, 'pixelWidth', candidate.pixelWidth, 1024);
    pushMismatch(errors, category, 'pixelHeight', candidate.pixelHeight, 1280);
    pushMismatch(errors, category, 'mimeType', candidate.mimeType, 'image/png');
    pushMismatch(
      errors,
      category,
      'transparentBackground',
      candidate.transparentBackground,
      true,
    );

    if (typeof candidate.assetId !== 'string') {
      errors.push(`${category}.assetId must be a string`);
      return;
    }
    if (seenAssetIds.has(candidate.assetId)) {
      errors.push(`${category}.assetId is duplicated`);
    }
    seenAssetIds.add(candidate.assetId);

    const driveAsset = driveAssetById.get(candidate.assetId);
    if (driveAsset === undefined) {
      errors.push(`${category}.assetId is missing from Drive Asset Registry`);
      return;
    }

    pushMismatch(errors, category, 'drive.assetType', driveAsset.assetType, 'theme-badge');
    pushMismatch(
      errors,
      category,
      'drive.identity',
      driveAsset.identity,
      `theme-badge-${category}`,
    );
    pushMismatch(errors, category, 'drive.status', driveAsset.status, 'approved');
    pushMismatch(
      errors,
      category,
      'drive.currentApproved',
      driveAsset.currentApproved,
      true,
    );
    pushMismatch(errors, category, 'drive.mimeType', driveAsset.mimeType, 'image/png');
    pushMismatch(errors, category, 'drive.widthPx', driveAsset.widthPx, 1024);
    pushMismatch(errors, category, 'drive.heightPx', driveAsset.heightPx, 1280);
    pushMismatch(
      errors,
      category,
      'drive.parentFolderKey',
      driveAsset.parentFolderKey,
      'idiom-cards.components.theme-badges.approved',
    );

    if (
      driveAsset.assetType === 'theme-badge' &&
      driveAsset.status === 'approved' &&
      driveAsset.currentApproved === true
    ) {
      approvedAssetCount += 1;
    }
  });

  for (const category of THEME_CATEGORIES) {
    if (!seenCategories.has(category)) {
      errors.push(`${category}.systemValue is missing`);
    }
  }

  return Object.freeze({
    errors: Object.freeze(errors.sort()),
    summary: Object.freeze({
      badgeCount: registry.badges.length,
      approvedAssetCount,
    }),
  });
}
