import type {
  DriveFolderLifecycleRole,
  DriveFolderRecord,
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

interface RequiredPhase1FolderContract {
  readonly name: string;
  readonly parentFolderKey: string | null;
}

const REQUIRED_PHASE1_FOLDER_CONTRACTS = {
  'project.root': { name: 'Chinese-Idiom-Chain-Game', parentFolderKey: null },
  'project.visuals': { name: '02_UI_UX_And_Visuals', parentFolderKey: 'project.root' },
  'project.inbox': { name: '80_Inbox', parentFolderKey: 'project.root' },
  'project.archive': { name: '90_Archive', parentFolderKey: 'project.root' },
  'idiom-cards.root': { name: 'Idiom_Cards', parentFolderKey: 'project.visuals' },
  'idiom-cards.shortcuts': { name: '00_Readme_And_Shortcuts', parentFolderKey: 'idiom-cards.root' },
  'idiom-cards.artworks': { name: '01_Artworks', parentFolderKey: 'idiom-cards.root' },
  'idiom-cards.artworks.review': { name: '10_Review', parentFolderKey: 'idiom-cards.artworks' },
  'idiom-cards.artworks.approved': { name: '20_Approved', parentFolderKey: 'idiom-cards.artworks' },
  'idiom-cards.components': { name: '02_Components', parentFolderKey: 'idiom-cards.root' },
  'idiom-cards.components.card-frames': { name: '01_Card_Frames', parentFolderKey: 'idiom-cards.components' },
  'idiom-cards.components.card-frames.review': { name: '10_Review', parentFolderKey: 'idiom-cards.components.card-frames' },
  'idiom-cards.components.card-frames.approved': { name: '20_Approved', parentFolderKey: 'idiom-cards.components.card-frames' },
  'idiom-cards.components.rarity-badges': { name: '02_Rarity_Badges', parentFolderKey: 'idiom-cards.components' },
  'idiom-cards.components.rarity-badges.review': { name: '10_Review', parentFolderKey: 'idiom-cards.components.rarity-badges' },
  'idiom-cards.components.rarity-badges.approved': { name: '20_Approved', parentFolderKey: 'idiom-cards.components.rarity-badges' },
  'idiom-cards.components.difficulty-badges': { name: '03_Difficulty_Badges', parentFolderKey: 'idiom-cards.components' },
  'idiom-cards.components.difficulty-badges.review': { name: '10_Review', parentFolderKey: 'idiom-cards.components.difficulty-badges' },
  'idiom-cards.components.difficulty-badges.approved': { name: '20_Approved', parentFolderKey: 'idiom-cards.components.difficulty-badges' },
  'idiom-cards.components.theme-badges': { name: '04_Theme_Badges', parentFolderKey: 'idiom-cards.components' },
  'idiom-cards.components.theme-badges.review': { name: '10_Review', parentFolderKey: 'idiom-cards.components.theme-badges' },
  'idiom-cards.components.theme-badges.approved': { name: '20_Approved', parentFolderKey: 'idiom-cards.components.theme-badges' },
  'idiom-cards.components.motto-plaques': { name: '05_Motto_Plaques', parentFolderKey: 'idiom-cards.components' },
  'idiom-cards.components.motto-plaques.review': { name: '10_Review', parentFolderKey: 'idiom-cards.components.motto-plaques' },
  'idiom-cards.components.motto-plaques.approved': { name: '20_Approved', parentFolderKey: 'idiom-cards.components.motto-plaques' },
  'idiom-cards.components.effect-overlays': { name: '06_Effect_Overlays', parentFolderKey: 'idiom-cards.components' },
  'idiom-cards.components.effect-overlays.review': { name: '10_Review', parentFolderKey: 'idiom-cards.components.effect-overlays' },
  'idiom-cards.components.effect-overlays.approved': { name: '20_Approved', parentFolderKey: 'idiom-cards.components.effect-overlays' },
  'idiom-cards.templates': { name: '03_Templates', parentFolderKey: 'idiom-cards.root' },
  'idiom-cards.templates.review': { name: '10_Review', parentFolderKey: 'idiom-cards.templates' },
  'idiom-cards.templates.approved': { name: '20_Approved', parentFolderKey: 'idiom-cards.templates' },
  'idiom-cards.composites': { name: '04_Composites', parentFolderKey: 'idiom-cards.root' },
  'idiom-cards.composites.review': { name: '10_Review', parentFolderKey: 'idiom-cards.composites' },
  'idiom-cards.composites.approved': { name: '20_Approved', parentFolderKey: 'idiom-cards.composites' },
  'idiom-cards.reference-only': { name: '05_Reference_Only', parentFolderKey: 'idiom-cards.root' },
  'idiom-cards.inbox': { name: 'Idiom_Cards', parentFolderKey: 'project.inbox' },
  'idiom-cards.archive': { name: 'Idiom_Cards', parentFolderKey: 'project.archive' },
  'idiom-cards.archive.artworks': { name: '01_Artworks', parentFolderKey: 'idiom-cards.archive' },
  'idiom-cards.archive.components': { name: '02_Components', parentFolderKey: 'idiom-cards.archive' },
  'idiom-cards.archive.templates': { name: '03_Templates', parentFolderKey: 'idiom-cards.archive' },
  'idiom-cards.archive.composites': { name: '04_Composites', parentFolderKey: 'idiom-cards.archive' },
  'idiom-cards.archive.legacy-flat-cards': { name: '05_Legacy_Flat_Cards', parentFolderKey: 'idiom-cards.archive' },
  'idiom-cards.archive.rejected-unverifiable': { name: '06_Rejected_And_Unverifiable', parentFolderKey: 'idiom-cards.archive' },
} as const satisfies Readonly<
  Record<RequiredPhase1FolderKey, RequiredPhase1FolderContract>
>;

const DRIVE_FOLDER_LIFECYCLE_ROLES = [
  'root',
  'container',
  'inbox',
  'review',
  'approved',
  'archive',
  'reference',
] as const;

export type DriveFolderIssueCode =
  | 'invalid-registry-shape'
  | 'invalid-folder-record'
  | 'missing-required-folder'
  | 'duplicate-drive-folder-id'
  | 'duplicate-folder-key'
  | 'unknown-parent-folder'
  | 'parent-cycle'
  | 'lifecycle-role-mismatch'
  | 'parent-folder-mismatch'
  | 'folder-name-mismatch';

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isNullableNonEmptyString(value: unknown): value is string | null {
  return value === null || isNonEmptyString(value);
}

function isDriveFolderRecord(value: unknown): value is DriveFolderRecord {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.folderKey) &&
    isNonEmptyString(value.driveFolderId) &&
    isNonEmptyString(value.name) &&
    isNullableNonEmptyString(value.parentFolderKey) &&
    typeof value.lifecycleRole === 'string' &&
    DRIVE_FOLDER_LIFECYCLE_ROLES.includes(
      value.lifecycleRole as DriveFolderLifecycleRole,
    )
  );
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

