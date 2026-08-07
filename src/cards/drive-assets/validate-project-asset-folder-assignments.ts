import type {
  DriveFolderLifecycleRole,
  DriveFolderRegistry,
} from './drive-asset-types.js';
import type {
  ProjectAssetRecord,
  ProjectAssetRegistry,
} from './project-asset-types.js';

export type ProjectAssetFolderAssignmentIssueCode =
  | 'unknown-project-asset-folder'
  | 'project-asset-folder-role-mismatch'
  | 'project-asset-unexpected-folder';

export interface ProjectAssetFolderAssignmentIssue {
  readonly code: ProjectAssetFolderAssignmentIssueCode;
  readonly recordId: string;
  readonly message: string;
}

function pushIssue(
  issues: ProjectAssetFolderAssignmentIssue[],
  code: ProjectAssetFolderAssignmentIssueCode,
  recordId: string,
  message: string,
): void {
  issues.push({ code, recordId, message });
}

function requiresNoDriveParent(asset: ProjectAssetRecord): boolean {
  return (
    asset.role === 'runtime-derivative'
    || asset.role === 'requirement-only'
    || asset.lifecycleStatus === 'missing'
  );
}

function allowedFolderRoles(
  asset: ProjectAssetRecord,
): readonly DriveFolderLifecycleRole[] {
  if (
    asset.role === 'dashboard'
    || asset.role === 'evidence'
    || asset.domain === 'design-spec'
  ) {
    return ['container', 'reference'];
  }

  switch (asset.lifecycleStatus) {
    case 'intake':
    case 'blocked':
    case 'quarantined':
      return ['inbox', 'archive'];
    case 'review':
    case 'changes-requested':
      return ['review', 'inbox'];
    case 'approved':
    case 'published':
      return asset.role === 'source-master' ? ['approved'] : ['container', 'reference'];
    case 'archived':
    case 'rejected':
    case 'unverifiable':
      return ['archive'];
    case 'missing':
      return [];
  }
}

export function validateProjectAssetFolderAssignments(
  projectRegistry: ProjectAssetRegistry,
  folderRegistry: DriveFolderRegistry,
): readonly ProjectAssetFolderAssignmentIssue[] {
  const issues: ProjectAssetFolderAssignmentIssue[] = [];
  const foldersByKey = new Map(
    folderRegistry.folders.map((folder) => [folder.folderKey, folder] as const),
  );

  for (const asset of projectRegistry.assets) {
    if (requiresNoDriveParent(asset)) {
      if (asset.parentFolderKey !== null) {
        pushIssue(
          issues,
          'project-asset-unexpected-folder',
          asset.recordId,
          'GitHub derivatives, missing assets and requirement-only records cannot have a Drive parent.',
        );
      }
      continue;
    }

    if (asset.parentFolderKey === null) {
      pushIssue(
        issues,
        'project-asset-folder-role-mismatch',
        asset.recordId,
        'Physical or governed project assets require a registered Drive parent folder.',
      );
      continue;
    }

    const folder = foldersByKey.get(asset.parentFolderKey);
    if (folder === undefined) {
      pushIssue(
        issues,
        'unknown-project-asset-folder',
        asset.recordId,
        `Project asset references unknown folder key ${asset.parentFolderKey}.`,
      );
      continue;
    }

    const allowedRoles = allowedFolderRoles(asset);
    if (!allowedRoles.includes(folder.lifecycleRole)) {
      pushIssue(
        issues,
        'project-asset-folder-role-mismatch',
        asset.recordId,
        `Folder ${folder.folderKey} has lifecycle role ${folder.lifecycleRole}; expected ${allowedRoles.join(' or ') || 'no Drive folder'}.`,
      );
    }
  }

  return issues.sort((left, right) => (
    left.code.localeCompare(right.code)
    || left.recordId.localeCompare(right.recordId)
    || left.message.localeCompare(right.message)
  ));
}
