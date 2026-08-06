import type {
  CardAcquisitionRecord,
  PlayerCardInventoryItem
} from './card-types.js';

function freezeRecord(record: CardAcquisitionRecord): CardAcquisitionRecord {
  return Object.freeze({ ...record });
}

function freezeItem(item: PlayerCardInventoryItem): PlayerCardInventoryItem {
  return Object.freeze({
    ...item,
    acquisitionHistory: Object.freeze(item.acquisitionHistory.map(freezeRecord))
  });
}

function hasAcquisition(
  inventory: readonly PlayerCardInventoryItem[],
  acquisitionId: string
): boolean {
  return inventory.some((item) =>
    item.acquisitionHistory.some((record) => record.acquisitionId === acquisitionId)
  );
}

export function applyCardAcquisition(
  inventory: readonly PlayerCardInventoryItem[],
  cardId: string,
  record: CardAcquisitionRecord
): readonly PlayerCardInventoryItem[] {
  if (hasAcquisition(inventory, record.acquisitionId)) return inventory;

  const existingIndex = inventory.findIndex((item) => item.cardId === cardId);
  if (existingIndex < 0) {
    return Object.freeze([
      ...inventory.map(freezeItem),
      freezeItem({
        cardId,
        ownedCount: 1,
        firstOwnedAt: record.acquiredAt,
        lastOwnedAt: record.acquiredAt,
        acquisitionHistory: [record]
      })
    ]);
  }

  return Object.freeze(inventory.map((item, index) => {
    if (index !== existingIndex) return freezeItem(item);
    return freezeItem({
      cardId: item.cardId,
      ownedCount: item.ownedCount + 1,
      firstOwnedAt: item.firstOwnedAt,
      lastOwnedAt: record.acquiredAt,
      acquisitionHistory: [...item.acquisitionHistory, record]
    });
  }));
}
