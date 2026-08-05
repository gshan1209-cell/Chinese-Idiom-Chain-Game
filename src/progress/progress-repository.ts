import type { CampaignProgress } from '../domain/progress.js';

export interface CampaignProgressRepository {
  load(totalLevels: number): Promise<CampaignProgress>;
  save(progress: CampaignProgress): Promise<void>;
  clear(): Promise<void>;
}