function requiredFolderContract(
  folderKey: string,
): RequiredPhase1FolderContract | null {
  if (!Object.hasOwn(REQUIRED_PHASE1_FOLDER_CONTRACTS, folderKey)) {
    return null;
  }

  return REQUIRED_PHASE1_FOLDER_CONTRACTS[
    folderKey as RequiredPhase1FolderKey
  ];
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
  registry: unknown,
): readonly DriveFolderIssue[] {
  if (
    !isRecord(registry) ||
    registry.schemaVersion !== 1 ||
    typeof registry.updatedAt !== 'string' ||
    !Array.isArray(registry.folders)
  ) {
    return Object.freeze([
      issue(
        'invalid-registry-shape',
        null,
        'Drive Folder Registry 根節點格式無效。',
      ),
    ]);
  }

  const issues: DriveFolderIssue[] = [];
  const folderByKey = new Map<string, DriveFolderRecord>();
  const folderByDriveId = new Map<string, DriveFolderRecord>();

  for (const candidate of registry.folders) {
    if (!isDriveFolderRecord(candidate)) {
      const folderKey = isRecord(candidate) && typeof candidate.folderKey === 'string'
        ? candidate.folderKey
        : null;
      issues.push(issue(
        'invalid-folder-record',
        folderKey,
        'Drive Folder Registry 包含欄位缺失或型別無效的資料夾紀錄。',
      ));
      continue;
    }

    const folder = candidate;
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

    const contract = requiredFolderContract(folder.folderKey);
    if (contract !== null) {
      if (folder.parentFolderKey !== contract.parentFolderKey) {
        issues.push(issue(
          'parent-folder-mismatch',
          folder.folderKey,
          `Folder ${folder.folderKey} 必須掛在 ${contract.parentFolderKey ?? 'null'}。`,
        ));
      }

      if (folder.name !== contract.name) {
        issues.push(issue(
          'folder-name-mismatch',
          folder.folderKey,
          `Folder ${folder.folderKey} 必須使用名稱 ${contract.name}。`,
        ));
      }
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
