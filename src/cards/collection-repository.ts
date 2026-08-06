import {
  createEmptyCardCollectionState,
  parseCardCollectionState
} from './collection-serialization.js';
import type {
  CardCollectionRepository,
  CardCollectionState,
  CardCollectionTransactionResult
} from './card-types.js';

function cloneState(state: CardCollectionState): CardCollectionState {
  return parseCardCollectionState(state, state.metadata.updatedAt);
}

class MemoryCardCollectionRepository implements CardCollectionRepository {
  private state: CardCollectionState;

  constructor(now: string, initial?: unknown) {
    this.state = initial === undefined
      ? createEmptyCardCollectionState(now)
      : parseCardCollectionState(initial, now);
  }

  load(): Promise<CardCollectionState> {
    return Promise.resolve(cloneState(this.state));
  }

  transact<T>(
    operation: (
      current: CardCollectionState
    ) => CardCollectionTransactionResult<T>
  ): Promise<T> {
    try {
      const result = operation(cloneState(this.state));
      const next = parseCardCollectionState(
        result.state,
        this.state.metadata.updatedAt
      );
      this.state = next;
      return Promise.resolve(result.value);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  clear(now: string): Promise<void> {
    this.state = createEmptyCardCollectionState(now);
    return Promise.resolve();
  }
}

export function createMemoryCardCollectionRepository(
  now: string,
  initial?: unknown
): CardCollectionRepository {
  return new MemoryCardCollectionRepository(now, initial);
}
