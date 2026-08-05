# 成語電台與 YouTube 影音中心 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改變成語填字主玩法與既有進度 schema 的前提下，加入可跨遊戲畫面播放的 HTTPS 網路收音機、可見的 YouTube 影音區、本機媒體清單與 JSON 匯出／匯入。

**Architecture:** 純 TypeScript 規則集中於 `src/media`，負責 URL 解析、資料正規化、匯入匯出、播放互斥與 ducking；React 僅放在 `src/app/media`，負責 `HTMLAudioElement`、YouTube iframe、檔案選擇與畫面事件。媒體使用獨立 `cicg-media` IndexedDB，不改動 `cicg-progress`；打地鼠只透過 controller 狀態通知 `MediaProvider`，不得直接操作播放器。

**Tech Stack:** React 19、TypeScript strict、Node test runner、IndexedDB、HTMLAudioElement、YouTube IFrame embed、Vite PWA；不新增 runtime dependency、後端、登入、YouTube Data API 或 API Key。

## Global Constraints

- 手機優先、大字體、繁體中文、離線優先、可安裝 PWA。
- 首次進入 App 不得自動發聲；播放必須由玩家操作啟動。
- 收音機只接受完整 HTTPS URL，拒絕 credentials、危險協定、HTML embed 與超過 2048 字元的輸入。
- YouTube 僅接受官方網域並解析影片或播放清單 ID；不得把 YouTube 當隱藏式純音訊播放器。
- YouTube 播放器必須可見，保持 16:9，且 CSS 最小可視尺寸不得低於 200 × 200。
- 收音機與 YouTube 互斥；播放一方時暫停另一方。
- 打地鼠播放期間有效收音機音量為最新 `baseVolume × 0.3`；玩家於 ducking 期間修改音量後，結束時恢復新的基準音量。
- 媒體資料庫固定為 `cicg-media` version 1，stores 為 `library` 與 `preferences`。
- 不修改 `cicg-progress`、關卡、星級、智慧跳格、自由接龍規則或打地鼠計分規則。
- Drive 尚無核准媒體來源時，`data/media/default-library.json` 必須為空陣列，不可加入測試或來源不明的正式內容。
- 所有 production 行為先寫失敗測試並確認 RED，再做最小 GREEN。

---

## File Structure

### Create

- `data/media/default-library.json`：核准內建媒體清單；初始為空陣列。
- `src/media/media-types.ts`：資料模型、偏好、匯出格式與錯誤型別。
- `src/media/media-url-parser.ts`：安全 URL 解析、YouTube ID 解析、canonical URL。
- `src/media/media-library.ts`：新增、刪除、收藏、排序、合併與去重純函式。
- `src/media/media-import-export.ts`：schema v1 匯出、解析、驗證與匯入摘要。
- `src/media/media-playback-policy.ts`：互斥播放、基準音量、靜音與 ducking 狀態機。
- `src/media/media-repository.ts`：Repository 介面與記憶體 fallback。
- `src/media/indexeddb-media-repository.ts`：`cicg-media` IndexedDB 實作。
- `src/app/media/MediaProvider.tsx`：媒體狀態、audio element、持久化與打地鼠狀態整合。
- `src/app/media/MediaDock.tsx`：常駐迷你播放器。
- `src/app/media/MediaLibraryPanel.tsx`：收音機／YouTube／收藏／自訂／匯入匯出面板。
- `src/app/media/AddMediaForm.tsx`：新增自訂來源。
- `src/app/media/YouTubePlayer.tsx`：可見 YouTube iframe。
- `src/app/media/media.css`：手機與桌面播放器版面。
- `tests/media-url-parser.test.mjs`
- `tests/media-library.test.mjs`
- `tests/media-import-export.test.mjs`
- `tests/media-playback-policy.test.mjs`

### Modify

- `package.json`：加入 `test:media` 並串入完整 `test`。
- `tsconfig.core.json`：確保 `src/media/**/*.ts` 進入 core 編譯。
- `src/app/App.tsx`：掛載 `MediaProvider`、首頁入口、完整面板與常駐 dock；將打地鼠是否播放傳入 provider。
- `src/app/App.css`：為常駐 dock 預留安全底部空間，避免遮蔽遊戲操作。
- `README.md`：記錄媒體功能、網路限制與資料保存方式。

