import {
  PROJECT_ASSET_DOMAINS,
  PROJECT_ASSET_LIFECYCLE_STATUSES,
  PROJECT_ASSET_ROLES,
} from './project-asset-types.js';
import type {
  ProjectAssetRecord,
  ProjectAssetRegistry,
} from './project-asset-types.js';

export type ProjectAssetIssueCode =
  | 'malformed-project-registry'
  | 'malformed-project-asset'
  | 'duplicate-project-record-id'
  | 'invalid-project-version'
  | 'invalid-gap-quantity'
  | 'missing-physical-location'
  | 'unexpected-physical-location'
  | 'invalid-project-sha256'
  | 'approved-missing-evidence'
  | 'invalid-current-master-state'
  | 'duplicate-project-current-master'
  | 'pr-review-missing-pr'
  | 'derivative-missing-source'
  | 'evidence-cannot-be-current-master'
  | 'release-missing-binding';

export interface ProjectAssetIssue {
  readonly code: ProjectAssetIssueCode;
  readonly recordId: string;
  readonly message: string;
}

const VERSION_PATTERN = /^\d+\.\d+(?:-[a-z0-9-]+)?$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const COMMIT_SHA_PATTERN = /^[a-f0-9]{40}$/;
const DOMAIN_SET = new Set<string>(PROJECT_ASSET_DOMAINS);
const ROLE_SET = new Set<string>(PROJECT_ASSET_ROLES);
const STATUS_SET = new Set<string>(PROJECT_ASSET_LIFECYCLE_STATUSES);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || typeof value === 'number';
}

function isProjectAssetRecord(value: unknown): value is ProjectAssetRecord {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.recordId === 'string'
    && typeof value.identity === 'string'
    && typeof value.assetNameZh === 'string'
    && typeof value.domain === 'string'
    && DOMAIN_SET.has(value.domain)
    && typeof value.assetType === 'string'
    && typeof value.role === 'string'
    && ROLE_SET.has(value.role)
    && typeof value.version === 'string'
    && typeof value.lifecycleStatus === 'string'
    && STATUS_SET.has(value.lifecycleStatus)
    && typeof value.approvalStatus === 'string'
    && ['not-started', 'pending', 'approved', 'rejected', 'unverifiable'].includes(
      value.approvalStatus,
    )
    && typeof value.currentMaster === 'boolean'
    && typeof value.priority === 'string'
    && ['P0', 'P1', 'P2'].includes(value.priority)
    && typeof value.requiredQty === 'number'
    && typeof value.availableQty === 'number'
    && typeof value.gapQty === 'number'
    && typeof value.sourceSystem === 'string'
    && ['none', 'drive', 'github', 'drive+github', 'github-pr'].includes(
      value.sourceSystem,
    )
    && isNullableString(value.driveFileId)
    && isNullableString(value.parentFolderKey)
    && isNullableString(value.githubPath)
    && isNullableNumber(value.githubPr)
    && isNullableString(value.filename)
    && isNullableString(value.mimeType)
    && isNullableNumber(value.sizeBytes)
    && isNullableString(value.sha256)
    && isNullableNumber(value.widthPx)
    && isNullableNumber(value.heightPx)
    && (value.transparent === null || typeof value.transparent === 'boolean')
    && isNullableString(value.sourceAssetId)
    && isNullableString(value.sourceSha256)
    && isNullableString(value.releaseVersion)
    && isNullableString(value.boundCommitSha)
    && Array.isArray(value.approvalEvidenceIds)
    && value.approvalEvidenceIds.every((item) => typeof item === 'string')
    && typeof value.driftState === 'string'
    && [
      'aligned',
      'drive-only',
      'github-only',
      'candidate-conflict',
      'missing',
      'outdated',
      'blocked',
      'stale-dashboard',
    ].includes(value.driftState)
    && typeof value.lastVerifiedAt === 'string'
    && typeof value.owner === 'string'
    && typeof value.nextAction === 'string'
    && typeof value.notes === 'string'
  );
}

