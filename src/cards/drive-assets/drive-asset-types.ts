export const DRIVE_ASSET_TYPES = [
  'artwork',
  'card-frame',
  'rarity-badge',
  'difficulty-badge',
  'theme-badge',
  'motto-plaque',
  'effect-overlay',
  'template',
  'composite',
  'reference-only',
  'legacy-flat-card',
] as const;

export const DRIVE_ASSET_STATUSES = [
  'intake',
  'classified',
  'review',
  'changes-requested',
  'approved',
  'published',
  'archived',
  'quarantined',
  'rejected',
  'unverifiable',
] as const;

export type DriveAssetType = (typeof DRIVE_ASSET_TYPES)[number];
export type DriveAssetStatus = (typeof DRIVE_ASSET_STATUSES)[number];

export interface DriveAssetRecord {
  readonly assetId: string;
  readonly assetType: DriveAssetType;
  readonly identity: string;
  readonly version: string;
  readonly status: DriveAssetStatus;
  readonly currentApproved: boolean;
  readonly filename: string;
  readonly driveFileId: string;
  readonly parentFolderKey: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly sha256: string;
  readonly widthPx: number | null;
  readonly heightPx: number | null;
  readonly webViewLink: string;
  readonly supersedesAssetId: string | null;
  readonly supersededByAssetId: string | null;
  readonly approvalEvidenceIds: readonly string[];
  readonly licenseEvidenceId: string | null;
}

export interface DriveAssetRegistry {
  readonly schemaVersion: 1;
  readonly updatedAt: string;
  readonly assets: readonly DriveAssetRecord[];
}

export type DriveFolderLifecycleRole =
  | 'root'
  | 'container'
  | 'inbox'
  | 'review'
  | 'approved'
  | 'archive'
  | 'reference';

export interface DriveFolderRecord {
  readonly folderKey: string;
  readonly driveFolderId: string;
  readonly name: string;
  readonly parentFolderKey: string | null;
  readonly lifecycleRole: DriveFolderLifecycleRole;
}

export interface DriveFolderRegistry {
  readonly schemaVersion: 1;
  readonly updatedAt: string;
  readonly folders: readonly DriveFolderRecord[];
}

export interface DriveResourceSnapshot {
  readonly name: string;
  readonly parentFolderId: string;
  readonly mimeType: string;
  readonly sizeBytes: number | null;
  readonly sha256: string | null;
  readonly webViewLink: string;
}

export type DriveMigrationOperation = 'move' | 'move-and-rename' | 'archive';
export type DriveMigrationEntryStatus =
  | 'planned'
  | 'applied'
  | 'verified'
  | 'rolled-back'
  | 'blocked';

export interface DriveMigrationEntry {
  readonly resourceKind: 'file' | 'folder';
  readonly assetId: string | null;
  readonly driveResourceId: string;
  readonly operation: DriveMigrationOperation;
  readonly before: DriveResourceSnapshot;
  readonly after: DriveResourceSnapshot;
  readonly rollback: DriveResourceSnapshot;
  readonly status: DriveMigrationEntryStatus;
  readonly blockingReason: string | null;
}

export type DriveMigrationLedgerStatus =
  | 'planned'
  | 'in-progress'
  | 'verified'
  | 'rolled-back'
  | 'blocked';

export interface DriveMigrationLedger {
  readonly schemaVersion: 1;
  readonly batchId: string;
  readonly phase: 'phase1' | 'phase2';
  readonly createdAt: string;
  readonly sourceCommit: string;
  readonly status: DriveMigrationLedgerStatus;
  readonly entries: readonly DriveMigrationEntry[];
}
