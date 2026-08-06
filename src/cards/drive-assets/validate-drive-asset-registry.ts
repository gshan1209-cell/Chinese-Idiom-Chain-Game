import type {
  DriveAssetRecord,
  DriveAssetRegistry,
} from './drive-asset-types.js';

export type DriveRegistryIssueCode =
  | 'duplicate-asset-id'
  | 'duplicate-drive-file-id'
  | 'duplicate-current-approved'
  | 'invalid-version'
  | 'invalid-sha256'
  | 'approved-missing-evidence'
  | 'published-not-approved'
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

function familyKey(asset: DriveAssetRecord): string {
  return `${asset.assetType}:${asset.identity}`;
}

export function validateDriveAssetRegistry(
  registry: DriveAssetRegistry,
): readonly DriveRegistryIssue[] {
  const issues: DriveRegistryIssue[] = [];
  const assetById = new Map<string, DriveAssetRecord>();
  const assetByDriveFileId = new Map<string, DriveAssetRecord>();
  const currentApprovedByFamily = new Map<string, DriveAssetRecord>();

  for (const asset of registry.assets) {
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

  for (const asset of registry.assets) {
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
