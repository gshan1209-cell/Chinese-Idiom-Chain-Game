import type { CampaignProgress } from '../domain/progress.js';
import { parseCampaignProgress } from './progress-serialization.js';
import type { CampaignProgressRepository } from './progress-repository.js';

const DATABASE_NAME = 'cicg-progress';
const DATABASE_VERSION = 1;
const STORE_NAME = 'campaigns';
const CAMPAIGN_KEY = 'chapter-1';

function errorFrom(value: unknown, fallback: string): Error {
  return value instanceof Error ? value : new Error(fallback);
}

function openDatabase(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let request: IDBOpenDBRequest;
    try {
      request = factory.open(DATABASE_NAME, DATABASE_VERSION);
    } catch (error) {
      reject(errorFrom(error, '無法開啟闖關進度資料庫。'));
      return;
    }

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(errorFrom(request.error, '無法開啟闖關進度資料庫。'));
    request.onblocked = () => reject(new Error('闖關進度資料庫目前被其他分頁阻擋。'));
  });
}

async function readRecord(factory: IDBFactory): Promise<unknown> {
  const database = await openDatabase(factory);
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get(CAMPAIGN_KEY);
    let settled = false;

    const fail = (error: unknown, fallback: string) => {
      if (settled) return;
      settled = true;
      database.close();
      reject(errorFrom(error, fallback));
    };

    request.onsuccess = () => {
      if (settled) return;
      settled = true;
      database.close();
      resolve(request.result);
    };
    request.onerror = () => fail(request.error, '讀取闖關進度失敗。');
    transaction.onerror = () => fail(transaction.error, '讀取闖關進度交易失敗。');
    transaction.onabort = () => fail(transaction.error, '讀取闖關進度交易已中止。');
  });
}

async function writeRecord(factory: IDBFactory, value: CampaignProgress | null): Promise<void> {
  const database = await openDatabase(factory);
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = value === null
      ? store.delete(CAMPAIGN_KEY)
      : store.put(value, CAMPAIGN_KEY);
    let settled = false;

    const fail = (error: unknown, fallback: string) => {
      if (settled) return;
      settled = true;
      database.close();
      reject(errorFrom(error, fallback));
    };

    request.onerror = () => fail(request.error, '寫入闖關進度失敗。');
    transaction.onerror = () => fail(transaction.error, '寫入闖關進度交易失敗。');
    transaction.onabort = () => fail(transaction.error, '寫入闖關進度交易已中止。');
    transaction.oncomplete = () => {
      if (settled) return;
      settled = true;
      database.close();
      resolve();
    };
  });
}

export function createIndexedDbProgressRepository(
  factory: IDBFactory
): CampaignProgressRepository {
  return Object.freeze({
    async load(totalLevels: number): Promise<CampaignProgress> {
      const value = await readRecord(factory);
      return parseCampaignProgress(value, totalLevels, new Date().toISOString());
    },
    async save(progress: CampaignProgress): Promise<void> {
      await writeRecord(factory, progress);
    },
    async clear(): Promise<void> {
      await writeRecord(factory, null);
    }
  });
}