---

### Task 1: 安全媒體 URL 解析

**Files:**
- Create: `tests/media-url-parser.test.mjs`
- Create: `src/media/media-types.ts`
- Create: `src/media/media-url-parser.ts`
- Modify: `package.json`
- Modify: `tsconfig.core.json`

**Interfaces:**
- Produces: `parseMediaSource(input: string, requestedType: MediaItemType): ParsedMediaSource`
- Produces: `normalizeHttpsUrl(input: string): string`
- Produces: `MediaItemType`, `ParsedMediaSource`, `MediaValidationError`

- [ ] **Step 1: Write failing tests**

Cover these exact cases:

```js
assert.deepEqual(
  parseMediaSource('https://youtu.be/dQw4w9WgXcQ?t=4', 'youtube-video'),
  {
    type: 'youtube-video',
    canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtubeVideoId: 'dQw4w9WgXcQ'
  }
);
assert.equal(
  parseMediaSource('https://www.youtube.com/playlist?list=PL1234567890_abc', 'youtube-playlist').youtubePlaylistId,
  'PL1234567890_abc'
);
assert.equal(
  parseMediaSource('https://radio.example/live.mp3#player', 'radio').canonicalUrl,
  'https://radio.example/live.mp3'
);
assert.throws(() => parseMediaSource('http://radio.example/live', 'radio'));
assert.throws(() => parseMediaSource('javascript:alert(1)', 'radio'));
assert.throws(() => parseMediaSource('<iframe src="https://youtube.com/embed/x"></iframe>', 'youtube-video'));
assert.throws(() => parseMediaSource('https://user:pass@example.com/live', 'radio'));
assert.throws(() => parseMediaSource('https://example.com/watch?v=dQw4w9WgXcQ', 'youtube-video'));
```

- [ ] **Step 2: Run RED**

Run: `npm run test:media`

Expected: FAIL because `src/media/media-url-parser.js` does not exist.

- [ ] **Step 3: Implement minimal parser**

Rules:

```ts
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const PLAYLIST_ID = /^[A-Za-z0-9_-]{10,80}$/;
const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com'
]);
```

`normalizeHttpsUrl` must trim input, reject `<`, `>`, credentials, non-HTTPS protocols and length over 2048, lowercase host through `URL`, remove fragment and retain query for radio.

`parseMediaSource` must support `watch?v=`, `youtu.be/`, `/shorts/`, `/embed/`, and `/playlist?list=`. When a URL includes both `v` and `list`, the requested type decides which canonical result is returned.

- [ ] **Step 4: Run GREEN**

Run: `npm run test:media`