function pushIssue(
  issues: ProjectAssetIssue[],
  code: ProjectAssetIssueCode,
  recordId: string,
  message: string,
): void {
  issues.push({ code, recordId, message });
}

function hasDriveLocation(asset: ProjectAssetRecord): boolean {
  return (
    typeof asset.driveFileId === 'string'
    && asset.driveFileId.length > 0
    && typeof asset.parentFolderKey === 'string'
    && asset.parentFolderKey.length > 0
    && typeof asset.filename === 'string'
    && asset.filename.length > 0
    && typeof asset.mimeType === 'string'
    && asset.mimeType.length > 0
    && typeof asset.sizeBytes === 'number'
    && Number.isInteger(asset.sizeBytes)
    && asset.sizeBytes > 0
    && typeof asset.sha256 === 'string'
    && SHA256_PATTERN.test(asset.sha256)
  );
}

function hasGitHubLocation(asset: ProjectAssetRecord): boolean {
  return (
    typeof asset.githubPath === 'string'
    && asset.githubPath.length > 0
    && typeof asset.filename === 'string'
    && asset.filename.length > 0
    && typeof asset.mimeType === 'string'
    && asset.mimeType.length > 0
    && typeof asset.sizeBytes === 'number'
    && Number.isInteger(asset.sizeBytes)
    && asset.sizeBytes > 0
    && typeof asset.sha256 === 'string'
    && SHA256_PATTERN.test(asset.sha256)
  );
}

function hasAnyPhysicalLocation(asset: ProjectAssetRecord): boolean {
  return [
    asset.driveFileId,
    asset.parentFolderKey,
    asset.githubPath,
    asset.filename,
    asset.mimeType,
    asset.sizeBytes,
    asset.sha256,
    asset.widthPx,
    asset.heightPx,
  ].some((value) => value !== null);
}

