import {
  DRIVE_ASSET_STATUSES,
  DRIVE_ASSET_TYPES,
  type DriveAssetRecord,
} from './drive-asset-types.js';

export type DriveRegistryIssueCode =
  | 'invalid-registry-shape'
  | 'invalid-asset-record'
  | 'duplicate-asset-id'
  | 'duplicate-drive-file-id'
  | 'duplicate-current-approved'
  | 'invalid-version'
  | 'invalid-sha256'
  | 'approved-missing-evidence'
  | 'published-not-approved'
  | 'current-approved-status-mismatch'
  | 'reference-only-approved'
  | 'ur-missing-license'
  | 'broken-supersession';

export interface DriveRegistryIssue {
  readonly code: DriveRegistryIssueCode;
  readonly assetId: string | null;
  readonly message: string;
}

const VERSION_PATTERN = /^\d+\.\d+$/u;
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;

function issue(
  code: DriveRegistryIssueCode,
  assetId: string | null,
  message: string,
): DriveRegistryIssue {
  return Object.freeze({ code, assetId, message });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isNullableNonEmptyString(value: unknown): value is string | null {
  return value === null || isNonEmptyString(value);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function isNullablePositiveInteger(value: unknown): value is number | null {
  return value === null || isPositiveInteger(value);
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every(isNonEmptyString);
}

function isDriveAssetRecord(value: unknown): value is DriveAssetRecord {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.assetId) &&
    typeof value.assetType === 'string' &&
    DRIVE_ASSET_TYPES.includes(
      value.assetType as DriveAssetRecord['assetType'],
    ) &&
    isNonEmptyString(value.identity) &&
    typeof value.version === 'string' &&
    typeof value.status === 'string' &&
    DRIVE_ASSET_STATUSES.includes(
      value.status as DriveAssetRecord['status'],
    ) &&
    typeof value.currentApproved === 'boolean' &&
    isNonEmptyString(value.filename) &&
    isNonEmptyString(value.driveFileId) &&
    isNonEmptyString(value.parentFolderKey) &&
    isNonEmptyString(value.mimeType) &&
    isPositiveInteger(value.sizeBytes) &&
    typeof value.sha256 === 'string' &&
    isNullablePositiveInteger(value.widthPx) &&
    isNullablePositiveInteger(value.heightPx) &&
    isNonEmptyString(value.webViewLink) &&
    isNullableNonEmptyString(value.supersedesAssetId) &&
    isNullableNonEmptyString(value.supersededByAssetId) &&
    isStringArray(value.approvalEvidenceIds) &&
    isNullableNonEmptyString(value.licenseEvidenceId)
  );
}

function familyKey(asset: DriveAssetRecord): string {
  return `${asset.assetType}:${asset.identity}`;
}