Expected: all URL parser tests pass.

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.core.json tests/media-url-parser.test.mjs src/media/media-types.ts src/media/media-url-parser.ts
git commit -m "feat: validate media source URLs"
```

---

### Task 2: 媒體清單規則與空白內建清單

**Files:**
- Create: `data/media/default-library.json`
- Create: `tests/media-library.test.mjs`
- Create: `src/media/media-library.ts`
- Modify: `src/media/media-types.ts`

**Interfaces:**
- Consumes: `parseMediaSource`
- Produces: `createCustomMediaItem`, `mergeMediaLibraries`, `removeCustomMediaItem`, `toggleMediaFavorite`, `reorderCustomMediaItems`

- [ ] **Step 1: Write failing tests**

Tests must prove:

- built-in items cannot be deleted;
- custom items can be deleted;
- duplicate canonical URL is rejected regardless of differing title;
- title is trimmed and limited to 80 characters;
- category is trimmed and limited to 30 characters;
- favorites are immutable and deterministic;
- reorder affects only custom items and rejects unknown IDs;
- default library JSON parses as an empty array while no Drive approvals exist.

Example:

```js
const first = createCustomMediaItem({
  id: 'custom-1',
  type: 'radio',
  title: '  夜讀電台  ',
  category: '音樂',
  sourceUrl: 'https://radio.example/live'
}, '2026-08-06T00:00:00.000Z');
assert.equal(first.title, '夜讀電台');
assert.throws(() => mergeMediaLibraries([first], [{ ...first, id: 'custom-2' }]));
```

- [ ] **Step 2: Run RED**

Run: `npm run test:media`

Expected: FAIL because media library functions do not exist.

- [ ] **Step 3: Implement minimal immutable library functions**

Do not access React, DOM, IndexedDB or random APIs. `createCustomMediaItem` receives ID and timestamp as arguments so tests remain deterministic. `mergeMediaLibraries` uses canonical URL as the duplicate key.

- [ ] **Step 4: Run GREEN**

Run: `npm run test:media`

Expected: URL and library tests pass.

- [ ] **Step 5: Commit**

```bash
git add data/media/default-library.json tests/media-library.test.mjs src/media/media-types.ts src/media/media-library.ts
git commit -m "feat: add local media library rules"
```

---

### Task 3: JSON 匯出與安全匯入

**Files:**
- Create: `tests/media-import-export.test.mjs`
- Create: `src/media/media-import-export.ts`
- Modify: `src/media/media-types.ts`

**Interfaces:**
- Produces: `exportMediaBackup(input: MediaBackupInput): string`
- Produces: `importMediaBackup(json: string, current: MediaState): MediaImportResult`

- [ ] **Step 1: Write failing tests**

Prove:

- export uses `schemaVersion: 1` and supplied ISO timestamp;
- export contains only custom items, favorites and preferences, never built-in item definitions;
- malformed JSON throws `MediaImportError` and returns no partial next state;
- unsupported schema is rejected;
- unsafe URLs are rejected item-by-item;
- duplicates by ID or canonical URL are skipped;
- built-in IDs cannot be overwritten;
- import summary reports exact `added`, `skipped`, `failed` counts;
- preferences volume is clamped to `0..1` and booleans are validated.

- [ ] **Step 2: Run RED**

Run: `npm run test:media`

Expected: FAIL because import/export module does not exist.

- [ ] **Step 3: Implement schema v1 parser**

Parse into temporary local variables, validate all top-level structure first, then produce a new immutable state. Never mutate the current state. Invalid top-level JSON/schema aborts the whole import; invalid individual library records increment `failed` and are omitted.

- [ ] **Step 4: Run GREEN**

Run: `npm run test:media`

Expected: all media core tests pass.

- [ ] **Step 5: Commit**

```bash
git add tests/media-import-export.test.mjs src/media/media-types.ts src/media/media-import-export.ts
git commit -m "feat: import and export media backups"
```

---

### Task 4: 播放互斥與打地鼠 ducking policy

**Files:**
- Create: `tests/media-playback-policy.test.mjs`
- Create: `src/media/media-playback-policy.ts`
- Modify: `src/media/media-types.ts`

**Interfaces:**
- Produces: `createInitialPlaybackState(preferences)`
- Produces: `reducePlaybackState(state, action)`
- Produces actions: `PLAY_RADIO`, `PLAY_YOUTUBE`, `PAUSE_ALL`, `SET_BASE_VOLUME`, `SET_MUTED`, `BONUS_STARTED`, `BONUS_ENDED`

- [ ] **Step 1: Write failing tests**

Prove:

```js
let state = createInitialPlaybackState({ volume: 0.8, muted: false });
state = reducePlaybackState(state, { type: 'PLAY_RADIO', itemId: 'r1' });
assert.equal(state.activeSource, 'radio');
state = reducePlaybackState(state, { type: 'PLAY_YOUTUBE', itemId: 'y1' });
assert.equal(state.activeSource, 'youtube');
assert.equal(state.radioPlaying, false);
state = reducePlaybackState(state, { type: 'BONUS_STARTED' });
assert.equal(state.effectiveVolume, 0.24);
state = reducePlaybackState(state, { type: 'SET_BASE_VOLUME', volume: 0.5 });
assert.equal(state.effectiveVolume, 0.15);
state = reducePlaybackState(state, { type: 'BONUS_ENDED' });
assert.equal(state.effectiveVolume, 0.5);
```

Also test repeated start/end actions are idempotent, mute produces effective volume zero, volume clamps to `0..1`, and YouTube state is never represented as hidden audio.

- [ ] **Step 2: Run RED**

Run: `npm run test:media`

Expected: FAIL because playback policy does not exist.

- [ ] **Step 3: Implement pure reducer**

`effectiveVolume = muted ? 0 : baseVolume * (bonusActive ? 0.3 : 1)`. The reducer must be deterministic and DOM-free.

- [ ] **Step 4: Run GREEN**

Run: `npm run test:media`

Expected: all media tests pass.

- [ ] **Step 5: Commit**

```bash
git add tests/media-playback-policy.test.mjs src/media/media-types.ts src/media/media-playback-policy.ts
git commit -m "feat: add media playback policy"
```

---

### Task 5: IndexedDB repository and resilient fallback

**Files:**
- Create: `src/media/media-repository.ts`
- Create: `src/media/indexeddb-media-repository.ts`
- Modify: `src/media/media-types.ts`

**Interfaces:**
- Produces: `MediaRepository.load(): Promise<PersistedMediaState | null>`
- Produces: `MediaRepository.save(state): Promise<void>`
- Produces: `createIndexedDbMediaRepository(factory: IDBFactory)`
- Produces: `createMemoryMediaRepository(initial?)`

- [ ] **Step 1: Add compile-first contract tests to `tests/media-import-export.test.mjs`**

Use memory repository real behavior:

```js
const repository = createMemoryMediaRepository(null);
assert.equal(await repository.load(), null);
await repository.save(state);
assert.deepEqual(await repository.load(), state);
```

Ensure values are copied/frozen so callers cannot mutate stored state.

- [ ] **Step 2: Run RED**

Run: `npm run test:media`

Expected: FAIL because repository module does not exist.

- [ ] **Step 3: Implement repositories**

IndexedDB constants:

```ts
const DATABASE_NAME = 'cicg-media';
const DATABASE_VERSION = 1;
const LIBRARY_STORE = 'library';
const PREFERENCES_STORE = 'preferences';
const CUSTOM_LIBRARY_KEY = 'custom-items';
const PREFERENCES_KEY = 'player';
```

Create both stores during `onupgradeneeded`. Load both records in one readonly transaction; save both in one readwrite transaction. Close database on success and all failures. Surface Traditional Chinese errors but let the provider fall back to memory.

- [ ] **Step 4: Run GREEN and typecheck**

Run: `npm run test:media && npm run typecheck`

Expected: tests and strict typecheck pass.

- [ ] **Step 5: Commit**

```bash
git add tests/media-import-export.test.mjs src/media/media-types.ts src/media/media-repository.ts src/media/indexeddb-media-repository.ts
git commit -m "feat: persist media settings locally"
```

---

### Task 6: React MediaProvider and real audio lifecycle

**Files:**
- Create: `src/app/media/MediaProvider.tsx`
- Create: `src/app/media/MediaDock.tsx`
- Create: `src/app/media/MediaLibraryPanel.tsx`
- Create: `src/app/media/AddMediaForm.tsx`
- Create: `src/app/media/YouTubePlayer.tsx`
- Create: `src/app/media/media.css`
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.css`

