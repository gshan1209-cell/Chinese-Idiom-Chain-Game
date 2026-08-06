export interface CollectionWriteQueue {
  enqueue(operation: () => Promise<void>): Promise<void>;
}

export function createCollectionWriteQueue(): CollectionWriteQueue {
  let tail: Promise<void> = Promise.resolve();

  return Object.freeze({
    enqueue(operation: () => Promise<void>): Promise<void> {
      const result = tail.then(operation);
      tail = result.catch(() => undefined);
      return result;
    }
  });
}
