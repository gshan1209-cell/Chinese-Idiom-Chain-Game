# Phase 0–1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立可啟動的 React + TypeScript + Vite PWA 骨架，以及可離線載入、可驗證、可索引的第一版繁體中文成語資料層。

**Architecture:** 前端採單頁 React PWA；領域型別、成語資料驗證與索引邏輯皆放在不依賴 React 的純 TypeScript 模組。原始成語內容保存為 CSV，建置腳本輸出版本化 JSON 與首字索引；核心邏輯以 Node 內建測試框架執行，避免測試依賴瀏覽器。

**Tech Stack:** React 19、TypeScript 5、Vite 7、vite-plugin-pwa、Node.js 22、Node `test`、ESLint、CSS Design Tokens。

## Global Constraints

- MVP 不使用後端、不使用 LLM、不收集個人資料。
- 接龍採完全相同中文字，不採同音字。
- 僅接受啟用且符合四個中文字格式的成語。
- 成語內容與程式碼分離，來源資料使用 `data/idioms.source.csv`。
- TypeScript 開啟 strict mode。
- 主要文字至少 24px，主要按鈕高度至少 56px。
- PWA 使用 `display: standalone`，預快取 App Shell 與字典產物。
- Repository 必須提供 `start.sh`、`build.sh`、`test.sh`、`scripts/verify.sh`。
- 不加入登入、排行榜、多人連線、金流或生成式 AI。

---

## File Map

```text
.
├── .github/workflows/ci.yml              # typecheck、資料驗證、測試與建置
├── data/
│   ├── idioms.source.csv                 # 人工維護的來源資料
│   └── schema/idiom.schema.json          # 成語 JSON Schema
├── docs/superpowers/plans/...            # 本實作計畫
├── public/
│   ├── icons/icon-192.png
│   ├── icons/icon-512.png
│   └── generated/                        # 建置產出的字典與索引
├── scripts/
│   ├── build-idioms.mjs                  # CSV 解析、驗證、索引與輸出
│   ├── build-idioms.test.mjs             # 資料管線測試
│   └── verify.sh                         # 一鍵驗證
├── src/
│   ├── app/App.tsx                       # 首頁 App Shell
│   ├── app/App.css                       # 大字體與響應式樣式
│   ├── domain/idiom.ts                    # Idiom 型別與難度定義
│   ├── domain/game.ts                     # Phase 2 會使用的遊戲契約
│   ├── idioms/idiom-index.ts              # 索引建立與查詢純函式
│   ├── idioms/idiom-index.test.mjs        # 索引測試
│   ├── main.tsx                           # React 入口
│   └── vite-env.d.ts                      # Vite 型別宣告
├── index.html
├── package.json
├── tsconfig*.json
├── vite.config.ts
├── eslint.config.js
├── start.sh
├── build.sh
└── test.sh
```

### Task 1: 建立可安裝 PWA 專案骨架

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `eslint.config.js`
- Create: `src/main.tsx`
- Create: `src/vite-env.d.ts`
- Create: `src/app/App.tsx`
- Create: `src/app/App.css`
- Create: `public/icons/icon-192.png`
- Create: `public/icons/icon-512.png`

**Interfaces:**
- Consumes: 無。
- Produces: `App` React component；PWA manifest 名稱「中文成語接龍」；`npm run dev|build|typecheck|lint` scripts。

- [ ] **Step 1: 定義 package scripts 與依賴**

```json
{
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build:data": "node scripts/build-idioms.mjs",
    "build": "npm run build:data && tsc -b && vite build",
    "typecheck": "tsc -b --pretty false",
    "lint": "eslint .",
    "test": "npm run test:data && npm run test:index",
    "test:data": "node --test scripts/build-idioms.test.mjs",
    "test:index": "npm run compile:core && node --test .test-dist/idiom-index.test.mjs",
    "compile:core": "tsc -p tsconfig.core.json"
  }
}
```

- [ ] **Step 2: 建立最小 React App Shell**

首頁必須顯示「中文成語接龍」、「看得清楚，離線也能玩」及停用狀態的「開始遊戲」按鈕；按鈕旁標示「Phase 2 開放」，避免誤導為功能已完成。

- [ ] **Step 3: 設定 PWA manifest 與預快取規則**

`vite.config.ts` 使用 `VitePWA`，設定：

```ts
manifest: {
  name: '中文成語接龍',
  short_name: '成語接龍',
  lang: 'zh-TW',
  display: 'standalone',
  start_url: '/',
  theme_color: '#7c2d12',
  background_color: '#fff7ed',
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
  ]
}
```

- [ ] **Step 4: 建立大字體 Design Tokens**