**Interfaces:**
- Produces: `<MediaProvider bonusActive={boolean}>`
- Produces: `useMedia()` controller with library, preferences, active item, panel state, add/remove/favorite/reorder/import/export/play/pause/setVolume/setMuted methods.

- [ ] **Step 1: Add static integration assertions**

Because the repository uses Node’s built-in runner without a DOM test library, extend `tests/media-library.test.mjs` to read source files and assert architectural contracts:

- `App.tsx` imports and mounts `MediaProvider` once outside mode-specific returns;
- `use-whack-a-mole.ts` remains free of `HTMLAudioElement`, iframe and direct volume manipulation;
- `YouTubePlayer.tsx` uses a visible iframe with `title`, `allow`, `referrerPolicy="strict-origin-when-cross-origin"`, `allowFullScreen`, and no `display: none`;
- `media.css` contains `min-width: 200px`, `min-height: 200px`, `aspect-ratio: 16 / 9` and safe-area padding.

- [ ] **Step 2: Run RED**

Run: `npm run test:media`

Expected: FAIL because React media files and provider mount do not exist.

- [ ] **Step 3: Implement Provider**

Provider behavior:

- create exactly one `Audio` element in a ref after mount;
- on selected radio source, set `audio.src` to canonical URL and call `play()` only from explicit user handler;
- apply reducer `effectiveVolume` to `audio.volume` and `muted` to `audio.muted`;
- playing radio dispatches/publishes a YouTube pause token;
- opening and playing YouTube pauses audio;
- close YouTube panel pauses YouTube by unmounting iframe and sets active source null;
- hydrate from IndexedDB, catch failure and continue with memory state plus non-blocking warning;
- persist changes serially after hydration;
- export through `Blob` and temporary object URL;
- import through file text and `importMediaBackup`;
- offline state disables play controls with a clear message but never blocks game children.

