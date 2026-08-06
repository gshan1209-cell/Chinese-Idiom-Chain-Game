import type { IdiomCardDefinition } from './card-types.js';

export function buildMilestoneCardPool(
  definitions: readonly IdiomCardDefinition[]
): readonly IdiomCardDefinition[] {
  return Object.freeze(definitions.filter((card) =>
    card.rarity !== 'UR' &&
    card.enabled &&
    card.approvalStatus === 'Approved' &&
    card.sourceStatus === 'Approved' &&
    card.rarityApproved &&
    card.acquisitionMethods.includes('milestone-reward') &&
    Number.isInteger(card.weight) &&
    card.weight > 0
  ));
}
