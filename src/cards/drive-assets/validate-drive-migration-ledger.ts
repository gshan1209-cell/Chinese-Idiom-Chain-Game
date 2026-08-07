import type {
  DriveMigrationEntry,
  DriveMigrationEntryStatus,
  DriveMigrationLedgerStatus,
  DriveMigrationOperation,
  DriveResourceSnapshot,
} from './drive-asset-types.js';

export type DriveMigrationIssueCode =
  | 'invalid-ledger-shape'
  | 'invalid-migration-entry'
  | 'invalid-source-commit'
  | 'duplicate-drive-resource-id'
  | 'missing-snapshot'
  | 'rollback-mismatch'
  | 'invalid-file-snapshot'
  | 'invalid-folder-snapshot'
  | 'verified-move-mismatch'
  | 'blocked-missing-reason'
  | 'blocked-has-applied-metadata'
  | 'ledger-not-fully-verified';

export interface DriveMigrationIssue {
  readonly code: DriveMigrationIssueCode;
  readonly driveResourceId: string | null;
  readonly message: string;
}

const COMMIT_PATTERN = /^[a-f0-9]{40}$/u;
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const DRIVE_FOLDER_MIME = 'application/vnd.google-apps.folder';
const DRIVE_MIGRATION_OPERATIONS = [
  'move',
  'move-and-rename',
  'archive',
] as const;
const DRIVE_MIGRATION_ENTRY_STATUSES = [
  'planned',
  'applied',
  'verified',
  'rolled-back',
  'blocked',
] as const;
const DRIVE_MIGRATION_LEDGER_STATUSES = [
  'planned',
  'in-progress',
  'verified',
  'rolled-back',
  'blocked',
] as const;

function issue(
  code: DriveMigrationIssueCode,
  driveResourceId: string | null,
  message: string,
): DriveMigrationIssue {
  return Object.freeze({ code, driveResourceId, message });
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

function isNullableNumber(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value));
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isDriveResourceSnapshot(value: unknown): value is DriveResourceSnapshot {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.name) &&
    isNonEmptyString(value.parentFolderId) &&
    isNonEmptyString(value.mimeType) &&
    isNullableNumber(value.sizeBytes) &&
    isNullableString(value.sha256) &&
    isNonEmptyString(value.webViewLink)
  );
}

function isNullableSnapshot(
  value: unknown,
): value is DriveResourceSnapshot | null {
  return value === null || isDriveResourceSnapshot(value);
}

function isDriveMigrationEntry(value: unknown): value is DriveMigrationEntry {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (value.resourceKind === 'file' || value.resourceKind === 'folder') &&
    isNullableNonEmptyString(value.assetId) &&
    isNonEmptyString(value.driveResourceId) &&
    typeof value.operation === 'string' &&
    DRIVE_MIGRATION_OPERATIONS.includes(
      value.operation as DriveMigrationOperation,
    ) &&
    isNullableSnapshot(value.before) &&
    isNullableSnapshot(value.after) &&
    isNullableSnapshot(value.rollback) &&
    typeof value.status === 'string' &&
    DRIVE_MIGRATION_ENTRY_STATUSES.includes(
      value.status as DriveMigrationEntryStatus,
    ) &&
    (value.blockingReason === null || typeof value.blockingReason === 'string')
  );
}

function snapshotsEqual(
  left: DriveResourceSnapshot,
  right: DriveResourceSnapshot,
): boolean {
  return (
    left.name === right.name &&
    left.parentFolderId === right.parentFolderId &&
    left.mimeType === right.mimeType &&
    left.sizeBytes === right.sizeBytes &&
    left.sha256 === right.sha256 &&
    left.webViewLink === right.webViewLink
  );
}

function isValidFileSnapshot(snapshot: DriveResourceSnapshot): boolean {
  return (
    snapshot.mimeType !== DRIVE_FOLDER_MIME &&
    typeof snapshot.sizeBytes === 'number' &&
    Number.isFinite(snapshot.sizeBytes) &&
    snapshot.sizeBytes > 0 &&
    typeof snapshot.sha256 === 'string' &&
    SHA256_PATTERN.test(snapshot.sha256)
  );
}

function isValidFolderSnapshot(snapshot: DriveResourceSnapshot): boolean {
  return (
    snapshot.mimeType === DRIVE_FOLDER_MIME &&
    snapshot.sizeBytes === null &&
    snapshot.sha256 === null
  );
}

function verifiedMoveMatches(
  before: DriveResourceSnapshot,
  after: DriveResourceSnapshot,
): boolean {
  return (
    before.parentFolderId !== after.parentFolderId &&
    before.mimeType === after.mimeType &&
    before.sizeBytes === after.sizeBytes &&
    before.sha256 === after.sha256 &&
    before.webViewLink === after.webViewLink
  );
}