- [ ] **Step 4: Implement UI**

`MediaDock` must remain visible only when an item is selected or playing. `MediaLibraryPanel` is a modal/dialog-like fixed panel with tabs and close button. `AddMediaForm` chooses type, title, category and URL. Radio add performs a user-initiated 10-second trial using a temporary `Audio` element; success is `playing`, `canplay` or `loadedmetadata`, failure/timeout aborts save.

`YouTubePlayer` src:

```ts
const src = item.type === 'youtube-video'
  ? `https://www.youtube.com/embed/${item.youtubeVideoId}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`
  : `https://www.youtube.com/embed/videoseries?list=${item.youtubePlaylistId}&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
```

Do not enable autoplay. Add `loading="lazy"`.

- [ ] **Step 5: Wire App without mode remounts**

Refactor `App` into an inner `AppContent` that returns mode UI, then render:

```tsx
<MediaProvider bonusActive={game.bonus.view === 'playing'}>
  <AppContent ... />
</MediaProvider>
```

The provider must be above `home`, `campaign` and `classic` branches so radio audio survives mode switching. Add a home button labeled `成語電台／影音`.

- [ ] **Step 6: Run GREEN**

Run: `npm run test:media && npm run typecheck && npm run lint && npm run build`

Expected: all pass; PWA build creates service worker without attempting to precache remote media.

- [ ] **Step 7: Commit**

```bash
git add src/app/App.tsx src/app/App.css src/app/media tests/media-library.test.mjs
git commit -m "feat: add media center interface"
```

---

### Task 7: Documentation, final audit and merge

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-08-06-media-center-design.md`
- Create: `docs/superpowers/reports/2026-08-06-media-center-delivery.md`

- [ ] **Step 1: Update README**

Document:

- radio and YouTube are optional network features;
- game remains playable offline;
- first sound requires user interaction;
- custom library is local to current device;
- JSON export/import transfers custom items and preferences;
- YouTube is visible official embed, not audio extraction;
- built-in list remains empty until Drive approval evidence exists.

- [ ] **Step 2: Run full verification**

```bash
npm install
./scripts/verify.sh
```

Record exact counts for all test suites, TypeScript, ESLint, Vite PWA build and npm audit.

- [ ] **Step 3: Review diff against scope**

Verify no modifications to:

- `src/domain/progress.ts`
- `src/progress/**`
- `src/puzzle/**`
- `src/game/bonus/**`
- PWA configuration or runtime dependencies

`src/app/use-whack-a-mole.ts` should remain unchanged unless a narrowly tested read-only callback is required; preferred integration reads `game.bonus.view` from `App.tsx`.

- [ ] **Step 4: Verify branch drift**

Run:

```bash
git fetch origin
git rev-list --left-right --count origin/main...HEAD
```

Expected before merge: `0 <ahead>`.

- [ ] **Step 5: Update PR and squash merge**

PR body must include:

- TDD RED and GREEN evidence;
- exact changed files;
- test counts;
- TypeScript/Lint/Build/PWA/audit results;
- Drive content status and the empty built-in library decision;
- confirmation that progress schema and main gameplay are unchanged.

Squash merge only after final same-tree CI succeeds and `behind_by = 0`.
