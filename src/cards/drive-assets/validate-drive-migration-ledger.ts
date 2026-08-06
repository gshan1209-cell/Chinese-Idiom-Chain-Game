import type {
  DriveMigrationLedger,
  DriveResourceSnapshot,
} from './drive-asset-types.js';

export type DriveMigrationIssueCode = 'missing-snapshot';

export interface DriveMigrationIssue {
  readonly code: DriveMigrationIssueCode;
  readonly driveResourceId: string | null;
  readonly message: string;
}

function issue(
  code: DriveMigrationIssueCode,
  driveResourceId: string | null,
  message: string,
): DriveMigrationIssue {
  return Object.freeze({ code, driveResourceId, message });
}

export function validateDriveMigrationLedger(
  ledger: DriveMigrationLedger,
): readonly DriveMigrationIssue[] {
  const issues: DriveMigrationIssue[] = [];

  for (const entry of ledger.entries) {
    const before = entry.before as DriveResourceSnapshot | null;
    const after = entry.after as DriveResourceSnapshot | null;
    const rollback = entry.rollback as DriveResourceSnapshot | null;

    if (
      entry.status !== 'blocked' &&
      (before === null || after === null || rollback === null)
    ) {
      issues.push(issue(
        'missing-snapshot',
        entry.driveResourceId,
        '非 blocked 搬移項目必須包含 before、after 與 rollback snapshot。',
      ));
    }
  }

  return Object.freeze(issues.sort((left, right) =>
    left.code.localeCompare(right.code) ||
    (left.driveResourceId ?? '').localeCompare(right.driveResourceId ?? '')
  ));
}
