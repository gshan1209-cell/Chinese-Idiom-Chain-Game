import type {
  DriveAssetRegistry,
} from './drive-asset-types.js';
import type {
  ProjectAssetRecord,
  ProjectAssetRegistry,
} from './project-asset-types.js';

export type DriveRegistryCrossLinkIssueCode =
  | 'cross-registry-drive-file-id'
  | 'derivative-source-not-found'
  | 'derivative-source-not-approved'
  | 'derivative-source-checksum-mismatch'
  | 'source-master-has-source-link';

export interface DriveRegistryCrossLinkIssue {
  readonly code: DriveRegistryCrossLinkIssueCode;
  readonly recordId: string;
  readonly message: string;
}

function pushIssue(
  issues: DriveRegistryCrossLinkIssue[],
  code: DriveRegistryCrossLinkIssueCode,
  recordId: string,
  message: string,
): void {
  issues.push({ code, recordId, message });
}

function isApprovedCurrentSource(asset: ProjectAssetRecord): boolean {
  return (
    (asset.lifecycleStatus === 'approved' || asset.lifecycleStatus === 'published')
    && asset.currentMaster
  );
}

export function validateDriveRegistryCrossLinks(
  projectRegistry: ProjectAssetRegistry,
  idiomRegistry: DriveAssetRegistry,
): readonly DriveRegistryCrossLinkIssue[] {
  const issues: DriveRegistryCrossLinkIssue[] = [];
  const driveFileOwners = new Map<string, string[]>();
  const projectAssetsById = new Map(
    projectRegistry.assets.map((asset) => [asset.recordId, asset] as const),
  );

  for (const asset of projectRegistry.assets) {
    if (asset.driveFileId !== null) {
      const owners = driveFileOwners.get(asset.driveFileId) ?? [];
      owners.push(`project:${asset.recordId}`);
      driveFileOwners.set(asset.driveFileId, owners);
    }

    if (
      asset.role === 'source-master'
      && (asset.sourceAssetId !== null || asset.sourceSha256 !== null)
    ) {
      pushIssue(
        issues,
        'source-master-has-source-link',
        asset.recordId,
        'Source masters cannot point to another source asset.',
      );
    }

    if (asset.role !== 'runtime-derivative') {
      continue;
    }

    const source = asset.sourceAssetId === null
      ? undefined
      : projectAssetsById.get(asset.sourceAssetId);

    if (source === undefined) {
      pushIssue(
        issues,
        'derivative-source-not-found',
        asset.recordId,
        `Runtime derivative source ${asset.sourceAssetId ?? '<null>'} was not found.`,
      );
      continue;
    }

    if (!isApprovedCurrentSource(source)) {
      pushIssue(
        issues,
        'derivative-source-not-approved',
        asset.recordId,
        `Runtime derivative source ${source.recordId} is not an Approved current master.`,
      );
    }

    if (asset.sourceSha256 !== source.sha256) {
      pushIssue(
        issues,
        'derivative-source-checksum-mismatch',
        asset.recordId,
        `Runtime derivative source checksum does not match ${source.recordId}.`,
      );
    }
  }

  for (const asset of idiomRegistry.assets) {
    const owners = driveFileOwners.get(asset.driveFileId) ?? [];
    owners.push(`idiom:${asset.assetId}`);
    driveFileOwners.set(asset.driveFileId, owners);
  }

  for (const [driveFileId, owners] of driveFileOwners) {
    if (owners.length <= 1) {
      continue;
    }

    pushIssue(
      issues,
      'cross-registry-drive-file-id',
      driveFileId,
      `Drive File ID is registered by multiple assets: ${owners.join(', ')}.`,
    );
  }

  return issues.sort((left, right) => (
    left.code.localeCompare(right.code)
    || left.recordId.localeCompare(right.recordId)
    || left.message.localeCompare(right.message)
  ));
}