CSS 必須包含 `--font-body: 24px`、`--font-title: clamp(3rem, 11vw, 5rem)`、`--button-height: 56px`，並確保 360px 寬無水平捲軸。

- [ ] **Step 5: 檢查設定檔可被 TypeScript 解析**

Run: `tsc -p tsconfig.node.json --pretty false`
Expected: 若依賴尚未安裝，只允許缺少 `vite`／React 型別；不得出現本專案語法錯誤。

- [ ] **Step 6: Commit**

```bash
git add package.json index.html vite.config.ts tsconfig*.json eslint.config.js src public/icons
git commit -m "feat: scaffold large-type PWA shell"
```

### Task 2: 以 TDD 定義成語資料管線

**Files:**
- Create: `data/idioms.source.csv`
- Create: `data/schema/idiom.schema.json`
- Create: `scripts/build-idioms.test.mjs`
- Create: `scripts/build-idioms.mjs`
- Create: `public/generated/.gitkeep`

**Interfaces:**
- Consumes: CSV 欄位 `id,text,bopomofo,pinyin,meaning,example,source,difficulty,tags,enabled,version`。
- Produces: `validateIdiomRecord(record, rowNumber)`、`parseCsv(text)`、`buildDictionary(records)`；輸出 `public/generated/idioms.v1.json`、`public/generated/idiom-index.v1.json`、`public/generated/manifest.json`。

- [ ] **Step 1: 寫入第一個失敗測試：拒絕非四字成語**

```js
test('validateIdiomRecord rejects text that is not four Han characters', () => {
  assert.throws(
    () => validateIdiomRecord({ ...validRecord, text: '一心' }, 2),
    /第 2 列.*四個中文字/
  );
});
```

- [ ] **Step 2: 執行測試並確認 RED**

Run: `node --test scripts/build-idioms.test.mjs`
Expected: FAIL，原因為 `scripts/build-idioms.mjs` 或匯出函式尚不存在。

- [ ] **Step 3: 實作最小驗證器使測試通過**

驗證規則：ID 非空、文字符合 `/^[\p{Script=Han}]{4}$/u`、`meaning` 非空、難度為 `easy|normal|hard`、enabled 為布林、version 為正整數。

- [ ] **Step 4: 新增並驗證其餘失敗測試**

必須逐一加入並先看見失敗：重複 ID、重複文字、首尾字輸出一致、CSV 引號與逗號解析、停用成語不進入索引、相同首字建立候選陣列。

- [ ] **Step 5: 實作 CSV 解析、字典建立與穩定輸出**

`buildDictionary` 回傳：

```js
{
  idioms: [{ id, text, firstChar, lastChar, bopomofo, pinyin, meaning, example, source, difficulty, tags, enabled, version }],
  firstCharIndex: { 意: ['idiom-0002'] },
  lastCharIndex: { 意: ['idiom-0001'] }
}
```

- [ ] **Step 6: 加入至少 24 筆可形成多條接龍的人工示範資料**

資料內容需含解釋與來源欄位；來源標記為「示範資料，正式發布前需完成授權與校訂」，README 必須清楚說明不可視為正式教育內容。

- [ ] **Step 7: 執行資料建置與測試**

Run: `node --test scripts/build-idioms.test.mjs && node scripts/build-idioms.mjs`
Expected: 全部 PASS，並建立三個 generated JSON 檔。

- [ ] **Step 8: Commit**

```bash
git add data scripts public/generated
git commit -m "feat: add validated idiom data pipeline"
```

### Task 3: 以 TDD 建立成語索引查詢服務

**Files:**
- Create: `src/domain/idiom.ts`
- Create: `src/domain/game.ts`
- Create: `src/idioms/idiom-index.ts`
- Create: `tests/idiom-index.test.ts`
- Create: `tests/idiom-index.test.mjs`
- Create: `tsconfig.core.json`

**Interfaces:**
- Consumes: `Idiom[]`。
- Produces:

```ts
export interface IdiomIndex {
  readonly byId: ReadonlyMap<string, Idiom>;
  readonly byText: ReadonlyMap<string, Idiom>;
  readonly byFirstChar: ReadonlyMap<string, readonly Idiom[]>;
  readonly byLastChar: ReadonlyMap<string, readonly Idiom[]>;
}

export function createIdiomIndex(idioms: readonly Idiom[]): IdiomIndex;
export function getCandidatesByFirstChar(index: IdiomIndex, char: string): readonly Idiom[];
export function getIdiomByText(index: IdiomIndex, text: string): Idiom | null;
```

- [ ] **Step 1: 寫入第一個失敗測試：依首字取得啟用候選**

