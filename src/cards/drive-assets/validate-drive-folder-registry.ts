import type {
  DriveFolderLifecycleRole,
  DriveFolderRecord,
  DriveFolderRegistry,
} from './drive-asset-types.js';

export const REQUIRED_PHASE1_FOLDER_KEYS = [
  'project.root',
  'project.visuals',
  'project.inbox',
  'project.archive',
  'idiom-cards.root',
  'idiom-cards.shortcuts',
  'idiom-cards.artworks',
  'idiom-cards.artworks.review',
  'idiom-cards.artworks.approved',
  'idiom-cards.components',
  'idiom-cards.components.card-frames',
  'idiom-cards.components.card-frames.review',
  'idiom-cards.components.card-frames.approved',
  'idiom-cards.components.rarity-badges',
  'idiom-cards.components.rarity-badges.review',
  'idiom-cards.components.rarity-badges.approved',
  'idiom-cards.components.difficulty-badges',
  'idiom-cards.components.difficulty-badges.review',
  'idiom-cards.components.difficulty-badges.approved',
  'idiom-cards.components.theme-badges',
  'idiom-cards.components.theme-badges.review',
  'idiom-cards.components.theme-badges.approved',
  'idiom-cards.components.motto-plaques',
  'idiom-cards.components.motto-plaques.review',
  'idiom-cards.components.motto-plaques.approved',
  'idiom-cards.components.effect-overlays',
  'idiom-cards.components.effect-overlays.review',
  'idiom-cards.components.effect-overlays.approved',
  'idiom-cards.templates',
  'idiom-cards.templates.review',
  'idiom-cards.templates.approved',
  'idiom-cards.composites',
  'idiom-cards.composites.review',
  'idiom-cards.composites.approved',
  'idiom-cards.reference-only',
  'idiom-cards.inbox',
  'idiom-cards.archive',
  'idiom-cards.archive.artworks',
  'idiom-cards.archive.components',
  'idiom-cards.archive.templates',
  'idiom-cards.archive.composites',
  'idiom-cards.archive.legacy-flat-cards',
  'idiom-cards.archive.rejected-unverifiable',
] as const;

export type RequiredPhase1FolderKey =
  (typeof REQUIRED_PHASE1_FOLDER_KEYS)[number];

export type DriveFolderIssueCode =
  | 'missing-required-folder'
  | 'duplicate-drive-folder-id'
  | 'duplicate-folder-key'
  | 'unknown-parent-folder'
  | 'parent-cycle'
  | 'lifecycle-role-mismatch';

export interface DriveFolderIssue {
  readonly code: DriveFolderIssueCode;
  readonly folderKey: string | null;
  readonly message: string;
}

function issue(
  code: DriveFolderIssueCode,
  folderKey: string | null,
  message: string,
): DriveFolderIssue {
  return Object.freeze({ code, folderKey, message });
}

function expectedLifecycleRole(folderKey: string): DriveFolderLifecycleRole {
  if (folderKey === 'project.root') {
    return 'root';
  }
  if (folderKey === 'project.inbox' || folderKey === 'idiom-cards.inbox') {
    return 'inbox';
  }
  if (
    folderKey === 'project.archive' ||
    folderKey === 'idiom-cards.archive' ||
    folderKey.startsWith('idiom-cards.archive.')
  ) {
    return 'archive';
  }
  if (folderKey.endsWith('.review')) {
    return 'review';
  }
  if (folderKey.endsWith('.approved')) {
    return 'approved';
  }
  if (folderKey === 'idiom-cards.reference-only') {
    return 'reference';
  }
  return 'container';
}

function cycleKeys(
  folderByKey: ReadonlyMap<string, DriveFolderRecord>,
): ReadonlySet<string> {
  const cycleMembers = new Set<string>();

  for (const startKey of folderByKey.keys()) {
    const path: string[] = [];
    const pathIndex = new Map<string, number>();
    let currentKey: string | null = startKey;

    while (currentKey !== null) {
      const cycleStart = pathIndex.get(currentKey);
      if (cycleStart !== undefined) {
        for (const member of path.slice(cycleStart)) {
          cycleMembers.add(member);
        }
        break;
      }

      const current = folderByKey.get(currentKey);
      if (current === undefined) {
        break;
      }

      pathIndex.set(currentKey, path.length);
      path.push(currentKey);
      currentKey = current.parentFolderKey;
    }
  }

  return cycleMembers;
}

export function validateDriveFolderRegistry(
  registry: DriveFolderRegistry,
): readonly DriveFolderIssue[] {
  const issues: DriveFolderIssue[] = [];
  const folderByKey = new Map<string, DriveFolderRecord>();
  const folderByDriveId = new Map<string, DriveFolderRecord>();

  for (const folder of registry.folders) {
    const existingKey = folderByKey.get(folder.folderKey);
    if (existingKey === undefined) {
      folderByKey.set(folder.folderKey, folder);
    } else {
      issues.push(issue(
        'duplicate-folder-key',
        folder.folderKey,
        `Folder key ${folder.folderKey} 重複。`,
      ));
    }

    const existingDriveId = folderByDriveId.get(folder.driveFolderId);
    if (existingDriveId === undefined) {
      folderByDriveId.set(folder.driveFolderId, folder);
    } else {
      issues.push(issue(
        'duplicate-drive-folder-id',
        folder.folderKey,
        `Drive Folder ID ${folder.driveFolderId} 已由 ${existingDriveId.folderKey} 使用。`,
      ));
    }
  }

  for (const folderKey of REQUIRED_PHASE1_FOLDER_KEYS) {
    if (!folderByKey.has(folderKey)) {
      issues.push(issue(
        'missing-required-folder',
        folderKey,
        `缺少必要的 Phase 1 資料夾：${folderKey}。`,
      ));
    }
  }

  for (const folder of folderByKey.values()) {
    if (
      folder.parentFolderKey !== null &&
      !folderByKey.has(folder.parentFolderKey)
    ) {
      issues.push(issue(
        'unknown-parent-folder',
        folder.folderKey,
        `Parent folder key ${folder.parentFolderKey} 不存在。`,
      ));
    }

    const expectedRole = expectedLifecycleRole(folder.folderKey);
    if (folder.lifecycleRole !== expectedRole) {
      issues.push(issue(
        'lifecycle-role-mismatch',
        folder.folderKey,
        `Folder ${folder.folderKey} 必須使用 lifecycle role ${expectedRole}。`,
      ));
    }
  }

  for (const folderKey of cycleKeys(folderByKey)) {
    issues.push(issue(
      'parent-cycle',
      folderKey,
      `Folder ${folderKey} 位於 parent cycle 中。`,
    ));
  }

  return Object.freeze(issues.sort((left, right) =>
    left.code.localeCompare(right.code) ||
    (left.folderKey ?? '').localeCompare(right.folderKey ?? '')
  ));
}
