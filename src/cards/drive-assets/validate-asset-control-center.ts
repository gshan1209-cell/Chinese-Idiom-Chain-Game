import type { DriveAssetRegistry } from './drive-asset-types.js';
import type { ProjectAssetRegistry } from './project-asset-types.js';

export type AssetControlCenterIssueCode =
  | 'malformed-control-center'
  | 'stale-dashboard-main-sha'
  | 'stale-dashboard-open-pr'
  | 'dashboard-count-mismatch'
  | 'stale-dashboard-registry';

export interface AssetControlCenterIssue {
  readonly code: AssetControlCenterIssueCode;
  readonly recordId: string;
  readonly message: string;
}

export interface AssetControlCenterValidationContext {
  readonly currentMainSha: string;
  readonly openAssetPrs: readonly number[];
}

interface AssetControlCenterSnapshot {
  readonly schemaVersion: 1;
  readonly updatedAt: string;
  readonly currentSnapshot: {
    readonly snapshotId: string;
    readonly baselineGitHubMainSha: string;
    readonly openAssetPr: number | null;
    readonly trackedLogicalAssets: number;
    readonly approvedCurrentMasters: number;
    readonly reviewOrPrItems: number;
    readonly missingP0Assets: number;
    readonly driftWarnings: number;
  };
}

const COMMIT_SHA_PATTERN = /^[a-f0-9]{40}$/;
const FIVE_MINUTES_MS = 5 * 60 * 1000;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isValidDate(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

function isSnapshot(value: unknown): value is AssetControlCenterSnapshot {
  if (!isObject(value) || !isObject(value.currentSnapshot)) {
    return false;
  }

  const snapshot = value.currentSnapshot;
  return (
    value.schemaVersion === 1
    && typeof value.updatedAt === 'string'
    && isValidDate(value.updatedAt)
    && typeof snapshot.snapshotId === 'string'
    && typeof snapshot.baselineGitHubMainSha === 'string'
    && (
      snapshot.openAssetPr === null
      || (typeof snapshot.openAssetPr === 'number' && Number.isInteger(snapshot.openAssetPr))
    )
    && isNonNegativeInteger(snapshot.trackedLogicalAssets)
    && isNonNegativeInteger(snapshot.approvedCurrentMasters)
    && isNonNegativeInteger(snapshot.reviewOrPrItems)
    && isNonNegativeInteger(snapshot.missingP0Assets)
    && isNonNegativeInteger(snapshot.driftWarnings)
  );
}

function pushIssue(
  issues: AssetControlCenterIssue[],
  code: AssetControlCenterIssueCode,
  message: string,
): void {
  issues.push({ code, recordId: '<control-center>', message });
}

export function validateAssetControlCenterSnapshot(
  snapshotValue: unknown,
  projectRegistry: ProjectAssetRegistry,
  idiomRegistry: DriveAssetRegistry,
  context: AssetControlCenterValidationContext,
): readonly AssetControlCenterIssue[] {
  if (!isSnapshot(snapshotValue)) {
    return [{
      code: 'malformed-control-center',
      recordId: '<control-center>',
      message: 'Asset Control Center snapshot has an invalid runtime shape.',
    }];
  }

  const issues: AssetControlCenterIssue[] = [];
  const snapshot = snapshotValue.currentSnapshot;

  if (
    !COMMIT_SHA_PATTERN.test(snapshot.baselineGitHubMainSha)
    || snapshot.baselineGitHubMainSha !== context.currentMainSha
  ) {
    pushIssue(
      issues,
      'stale-dashboard-main-sha',
      'Asset Control Center baseline GitHub main SHA is not current.',
    );
  }

  if (
    snapshot.openAssetPr !== null
    && !context.openAssetPrs.includes(snapshot.openAssetPr)
  ) {
    pushIssue(
      issues,
      'stale-dashboard-open-pr',
      `Tracked asset PR #${snapshot.openAssetPr} is not open.`,
    );
  }

  const approvedCurrentMasters = (
    projectRegistry.assets.filter(({ currentMaster }) => currentMaster).length
    + idiomRegistry.assets.filter(({ currentApproved }) => currentApproved).length
  );
  const reviewOrPrItems = (
    projectRegistry.assets.filter(({ lifecycleStatus, sourceSystem }) => (
      lifecycleStatus === 'review' || sourceSystem === 'github-pr'
    )).length
    + idiomRegistry.assets.filter(({ status }) => status === 'review').length
  );
  const missingP0Assets = projectRegistry.assets.filter(({ priority, gapQty }) => (
    priority === 'P0' && gapQty > 0
  )).length;
  const trackedProjectIdentities = new Set(
    projectRegistry.assets.map(({ identity }) => identity),
  );
  const trackedIdiomFamilies = new Set(
    idiomRegistry.assets.map(({ assetType, identity }) => `${assetType}\u0000${identity}`),
  );
  const trackedLogicalAssets = (
    trackedProjectIdentities.size + trackedIdiomFamilies.size
  );

  const counts = [
    ['approvedCurrentMasters', snapshot.approvedCurrentMasters, approvedCurrentMasters],
    ['reviewOrPrItems', snapshot.reviewOrPrItems, reviewOrPrItems],
    ['missingP0Assets', snapshot.missingP0Assets, missingP0Assets],
    ['trackedLogicalAssets', snapshot.trackedLogicalAssets, trackedLogicalAssets],
  ] as const;

  for (const [field, actual, expected] of counts) {
    if (actual !== expected) {
      pushIssue(
        issues,
        'dashboard-count-mismatch',
        `${field} is ${actual}; Registry-derived value is ${expected}.`,
      );
    }
  }

  const dashboardTime = Date.parse(snapshotValue.updatedAt);
  const newestRegistryTime = Math.max(
    Date.parse(projectRegistry.updatedAt),
    Date.parse(idiomRegistry.updatedAt),
  );
  if (
    Number.isFinite(newestRegistryTime)
    && dashboardTime - newestRegistryTime > FIVE_MINUTES_MS
  ) {
    pushIssue(
      issues,
      'stale-dashboard-registry',
      'Dashboard timestamp is more than five minutes ahead of both Registries.',
    );
  }

  return issues.sort((left, right) => (
    left.code.localeCompare(right.code)
    || left.recordId.localeCompare(right.recordId)
    || left.message.localeCompare(right.message)
  ));
}