```js
test('returns enabled idioms whose first character matches', () => {
  const index = createIdiomIndex(fixtures);
  assert.deepEqual(
    getCandidatesByFirstChar(index, '意').map((idiom) => idiom.text),
    ['意氣風發', '意想不到']
  );
});
```

- [ ] **Step 2: 編譯並確認 RED**

Run: `tsc -p tsconfig.core.json && node --test .test-dist/idiom-index.test.mjs`
Expected: FAIL，原因為函式尚未定義或輸出檔不存在。

- [ ] **Step 3: 實作最小索引**

只索引 `enabled === true` 的資料；輸入字元先 `trim()`，非單一中文字回傳空陣列。

- [ ] **Step 4: 新增並先看見失敗的測試**

涵蓋：依文字查詢、停用資料排除、重複 ID 拋錯、重複文字拋錯、回傳空陣列不可修改內部索引。

- [ ] **Step 5: 完成型別與遊戲契約**

`src/domain/game.ts` 定義 `GameMode = 'classic' | 'timed' | 'choice'`、`Difficulty`、`GameSession`、`TurnErrorCode`、`TurnResult`，但不實作 Phase 2 狀態機。

- [ ] **Step 6: 執行測試與核心 TypeScript 檢查**

Run: `npm run test:index`
Expected: PASS，0 failures。

- [ ] **Step 7: Commit**

```bash
git add src/domain src/idioms tests tsconfig.core.json
git commit -m "feat: add typed idiom index service"
```

### Task 4: 建立一鍵啟動、驗證與 CI

**Files:**
- Create: `start.sh`
- Create: `build.sh`
- Create: `test.sh`
- Create: `scripts/verify.sh`
- Create: `.github/workflows/ci.yml`
- Create: `README.md`

**Interfaces:**
- Consumes: npm scripts。
- Produces: 標準操作入口 `./start.sh`、`./test.sh`、`./build.sh`、`./scripts/verify.sh`。

- [ ] **Step 1: 建立 shell 腳本並使用嚴格模式**

每支腳本以 `#!/usr/bin/env bash`、`set -euo pipefail` 開頭；`start.sh` 在缺少 `node_modules` 時執行 `npm install`，之後執行 `npm run dev -- --host 0.0.0.0`。

- [ ] **Step 2: 建立 verify 流程**

```bash
npm run build:data
npm run test
npm run typecheck
npm run lint
npm run build
```

- [ ] **Step 3: 建立 CI**

GitHub Actions 使用 Node 22，執行 `npm ci` 與 `./scripts/verify.sh`；只在 `main` push 與 PR 執行。

- [ ] **Step 4: 撰寫 README**

README 必須包含：產品定位、Phase 0–1 已完成項目、尚未完成項目、安裝與執行、資料更新流程、示範資料授權警語、PWA 驗收方式。

- [ ] **Step 5: 驗證 shell 語法**

Run: `bash -n start.sh build.sh test.sh scripts/verify.sh`
Expected: 無輸出、exit 0。

- [ ] **Step 6: Commit**

```bash
git add start.sh build.sh test.sh scripts/verify.sh .github README.md
git commit -m "chore: add repository run and verification workflow"
```

### Task 5: 全面驗證與交付

**Files:**
- Modify only when validation exposes a defect.

**Interfaces:**
- Consumes: Tasks 1–4 全部產物。
- Produces: 可審核的 Phase 0–1 基線。

- [ ] **Step 1: 執行可離線 Sandbox 驗證**

Run:

```bash
node --test scripts/build-idioms.test.mjs
node scripts/build-idioms.mjs
tsc -p tsconfig.core.json
node --test .test-dist/idiom-index.test.mjs
bash -n start.sh build.sh test.sh scripts/verify.sh
```

Expected: 所有可在既有 Sandbox 執行的檢查通過。

- [ ] **Step 2: 嘗試完整 npm 驗證**

Run: `npm install && ./scripts/verify.sh`
Expected: 在可連線 npm registry 的環境全部通過；若 Sandbox registry 不提供套件，記錄為環境限制，不得宣稱完整 build 已通過。

- [ ] **Step 3: 檢查禁止項目**

Run:

```bash
grep -RInE 'TODO|TBD|FIXME' --exclude-dir=.git --exclude='*.md' . && exit 1 || true
git status --short
```

Expected: 程式碼無 placeholder；只保留預期提交內容。

- [ ] **Step 4: Commit 驗證修正**

```bash
git add -A
git commit -m "test: verify phase 0 and phase 1 foundation"
```

- [ ] **Step 5: 提交功能分支並快轉 main**

確認遠端差異後，將 `feat/phase-0-1-foundation` 快轉合併至 `main`；Codex 的完整套件安裝、瀏覽器 PWA、Lighthouse 與裝置 E2E 驗證另建 test-only 任務。
