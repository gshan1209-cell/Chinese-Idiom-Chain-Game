import type {
  DriveAssetRecord,
  DriveAssetRegistry,
} from './drive-asset-types.js';

export type DriveRegistryIssueCode =
  | 'duplicate-current-approved'
  | 'invalid-sha256'
  | 'approved-missing-evidence';

export interface DriveRegistryIssue {
  readonly code: DriveRegistryIssueCode;
  readonly assetId: string | null;
  readonly message: string;
}

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
  const currentApprovedByFamily = new Map<string, DriveAssetRecord>();

  for (const asset of registry.assets) {
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

    if (!asset.currentApproved) {
      continue;
    }

    const key = familyKey(asset);
    const existing = currentApprovedByFamily.get(key);
    if (existing === undefined) {
      currentApprovedByFamily.set(key, asset);
      continue;
    }

    issues.push(issue(
      'duplicate-current-approved',
      asset.assetId,
      `資產家族 ${key} 已有 current Approved master：${existing.assetId}。`,
    ));
  }

  return Object.freeze(issues.sort((left, right) =>
    left.code.localeCompare(right.code) ||
    (left.assetId ?? '').localeCompare(right.assetId ?? '')
  ));
}
