import {
  createEmptyCardCollectionState,
  parseCardCollectionState
} from './collection-serialization.js';
import type {
  CardCollectionRepository,
  CardCollectionState,
  CardCollectionTransactionResult
} from './card-types.js';

const DATABASE_NAME = 'cicg-card-collection';
const DATABASE_VERSION = 1;
const GRANTS_STORE = 'grants';
const INVENTORY_STORE = 'inventory';
const METADATA_STORE = 'metadata';
const METADATA_KEY = 'collection';

const ALL_STORES = Object.freeze([
  GRANTS_STORE,
  INVENTORY_STORE,
  METADATA_STORE
]);

function errorFrom(value: unknown, fallback: string): Error {
  return value instanceof Error ? value : new Error(fallback);
}

function openDatabase(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let request: IDBOpenDBRequest;
    try {
      request = factory.open(DATABASE_NAME, DATABASE_VERSION);
    } catch (error) {
      reject(errorFrom(error, '無法開啟圖卡收藏資料庫。'));
      return;
    }

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(GRANTS_STORE)) {
        database.createObjectStore(GRANTS_STORE);
      }
      if (!database.objectStoreNames.contains(INVENTORY_STORE)) {
        database.createObjectStore(INVENTORY_STORE);
      }
      if (!database.objectStoreNames.contains(METADATA_STORE)) {
        database.createObjectStore(METADATA_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(
      errorFrom(request.error, '開啟圖卡收藏資料庫失敗。')
    );
    request.onblocked = () => reject(
      new Error('圖卡收藏資料庫目前被其他分頁阻擋。')
    );
  });
}

interface RawCollectionState {
  grants: unknown;
  inventory: unknown;
  metadata: unknown;
}

function readStateFromTransaction(
  transaction: IDBTransaction,
  onReady: (raw: RawCollectionState) => void,
  onFailure: (error: unknown) => void
): void {
  const raw: RawCollectionState = {
    grants: [],
    inventory: [],
    metadata: null
  };
  let remaining = 3;
  let settled = false;

  const completeOne = () => {
    if (settled) return;
    remaining -= 1;
    if (remaining === 0) {
      settled = true;
      onReady(raw);
    }
  };

  const fail = (error: unknown) => {
    if (settled) return;
    settled = true;
    onFailure(error);
  };

  const grantsRequest = transaction.objectStore(GRANTS_STORE).getAll();
  const inventoryRequest = transaction.objectStore(INVENTORY_STORE).getAll();
  const metadataRequest = transaction
    .objectStore(METADATA_STORE)
    .get(METADATA_KEY);

  grantsRequest.onsuccess = () => {
    raw.grants = grantsRequest.result;
    completeOne();
  };
  inventoryRequest.onsuccess = () => {
    raw.inventory = inventoryRequest.result;
    completeOne();
  };
  metadataRequest.onsuccess = () => {
    raw.metadata = metadataRequest.result;
    completeOne();
  };

  grantsRequest.onerror = () => fail(grantsRequest.error);
  inventoryRequest.onerror = () => fail(inventoryRequest.error);
  metadataRequest.onerror = () => fail(metadataRequest.error);
}

function replaceTransactionState(
  transaction: IDBTransaction,
  state: CardCollectionState
): void {
  const grantsStore = transaction.objectStore(GRANTS_STORE);
  const inventoryStore = transaction.objectStore(INVENTORY_STORE);
  const metadataStore = transaction.objectStore(METADATA_STORE);

  grantsStore.clear();
  inventoryStore.clear();
  metadataStore.clear();

  for (const grant of state.grants) {
    grantsStore.put(grant, grant.rewardId);
  }
  for (const item of state.inventory) {
    inventoryStore.put(item, item.cardId);
  }
  metadataStore.put(state.metadata, METADATA_KEY);
}

class IndexedDbCardCollectionRepository implements CardCollectionRepository {
  constructor(
    private readonly factory: IDBFactory,
    private readonly initialNow: string
  ) {}