export function validateProjectAssetRegistry(
  registry: unknown,
): readonly ProjectAssetIssue[] {
  const issues: ProjectAssetIssue[] = [];

  if (
    !isObject(registry)
    || registry.schemaVersion !== 1
    || typeof registry.updatedAt !== 'string'
    || !Array.isArray(registry.assets)
  ) {
    return [{
      code: 'malformed-project-registry',
      recordId: '<registry>',
      message: 'Project Asset Registry root must contain schemaVersion 1, updatedAt and assets.',
    }];
  }

  const assets: ProjectAssetRecord[] = [];
  registry.assets.forEach((candidate, index) => {
    if (!isProjectAssetRecord(candidate)) {
      pushIssue(
        issues,
        'malformed-project-asset',
        `<asset:${index}>`,
        'Project asset record has an invalid runtime shape.',
      );
      return;
    }
    assets.push(candidate);
  });

  const recordIds = new Map<string, number>();
  const currentMasters = new Map<string, number>();

  for (const asset of assets) {
    recordIds.set(asset.recordId, (recordIds.get(asset.recordId) ?? 0) + 1);

    if (!VERSION_PATTERN.test(asset.version)) {
      pushIssue(
        issues,
        'invalid-project-version',
        asset.recordId,
        `Version ${asset.version} is not a supported project asset version.`,
      );
    }

    const quantities = [asset.requiredQty, asset.availableQty, asset.gapQty];
    if (
      quantities.some((value) => !Number.isInteger(value) || value < 0)
      || asset.gapQty !== Math.max(asset.requiredQty - asset.availableQty, 0)
    ) {
      pushIssue(
        issues,
        'invalid-gap-quantity',
        asset.recordId,
        'Project asset quantities must be non-negative integers with a derived gap.',
      );
    }

    if (asset.sha256 !== null && !SHA256_PATTERN.test(asset.sha256)) {
      pushIssue(
        issues,
        'invalid-project-sha256',
        asset.recordId,
        'Project asset SHA-256 must be 64 lowercase hexadecimal characters.',
      );
    }

    const locationForbidden = (
      asset.lifecycleStatus === 'missing'
      || asset.role === 'requirement-only'
    );

    if (locationForbidden && hasAnyPhysicalLocation(asset)) {
      pushIssue(
        issues,
        'unexpected-physical-location',
        asset.recordId,
        'Missing and requirement-only records cannot point to physical assets.',
      );
    } else if (!locationForbidden) {
      const locationValid = asset.sourceSystem === 'drive'
        ? hasDriveLocation(asset)
        : asset.sourceSystem === 'drive+github'
          ? hasDriveLocation(asset) && typeof asset.githubPath === 'string'
          : asset.sourceSystem === 'github' || asset.sourceSystem === 'github-pr'
            ? hasGitHubLocation(asset)
            : false;

      if (!locationValid) {
        pushIssue(
          issues,
          'missing-physical-location',
          asset.recordId,
          'Physical project assets must provide the location required by sourceSystem.',
        );
      }
    }

    if (
      asset.sourceSystem === 'github-pr'
      && (!Number.isInteger(asset.githubPr) || (asset.githubPr ?? 0) <= 0)
    ) {
      pushIssue(
        issues,
        'pr-review-missing-pr',
        asset.recordId,
        'GitHub PR candidates require a positive pull request number.',
      );
    }

    if (
      asset.currentMaster
      && asset.lifecycleStatus !== 'approved'
      && asset.lifecycleStatus !== 'published'
    ) {
      pushIssue(
        issues,
        'invalid-current-master-state',
        asset.recordId,
        'Only approved or published assets may be current masters.',
      );
    }

    if (
      asset.currentMaster
      && (
        asset.approvalStatus !== 'approved'
        || asset.approvalEvidenceIds.length === 0
      )
    ) {
      pushIssue(
        issues,
        'approved-missing-evidence',
        asset.recordId,
        'A current Approved master requires approved status and approval evidence.',
      );
    }

    if (asset.currentMaster) {
      const family = `${asset.domain}\u0000${asset.assetType}\u0000${asset.identity}`;
      currentMasters.set(family, (currentMasters.get(family) ?? 0) + 1);
    }

    if (
      asset.role === 'runtime-derivative'
      && (
        typeof asset.sourceAssetId !== 'string'
        || asset.sourceAssetId.length === 0
        || typeof asset.sourceSha256 !== 'string'
        || !SHA256_PATTERN.test(asset.sourceSha256)
      )
    ) {
      pushIssue(
        issues,
        'derivative-missing-source',
        asset.recordId,
        'Runtime derivatives require a source asset ID and source checksum.',
      );
    }

    if (
      (asset.role === 'evidence' || asset.role === 'requirement-only')
      && asset.currentMaster
    ) {
      pushIssue(
        issues,
        'evidence-cannot-be-current-master',
        asset.recordId,
        'Evidence and requirement-only records cannot be current masters.',
      );
    }

    if (
      asset.role === 'release-artifact'
      && (
        typeof asset.releaseVersion !== 'string'
        || asset.releaseVersion.length === 0
        || typeof asset.boundCommitSha !== 'string'
        || !COMMIT_SHA_PATTERN.test(asset.boundCommitSha)
      )
    ) {
      pushIssue(
        issues,
        'release-missing-binding',
        asset.recordId,
        'Release artifacts require a release version and bound commit SHA.',
      );
    }
  }

  for (const [recordId, count] of recordIds) {
    if (count > 1) {
      pushIssue(
        issues,
        'duplicate-project-record-id',
        recordId,
        `Project asset record ID appears ${count} times.`,
      );
    }
  }

  for (const [family, count] of currentMasters) {
    if (count > 1) {
      pushIssue(
        issues,
        'duplicate-project-current-master',
        family.replaceAll('\u0000', '/'),
        `Project asset family has ${count} current masters.`,
      );
    }
  }

  return issues.sort((left, right) => (
    left.code.localeCompare(right.code)
    || left.recordId.localeCompare(right.recordId)
    || left.message.localeCompare(right.message)
  ));
}

export type { ProjectAssetRegistry };
