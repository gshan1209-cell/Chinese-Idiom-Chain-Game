import type {
  DriveAssetRecord,
  DriveAssetRegistry,
  DriveFolderLifecycleRole,
  DriveFolderRecord,
  DriveFolderRegistry,
} from './drive-asset-types.js';

export type DriveAssetFolderAssignmentIssueCode =
  | 'unknown-asset-parent-folder'
  | 'asset-lifecycle-folder-mismatch'
  | 'asset-current-approved-mismatch'
  | 'invalid-assignment-registry-shape';

export interface DriveAssetFolderAssignmentIssue {
  readonly code: DriveAssetFolderAssignmentIssueCode;
  readonly assetId: string | null;
  readonly message: string;
}

function issue(
  code: DriveAssetFolderAssignmentIssueCode,
  assetId: string | null,
  message: string,
): DriveAssetFolderAssignmentIssue {
  return Object.freeze({ code, assetId, message });
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAssetRecord(value: unknown): value is DriveAssetRecord {
  return isRecord(value) &&
    typeof value.assetId === 'string' &&
    typeof value.assetType === 'string' &&
    typeof value.status === 'string' &&
    typeof value.currentApproved === 'boolean' &&
    typeof value.parentFolderKey === 'string';
}

function isFolderRecord(value: unknown): value is DriveFolderRecord {
  return isRecord(value) &&
    typeof value.folderKey === 'string' &&
    typeof value.lifecycleRole === 'string';
}

function expectedLifecycleRole(asset: DriveAssetRecord): DriveFolderLifecycleRole {
  switch (asset.status) {
    case 'archived':
    case 'rejected':
    case 'unverifiable':
      return 'archive';
    default:
      break;
  }

  if (asset.assetType === 'reference-only') {
    return 'reference';
  }

  switch (asset.status) {
    case 'approved':
    case 'published':
      return 'approved';
    case 'review':
    case 'changes-requested':
      return 'review';
    case 'intake':
    case 'classified':
    case 'quarantined':
      return 'inbox';
    case 'archived':
    case 'rejected':
    case 'unverifiable':
      return 'archive';
  }
}

export function validateDriveAssetFolderAssignments(
  assetRegistry: DriveAssetRegistry,
  folderRegistry: DriveFolderRegistry,
): readonly DriveAssetFolderAssignmentIssue[] {
  const issues: DriveAssetFolderAssignmentIssue[] = [];
  const rawAssets = (assetRegistry as unknown as { readonly assets?: unknown }).assets;
  const rawFolders = (folderRegistry as unknown as { readonly folders?: unknown }).folders;

  if (!Array.isArray(rawAssets) || !Array.isArray(rawFolders)) {
    return Object.freeze([
      issue(
        'invalid-assignment-registry-shape',
        null,
        '跨 Registry 驗證需要 assets 與 folders 陣列。',
      ),
    ]);
  }

  const folderByKey = new Map<string, DriveFolderRecord>();
  for (const rawFolder of rawFolders) {
    if (isFolderRecord(rawFolder)) {
      folderByKey.set(rawFolder.folderKey, rawFolder);
    }
  }

  for (const rawAsset of rawAssets) {
    if (!isAssetRecord(rawAsset)) {
      issues.push(issue(
        'invalid-assignment-registry-shape',
        isRecord(rawAsset) && typeof rawAsset.assetId === 'string'
          ? rawAsset.assetId
          : null,
        '跨 Registry 驗證遇到無法判讀的資產紀錄。',
      ));
      continue;
    }

    const parent = folderByKey.get(rawAsset.parentFolderKey);
    if (parent === undefined) {
      issues.push(issue(
        'unknown-asset-parent-folder',
        rawAsset.assetId,
        `資產 parentFolderKey ${rawAsset.parentFolderKey} 不存在。`,
      ));
      continue;
    }

    const expectedRole = expectedLifecycleRole(rawAsset);
    if (parent.lifecycleRole !== expectedRole) {
      issues.push(issue(
        'asset-lifecycle-folder-mismatch',
        rawAsset.assetId,
        `資產狀態 ${rawAsset.status} 必須放在 ${expectedRole} folder，而不是 ${parent.lifecycleRole}。`,
      ));
    }

    const isApprovedFolder = parent.lifecycleRole === 'approved';
    if (rawAsset.currentApproved !== isApprovedFolder) {
      issues.push(issue(
        'asset-current-approved-mismatch',
        rawAsset.assetId,
        'currentApproved 必須與 Approved folder assignment 一致。',
      ));
    }
  }

  return Object.freeze(issues.sort((left, right) =>
    left.code.localeCompare(right.code) ||
    (left.assetId ?? '').localeCompare(right.assetId ?? '')
  ));
}