  async load(): Promise<CardCollectionState> {
    const database = await openDatabase(this.factory);
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(ALL_STORES, 'readonly');
      let raw: RawCollectionState | null = null;
      let settled = false;

      const fail = (error: unknown, fallback: string) => {
        if (settled) return;
        settled = true;
        database.close();
        reject(errorFrom(error, fallback));
      };

      readStateFromTransaction(
        transaction,
        (value) => {
          raw = value;
        },
        (error) => fail(error, '讀取圖卡收藏資料失敗。')
      );

      transaction.oncomplete = () => {
        if (settled) return;
        settled = true;
        database.close();
        resolve(parseCardCollectionState(raw, this.initialNow));
      };
      transaction.onerror = () => fail(
        transaction.error,
        '讀取圖卡收藏交易失敗。'
      );
      transaction.onabort = () => fail(
        transaction.error,
        '讀取圖卡收藏交易已中止。'
      );
    });
  }

  async transact<T>(
    operation: (
      current: CardCollectionState
    ) => CardCollectionTransactionResult<T>
  ): Promise<T> {
    const database = await openDatabase(this.factory);
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(
        [GRANTS_STORE, INVENTORY_STORE, METADATA_STORE],
        'readwrite'
      );
      let value: T | undefined;
      let hasValue = false;
      let settled = false;

      const fail = (error: unknown, fallback: string) => {
        if (settled) return;
        settled = true;
        database.close();
        reject(errorFrom(error, fallback));
      };

      readStateFromTransaction(
        transaction,
        (raw) => {
          try {
            const current = parseCardCollectionState(raw, this.initialNow);
            const result = operation(current);
            replaceTransactionState(transaction, result.state);
            value = result.value;
            hasValue = true;
          } catch (error) {
            try {
              transaction.abort();
            } catch {
              // The transaction may already be aborting. The original error wins.
            }
            fail(error, '執行圖卡收藏交易失敗。');
          }
        },
        (error) => {
          try {
            transaction.abort();
          } catch {
            // The request failure may already have aborted the transaction.
          }
          fail(error, '讀取圖卡收藏交易資料失敗。');
        }
      );

      transaction.oncomplete = () => {
        if (settled) return;
        if (!hasValue) {
          fail(null, '圖卡收藏交易未產生結果。');
          return;
        }
        settled = true;
        database.close();
        resolve(value as T);
      };
      transaction.onerror = () => fail(
        transaction.error,
        '寫入圖卡收藏交易失敗。'
      );
      transaction.onabort = () => fail(
        transaction.error,
        '圖卡收藏交易已中止。'
      );
    });
  }

  async clear(now: string): Promise<void> {
    const database = await openDatabase(this.factory);
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(
        [GRANTS_STORE, INVENTORY_STORE, METADATA_STORE],
        'readwrite'
      );
      let settled = false;

      const fail = (error: unknown, fallback: string) => {
        if (settled) return;
        settled = true;
        database.close();
        reject(errorFrom(error, fallback));
      };

      try {
        replaceTransactionState(
          transaction,
          createEmptyCardCollectionState(now)
        );
      } catch (error) {
        try {
          transaction.abort();
        } catch {
          // The transaction may already be aborting. The original error wins.
        }
        fail(error, '清除圖卡收藏資料失敗。');
      }

      transaction.oncomplete = () => {
        if (settled) return;
        settled = true;
        database.close();
        resolve();
      };
      transaction.onerror = () => fail(
        transaction.error,
        '清除圖卡收藏交易失敗。'
      );
      transaction.onabort = () => fail(
        transaction.error,
        '清除圖卡收藏交易已中止。'
      );
    });
  }
}

export function createIndexedDbCardCollectionRepository(
  factory: IDBFactory,
  now: string
): CardCollectionRepository {
  return new IndexedDbCardCollectionRepository(factory, now);
}