export function validateDriveMigrationLedger(
  ledger: unknown,
): readonly DriveMigrationIssue[] {
  if (
    !isRecord(ledger) ||
    ledger.schemaVersion !== 1 ||
    !isNonEmptyString(ledger.batchId) ||
    (ledger.phase !== 'phase1' && ledger.phase !== 'phase2') ||
    typeof ledger.createdAt !== 'string' ||
    typeof ledger.sourceCommit !== 'string' ||
    typeof ledger.status !== 'string' ||
    !DRIVE_MIGRATION_LEDGER_STATUSES.includes(
      ledger.status as DriveMigrationLedgerStatus,
    ) ||
    !Array.isArray(ledger.entries)
  ) {
    return Object.freeze([
      issue(
        'invalid-ledger-shape',
        null,
        'Drive Migration Ledger 根節點格式無效。',
      ),
    ]);
  }

  const issues: DriveMigrationIssue[] = [];
  const validEntries: DriveMigrationEntry[] = [];
  const seenResourceIds = new Set<string>();

  if (!COMMIT_PATTERN.test(ledger.sourceCommit)) {
    issues.push(issue(
      'invalid-source-commit',
      null,
      'Migration Ledger 的 sourceCommit 必須是 40 個小寫十六進位字元。',
    ));
  }

  for (const candidate of ledger.entries) {
    if (!isDriveMigrationEntry(candidate)) {
      const driveResourceId = isRecord(candidate) &&
        typeof candidate.driveResourceId === 'string'
        ? candidate.driveResourceId
        : null;
      issues.push(issue(
        'invalid-migration-entry',
        driveResourceId,
        'Drive Migration Ledger 包含欄位缺失或型別無效的搬移紀錄。',
      ));
      continue;
    }

    const entry = candidate;
    validEntries.push(entry);

    if (seenResourceIds.has(entry.driveResourceId)) {
      issues.push(issue(
        'duplicate-drive-resource-id',
        entry.driveResourceId,
        `同一批次不得重複登錄 Drive Resource ID：${entry.driveResourceId}。`,
      ));
    } else {
      seenResourceIds.add(entry.driveResourceId);
    }

    const before = entry.before;
    const after = entry.after;
    const rollback = entry.rollback;

    if (entry.status === 'blocked') {
      if (entry.blockingReason === null || entry.blockingReason.trim() === '') {
        issues.push(issue(
          'blocked-missing-reason',
          entry.driveResourceId,
          'Blocked 搬移項目必須記錄非空白的 blockingReason。',
        ));
      }

      if (after !== null || rollback !== null) {
        issues.push(issue(
          'blocked-has-applied-metadata',
          entry.driveResourceId,
          'Blocked 搬移項目不得宣稱 after 或 rollback 已套用 metadata。',
        ));
      }

      continue;
    }

    if (before === null || after === null || rollback === null) {
      issues.push(issue(
        'missing-snapshot',
        entry.driveResourceId,
        '非 blocked 搬移項目必須包含 before、after 與 rollback snapshot。',
      ));
      continue;
    }

    if (!snapshotsEqual(before, rollback)) {
      issues.push(issue(
        'rollback-mismatch',
        entry.driveResourceId,
        'Rollback snapshot 必須與 before snapshot 完全相同。',
      ));
    }

    const snapshots = [before, after, rollback] as const;
    if (
      entry.resourceKind === 'file' &&
      snapshots.some((snapshot) => !isValidFileSnapshot(snapshot))
    ) {
      issues.push(issue(
        'invalid-file-snapshot',
        entry.driveResourceId,
        'File snapshot 必須有正數 sizeBytes、有效 SHA-256，且 MIME 不得是 Google Drive folder。',
      ));
    }

    if (
      entry.resourceKind === 'folder' &&
      snapshots.some((snapshot) => !isValidFolderSnapshot(snapshot))
    ) {
      issues.push(issue(
        'invalid-folder-snapshot',
        entry.driveResourceId,
        'Folder snapshot 必須使用 Google Drive folder MIME，且 sizeBytes／sha256 為 null。',
      ));
    }

    if (
      entry.status === 'verified' &&
      !verifiedMoveMatches(before, after)
    ) {
      issues.push(issue(
        'verified-move-mismatch',
        entry.driveResourceId,
        'Verified move 必須改變 parent，並保留 MIME、size、checksum 與 webViewLink。',
      ));
    }
  }

  if (
    ledger.status === 'verified' &&
    validEntries.some((entry) => entry.status !== 'verified')
  ) {
    issues.push(issue(
      'ledger-not-fully-verified',
      null,
      'Ledger 只有在所有搬移項目均為 verified 時才能標記 verified。',
    ));
  }

  return Object.freeze(issues.sort((left, right) =>
    left.code.localeCompare(right.code) ||
    (left.driveResourceId ?? '').localeCompare(right.driveResourceId ?? '')
  ));
}
