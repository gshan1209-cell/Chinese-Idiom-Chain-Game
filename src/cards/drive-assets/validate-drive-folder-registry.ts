import type {
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
  | 'duplicate-drive-folder-id';

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

export function validateDriveFolderRegistry(
  registry: DriveFolderRegistry,
): readonly DriveFolderIssue[] {
  const issues: DriveFolderIssue[] = [];
  const folderByKey = new Map<string, DriveFolderRecord>();
  const folderByDriveId = new Map<string, DriveFolderRecord>();

  for (const folder of registry.folders) {
    if (!folderByKey.has(folder.folderKey)) {
      folderByKey.set(folder.folderKey, folder);
    }

    const existing = folderByDriveId.get(folder.driveFolderId);
    if (existing === undefined) {
      folderByDriveId.set(folder.driveFolderId, folder);
    } else {
      issues.push(issue(
        'duplicate-drive-folder-id',
        folder.folderKey,
        `Drive Folder ID ${folder.driveFolderId} 已由 ${existing.folderKey} 使用。`,
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

  return Object.freeze(issues.sort((left, right) =>
    left.code.localeCompare(right.code) ||
    (left.folderKey ?? '').localeCompare(right.folderKey ?? '')
  ));
}
