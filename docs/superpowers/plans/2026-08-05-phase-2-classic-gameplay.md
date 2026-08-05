# Phase 2 Classic Gameplay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將 PWA 首頁升級為可完整遊玩的單機經典成語接龍，包含起始成語、輸入驗證、計分、連擊、提示、歷史紀錄與重新開始。

**Architecture:** 遊戲規則維持純 TypeScript 狀態機，不依賴 React、瀏覽器 API 或隨機來源。React 只負責載入字典、持有狀態並呈現介面；所有接龍判定、計分與提示候選由 `game-engine` 公開函式處理。字典以 build 產出的 JSON 載入，失敗時顯示可恢復錯誤。

**Tech Stack:** React 19、TypeScript 6、Vite 8、Node.js 22 `node:test`、既有 PWA 與成語資料管線。

## Global Constraints

- 接龍採前一成語最後一字等於下一成語第一字，不採同音字。
- 同一局不可重複成語。
- 只接受字典中 `enabled === true` 的四字成語。
- 正確答案基礎分 100；連擊加成每次 +20，上限 +200。
- 使用提示扣 50 分且不得低於 0；提示只揭示一個未使用候選。
- 經典模式錯誤不結束遊戲；顯示具體錯誤原因後可繼續輸入。
- 無可接續候選時，以 `completed` 結束並顯示完成訊息。
- 所有按鈕高度至少 56px，主要成語至少 44px。
- 不加入計時模式、選擇題模式、登入、雲端同步或後端。

---

### Task 1: 以 TDD 建立經典模式狀態機

**Files:**
- Create: `src/game/game-engine.ts`
- Create: `tests/game-engine.test.mjs`
- Modify: `src/domain/game.ts`
- Modify: `tsconfig.core.json`
- Modify: `package.json`

**Interfaces:**

```ts
export interface GameEngineOptions {
  readonly createSessionId?: () => string;
  readonly now?: () => string;
  readonly pickIndex?: (length: number) => number;
}

export function createClassicSession(
  index: IdiomIndex,
  options?: GameEngineOptions
): GameSession;

export function submitClassicTurn(
  session: GameSession,
  input: string,
  index: IdiomIndex
): { readonly session: GameSession; readonly result: TurnResult };

export function requestClassicHint(
  session: GameSession,
  index: IdiomIndex,
  options?: Pick<GameEngineOptions, 'pickIndex'>
): { readonly session: GameSession; readonly idiom: Idiom | null };
```

- [x] Write a failing test proving a session starts from an enabled idiom that has an unused continuation.
- [x] Run `npm run test:game` and verify RED because `game-engine` does not exist.
- [x] Implement the minimum deterministic session factory.
- [x] Add failing tests one behavior at a time for not-found, chain mismatch, duplicate, correct score, combo growth, combo cap, hint deduction and no-candidate completion.
- [x] Implement only enough production logic to make each test green.
- [x] Refactor shared immutable-session helpers while keeping all tests green.

### Task 2: 建立瀏覽器字典載入服務

**Files:**
- Create: `src/idioms/load-dictionary.ts`
- Create: `tests/load-dictionary.test.mjs`

**Interfaces:**

```ts
export interface DictionaryLoadResult {
  readonly payload: IdiomDictionaryPayload;
  readonly index: IdiomIndex;
}

export async function loadDictionary(
  fetcher?: DictionaryFetcher
): Promise<DictionaryLoadResult>;
```

- [x] Write a failing test for successful `/generated/manifest.json` then versioned dictionary loading.
- [x] Verify malformed payload, non-OK response, count mismatch and empty enabled dictionary each produce a Traditional Chinese error.
- [x] Implement runtime validation without adding a schema library.

### Task 3: 建立大字體可玩介面

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.css`
- Create: `src/app/use-classic-game.ts`

**Interfaces:**
- `useClassicGame()` exposes loading/error/session/feedback/input actions.
- React component never directly calculates scores or validates chaining.

- [x] Replace disabled Phase 2 button with loading state and active「開始遊戲」button.
- [x] Add game screen showing current idiom, required first character, score, combo and used count.
- [x] Add four-character text input with Enter submission and visible validation feedback.
- [x] Add「送出」「提示」「重新開始」buttons.
- [x] Show the latest six accepted idioms as large history chips.
- [x] Show a completion panel when no unused continuation remains.
- [x] Keep 360px width free of horizontal scrolling and preserve reduced-motion support.

### Task 4: 更新文件與全面驗證

- [x] Update completed and pending scope accurately.
- [x] Run `npm test`: 27 tests passed, 0 failed.
- [x] Run `node scripts/build-idioms.mjs`: 37 records, checksum begins `8d4ed62bc216`.
- [x] Run `tsc -p tsconfig.core.json`, shell syntax checks, diff checks and placeholder scan.
- [x] Attempt full `npm install`: sandbox registry returned 404 for `@eslint/js@10.0.1`; full browser build remains an environment-limited verification item.
- [ ] Spot-check remote files after upload.
- [ ] Fast-forward `main` after the remote branch is verified ahead and not behind.
