import type {
  DriveMigrationLedger,
  DriveResourceSnapshot,
} from './drive-asset-types.js';

export type DriveMigrationIssueCode =
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

function issue(
  code: DriveMigrationIssueCode,
  driveResourceId: string | null,
  message: string,
): DriveMigrationIssue {
  return Object.freeze({ code, driveResourceId, message });
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
  ledger: DriveMigrationLedger,
): readonly DriveMigrationIssue[] {
  const issues: DriveMigrationIssue[] = [];
  const seenResourceIds = new Set<string>();

  if (!COMMIT_PATTERN.test(ledger.sourceCommit)) {
    issues.push(issue(
      'invalid-source-commit',
      null,
      'Migration Ledger 的 sourceCommit 必須是 40 個小寫十六進位字元。',
    ));
  }

  for (const entry of ledger.entries) {
    if (seenResourceIds.has(entry.driveResourceId)) {
      issues.push(issue(
        'duplicate-drive-resource-id',
        entry.driveResourceId,
        `同一批次不得重複登錄 Drive Resource ID：${entry.driveResourceId}。`,
      ));
    } else {
      seenResourceIds.add(entry.driveResourceId);
    }

    const before = entry.before as DriveResourceSnapshot | null;
    const after = entry.after as DriveResourceSnapshot | null;
    const rollback = entry.rollback as DriveResourceSnapshot | null;

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
    ledger.entries.some((entry) => entry.status !== 'verified')
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
