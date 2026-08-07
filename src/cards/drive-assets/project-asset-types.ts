export const PROJECT_ASSET_DOMAINS = [
  'project-management',
  'design-spec',
  'branding',
  'background',
  'ui-component',
  'map-progress',
  'item-icon',
  'bonus-mode',
  'pwa-icon',
  'game-content',
  'localization',
  'license-evidence',
  'test-evidence',
  'release-store',
  'runtime-derivative',
] as const;

export const PROJECT_ASSET_ROLES = [
  'source-master',
  'runtime-derivative',
  'evidence',
  'release-artifact',
  'dashboard',
  'requirement-only',
] as const;

export const PROJECT_ASSET_LIFECYCLE_STATUSES = [
  'missing',
  'intake',
  'review',
  'changes-requested',
  'approved',
  'published',
  'blocked',
  'quarantined',
  'archived',
  'rejected',
  'unverifiable',
] as const;

export type ProjectAssetDomain = (typeof PROJECT_ASSET_DOMAINS)[number];
export type ProjectAssetRole = (typeof PROJECT_ASSET_ROLES)[number];
export type ProjectAssetLifecycleStatus =
  (typeof PROJECT_ASSET_LIFECYCLE_STATUSES)[number];

export interface ProjectAssetRecord {
  readonly recordId: string;
  readonly identity: string;
  readonly assetNameZh: string;
  readonly domain: ProjectAssetDomain;
  readonly assetType: string;
  readonly role: ProjectAssetRole;
  readonly version: string;
  readonly lifecycleStatus: ProjectAssetLifecycleStatus;
  readonly approvalStatus:
    | 'not-started'
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'unverifiable';
  readonly currentMaster: boolean;
  readonly priority: 'P0' | 'P1' | 'P2';
  readonly requiredQty: number;
  readonly availableQty: number;
  readonly gapQty: number;
  readonly sourceSystem: 'none' | 'drive' | 'github' | 'drive+github' | 'github-pr';
  readonly driveFileId: string | null;
  readonly parentFolderKey: string | null;
  readonly githubPath: string | null;
  readonly githubPr: number | null;
  readonly filename: string | null;
  readonly mimeType: string | null;
  readonly sizeBytes: number | null;
  readonly sha256: string | null;
  readonly widthPx: number | null;
  readonly heightPx: number | null;
  readonly transparent: boolean | null;
  readonly sourceAssetId: string | null;
  readonly sourceSha256: string | null;
  readonly releaseVersion: string | null;
  readonly boundCommitSha: string | null;
  readonly approvalEvidenceIds: readonly string[];
  readonly driftState:
    | 'aligned'
    | 'drive-only'
    | 'github-only'
    | 'candidate-conflict'
    | 'missing'
    | 'outdated'
    | 'blocked'
    | 'stale-dashboard';
  readonly lastVerifiedAt: string;
  readonly owner: string;
  readonly nextAction: string;
  readonly notes: string;
}

export interface ProjectAssetRegistry {
  readonly schemaVersion: 1;
  readonly updatedAt: string;
  readonly assets: readonly ProjectAssetRecord[];
}