export function validateDriveAssetRegistry(
  registry: unknown,
): readonly DriveRegistryIssue[] {
  if (
    !isRecord(registry) ||
    registry.schemaVersion !== 1 ||
    typeof registry.updatedAt !== 'string' ||
    !Array.isArray(registry.assets)
  ) {
    return Object.freeze([
      issue(
        'invalid-registry-shape',
        null,
        'Drive Asset Registry 根節點格式無效。',
      ),
    ]);
  }

  const issues: DriveRegistryIssue[] = [];
  const validAssets: DriveAssetRecord[] = [];
  const assetById = new Map<string, DriveAssetRecord>();
  const assetByDriveFileId = new Map<string, DriveAssetRecord>();
  const currentApprovedByFamily = new Map<string, DriveAssetRecord>();

  for (const candidate of registry.assets) {
    if (!isDriveAssetRecord(candidate)) {
      const assetId = isRecord(candidate) && typeof candidate.assetId === 'string'
        ? candidate.assetId
        : null;
      issues.push(issue(
        'invalid-asset-record',
        assetId,
        'Drive Asset Registry 包含欄位缺失或型別無效的資產紀錄。',
      ));
      continue;
    }

    const asset = candidate;
    validAssets.push(asset);

    const sameAssetId = assetById.get(asset.assetId);
    if (sameAssetId === undefined) {
      assetById.set(asset.assetId, asset);
    } else {
      issues.push(issue(
        'duplicate-asset-id',
        asset.assetId,
        `資產 ID ${asset.assetId} 重複。`,
      ));
    }

    const sameDriveFileId = assetByDriveFileId.get(asset.driveFileId);
    if (sameDriveFileId === undefined) {
      assetByDriveFileId.set(asset.driveFileId, asset);
    } else if (sameDriveFileId.assetId !== asset.assetId) {
      issues.push(issue(
        'duplicate-drive-file-id',
        asset.assetId,
        `Drive File ID ${asset.driveFileId} 已由 ${sameDriveFileId.assetId} 使用。`,
      ));
    } else {
      issues.push(issue(
        'duplicate-drive-file-id',
        asset.assetId,
        `Drive File ID ${asset.driveFileId} 在 Registry 中重複。`,
      ));
    }

    if (!VERSION_PATTERN.test(asset.version)) {
      issues.push(issue(
        'invalid-version',
        asset.assetId,
        '資產版本必須使用 Major.Minor 數字格式。',
      ));
    }

    if (!SHA256_PATTERN.test(asset.sha256)) {
      issues.push(issue(
        'invalid-sha256',
        asset.assetId,
        '資產 SHA-256 必須是 64 個小寫十六進位字元。',
      ));
    }

    if (
      (asset.status === 'approved' || asset.status === 'published') &&
      asset.approvalEvidenceIds.length === 0
    ) {
      issues.push(issue(
        'approved-missing-evidence',
        asset.assetId,
        'Approved 或 published 資產必須有可稽核的核准證據。',
      ));
    }

    if (asset.status === 'published' && !asset.currentApproved) {
      issues.push(issue(
        'published-not-approved',
        asset.assetId,
        'Published 資產必須仍是 current Approved master。',
      ));
    }

    if (
      asset.currentApproved &&
      asset.status !== 'approved' &&
      asset.status !== 'published'
    ) {
      issues.push(issue(
        'current-approved-status-mismatch',
        asset.assetId,
        '只有 approved 或 published 資產可以標記 current Approved。',
      ));
    }

    if (
      asset.assetType === 'reference-only' &&
      (asset.status === 'approved' || asset.status === 'published')
    ) {
      issues.push(issue(
        'reference-only-approved',
        asset.assetId,
        'Reference Only 資產不得標記 approved 或 published。',
      ));
    }

    if (asset.identity.startsWith('ur-') && asset.licenseEvidenceId === null) {
      issues.push(issue(
        'ur-missing-license',
        asset.assetId,
        'UR 資產必須有可稽核的正式授權證據。',
      ));
    }

    if (asset.currentApproved) {
      const key = familyKey(asset);
      const existing = currentApprovedByFamily.get(key);
      if (existing === undefined) {
        currentApprovedByFamily.set(key, asset);
      } else {
        issues.push(issue(
          'duplicate-current-approved',
          asset.assetId,
          `資產家族 ${key} 已有 current Approved master：${existing.assetId}。`,
        ));
      }
    }
  }

  for (const asset of validAssets) {
    if (asset.supersedesAssetId !== null) {
      const superseded = assetById.get(asset.supersedesAssetId);
      if (
        superseded === undefined ||
        superseded.supersededByAssetId !== asset.assetId
      ) {
        issues.push(issue(
          'broken-supersession',
          asset.assetId,
          `supersedesAssetId ${asset.supersedesAssetId} 缺少雙向關係。`,
        ));
      }
    }

    if (asset.supersededByAssetId !== null) {
      const successor = assetById.get(asset.supersededByAssetId);
      if (
        successor === undefined ||
        successor.supersedesAssetId !== asset.assetId
      ) {
        issues.push(issue(
          'broken-supersession',
          asset.assetId,
          `supersededByAssetId ${asset.supersededByAssetId} 缺少雙向關係。`,
        ));
      }
    }
  }

  return Object.freeze(issues.sort((left, right) =>
    left.code.localeCompare(right.code) ||
    (left.assetId ?? '').localeCompare(right.assetId ?? '')
  ));
}
