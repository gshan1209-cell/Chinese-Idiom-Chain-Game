# 第一章關卡成語全域不重複 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 維持第一章 20 關與 61 個 placement，並讓所有 `idiomId` 與成語文字在整章內完全不重複。

**Architecture:** 以 `data/idioms.source.csv` 作為唯一人工資料來源，擴充至 70 筆已啟用成語；`src/puzzle/levels.ts` 只引用其中 61 筆並維持既有盤面配置。永久 Gate 放在 `tests/puzzle-levels.test.mjs`，同時驗證 placement 數量、ID／文字唯一性、生成字典成員資格、盤面可建立與可完成性。

**Tech Stack:** TypeScript 6、Node.js 22 `node:test`、CSV／JSON 資料建置、React 19／Vite 8 PWA（本功能不修改 React）。

## Global Constraints

- 第一章固定 20 關、61 個 placement。
- 61 個 `idiomId` 必須全域唯一。
- 61 個成語文字必須全域唯一。
- 題庫擴充至至少 70 筆已啟用、四字繁體中文成語。
- 關卡 ID、編號、難度梯度、星級、解鎖與 IndexedDB schema 不變。
- 不修改 React、CSS、智慧跳格、自由接龍、打地鼠、PWA 設定或套件依賴。
- 新增成語必須有 meaning、example、source、difficulty、tags、enabled 與 version。
- 最終必須執行 `./scripts/verify.sh` 與 GitHub Actions CI。

---

## File Map

- Modify: `data/idioms.source.csv` — 新增 `idiom-0038`～`idiom-0070`。
- Modify: `src/puzzle/levels.ts` — 擴充 `IDIOMS` 並將 20 關改成 61 筆唯一配置。
- Modify: `tests/puzzle-levels.test.mjs` — 新增整章唯一性與生成字典一致性 Gate。
- Regenerate: `public/generated/idioms.v1.json`、`public/generated/idioms.manifest.json`。
- Modify: `README.md` — 說明第一章成語不重複與 70 筆題庫。

### Approved 20-Level Chain Allocation

```ts
const LEVEL_CHAINS = [
  [1, 2],
  [3, 4],
  [5, 6],
  [7, 8],
  [9, 10],
  [11, 12, 13],
  [14, 15, 16],
  [17, 18, 19],
  [20, 21, 22],
  [23, 24, 25],
  [26, 27, 28],
  [33, 34, 35],
  [36, 37, 38, 39],
  [29, 30, 31, 32],
  [40, 41, 42],
  [43, 44, 45, 46],
  [47, 48, 49],
  [50, 51, 52, 53],
  [54, 55, 56, 57],
  [58, 59, 60, 61]
] as const;
```

### New Dictionary Entries

| No. | ID | 成語 | 難度 | 標籤 |
|---:|---|---|---|---|
| 38 | idiom-0038 | 意氣用事 | normal | 心理\|行動 |
| 39 | idiom-0039 | 事必躬親 | normal | 行動\|責任 |
| 40 | idiom-0040 | 親力親為 | easy | 行動\|責任 |
| 41 | idiom-0041 | 為人師表 | normal | 品德\|教育 |
| 42 | idiom-0042 | 表裡如一 | easy | 品德 |
| 43 | idiom-0043 | 一鳴驚人 | easy | 成就\|人物 |
| 44 | idiom-0044 | 人傑地靈 | normal | 人物\|地方 |
| 45 | idiom-0045 | 靈丹妙藥 | easy | 健康\|比喻 |
| 46 | idiom-0046 | 藥到病除 | easy | 健康 |
| 47 | idiom-0047 | 除舊布新 | normal | 變化\|行動 |
| 48 | idiom-0048 | 新婚燕爾 | normal | 家庭\|人物 |
| 49 | idiom-0049 | 爾虞我詐 | hard | 人際\|心理 |
| 50 | idiom-0050 | 山高水長 | normal | 自然\|品德 |
| 51 | idiom-0051 | 長驅直入 | normal | 行動\|軍事 |
| 52 | idiom-0052 | 入木三分 | normal | 技藝\|比喻 |
| 53 | idiom-0053 | 分秒必爭 | easy | 時間\|行動 |
| 54 | idiom-0054 | 爭先恐後 | easy | 行動\|群體 |
| 55 | idiom-0055 | 後生可畏 | normal | 人物\|成長 |
| 56 | idiom-0056 | 畏首畏尾 | normal | 心理\|行動 |
| 57 | idiom-0057 | 尾大不掉 | hard | 組織\|比喻 |
| 58 | idiom-0058 | 掉以輕心 | normal | 態度\|警示 |
| 59 | idiom-0059 | 心曠神怡 | easy | 情緒\|自然 |
| 60 | idiom-0060 | 怡然自得 | easy | 情緒\|人物 |
| 61 | idiom-0061 | 得心應手 | easy | 技藝\|能力 |
| 62 | idiom-0062 | 手到擒來 | easy | 能力\|行動 |
| 63 | idiom-0063 | 來日方長 | easy | 時間\|期望 |
| 64 | idiom-0064 | 長話短說 | easy | 溝通 |
| 65 | idiom-0065 | 說一不二 | normal | 態度\|人物 |
| 66 | idiom-0066 | 二話不說 | easy | 行動\|溝通 |
| 67 | idiom-0067 | 說長道短 | normal | 溝通\|人際 |
| 68 | idiom-0068 | 短兵相接 | hard | 行動\|軍事 |
| 69 | idiom-0069 | 接二連三 | easy | 數量\|事件 |
| 70 | idiom-0070 | 三思而行 | easy | 態度\|行動 |

---

### Task 1: 建立第一章唯一性 RED Gate

**Files:**
- Modify: `tests/puzzle-levels.test.mjs`

**Interfaces:**
- Consumes: `PUZZLE_LEVELS: readonly PuzzleLevel[]`
- Produces: 61-placement、`idiomId` 唯一與 `text` 唯一的永久測試

- [ ] **Step 1: 新增失敗測試**

```js
test('uses sixty-one unique idioms across chapter one', () => {
  const placements = PUZZLE_LEVELS.flatMap((level) => level.placements);
  const ids = placements.map((placement) => placement.idiomId);
  const texts = placements.map((placement) => placement.text);

  assert.equal(placements.length, 61);
  assert.equal(new Set(ids).size, 61, 'chapter one repeats an idiomId');
  assert.equal(new Set(texts).size, 61, 'chapter one repeats an idiom text');
});
```

- [ ] **Step 2: 執行 RED**

Run: `npm run test:puzzle`

Expected: FAIL，現有 `Set` 大小只有 37。

- [ ] **Step 3: Commit RED 測試**

```bash
git add tests/puzzle-levels.test.mjs
git commit -m "test: require unique idioms across chapter one"
```

---

### Task 2: 擴充人工成語來源至 70 筆

**Files:**
- Modify: `data/idioms.source.csv`
- Regenerate: `public/generated/idioms.v1.json`
- Regenerate: `public/generated/idioms.manifest.json`

**Interfaces:**
- Consumes: CSV schema `id,text,bopomofo,pinyin,meaning,example,source,difficulty,tags,enabled,version`
- Produces: `idiom-0038`～`idiom-0070`，全部 `enabled=true`、`version=1`

- [ ] **Step 1: 依上表新增 33 筆 CSV 資料**

每筆 meaning 與 example 必須是完整繁體中文句子。`source` 固定使用：

```csv
"示範資料，正式發布前需完成授權與校訂"
```

- [ ] **Step 2: 建置並驗證資料**

Run: `npm run build:data`

Expected: `成語資料建置完成：v1，共 70 筆`。

- [ ] **Step 3: 執行資料測試**

Run: `npm run test:data`

Expected: PASS，無重複 ID、無重複文字、所有文字皆為四個漢字。

- [ ] **Step 4: Commit 題庫擴充**

```bash
git add data/idioms.source.csv public/generated/idioms.v1.json public/generated/idioms.manifest.json
git commit -m "data: expand idiom dictionary to seventy entries"
```

---

### Task 3: 將第一章改為 61 筆唯一成語

**Files:**
- Modify: `src/puzzle/levels.ts`
- Test: `tests/puzzle-levels.test.mjs`

**Interfaces:**
- Consumes: `IDIOMS` 1～70、上方 Approved 20-Level Chain Allocation
- Produces: 20 關、61 placement、無重複成語的 `PUZZLE_LEVELS`

- [ ] **Step 1: 在 `IDIOMS` 新增 38～70**

格式：

```ts
38: { id: 'idiom-0038', text: '意氣用事' },
// ...
70: { id: 'idiom-0070', text: '三思而行' }
```

- [ ] **Step 2: 完整替換 `LEVEL_CHAINS`**

使用本計畫「Approved 20-Level Chain Allocation」的精確陣列，不得重複或自行縮減。

- [ ] **Step 3: 執行 Puzzle 測試**

Run: `npm run test:puzzle`

Expected: PASS；唯一性測試、交叉鏈、盤面建立與自動解題全部通過。

- [ ] **Step 4: Commit 關卡重排**

```bash
git add src/puzzle/levels.ts tests/puzzle-levels.test.mjs
git commit -m "feat: assign unique idioms to every chapter one level"
```

---

### Task 4: 驗證關卡成語全部存在於生成字典

**Files:**
- Modify: `tests/puzzle-levels.test.mjs`

**Interfaces:**
- Consumes: `public/generated/idioms.v1.json`、`PUZZLE_LEVELS`
- Produces: 關卡與正式字典一致性的永久 Gate

- [ ] **Step 1: 加入 JSON 讀取工具**

```js
import { readFileSync } from 'node:fs';

const dictionary = JSON.parse(
  readFileSync(new URL('../public/generated/idioms.v1.json', import.meta.url), 'utf8')
);
```

- [ ] **Step 2: 加入成員資格測試**

```js
test('every chapter one idiom exists as an enabled dictionary entry', () => {
  const enabledById = new Map(
    dictionary.idioms
      .filter((idiom) => idiom.enabled)
      .map((idiom) => [idiom.id, idiom.text])
  );

  for (const placement of PUZZLE_LEVELS.flatMap((level) => level.placements)) {
    assert.equal(enabledById.get(placement.idiomId), placement.text, placement.idiomId);
  }
});
```

- [ ] **Step 3: 執行資料與 Puzzle 測試**

Run: `npm run build:data && npm run test:data && npm run test:puzzle`

Expected: PASS。

- [ ] **Step 4: Commit 字典一致性 Gate**

```bash
git add tests/puzzle-levels.test.mjs
git commit -m "test: validate chapter idioms against generated dictionary"
```

---

### Task 5: 文件與完整 Repository Gate

**Files:**
- Modify: `README.md`
- Create: `docs/superpowers/reports/2026-08-06-chapter-one-unique-idioms-delivery.md`

**Interfaces:**
- Consumes: 最終關卡與 CI 結果
- Produces: 可審核的交付紀錄

- [ ] **Step 1: 更新 README**

將開發示範資料數量由 37 更新為 70，並補充：

```markdown
- 第一章 20 關共使用 61 個不同成語；同一成語不會跨關重複。
```

- [ ] **Step 2: 執行完整驗證**

Run:

```bash
./scripts/verify.sh
```

Expected:

- build:data：70 筆
- 全部 Node tests：PASS
- TypeScript strict：PASS
- ESLint：PASS
- Vite production build：PASS
- PWA Service Worker：PASS

- [ ] **Step 3: 漂移檢查**

Run:

```bash
git fetch origin
git rev-list --left-right --count origin/main...HEAD
git diff --name-only origin/main...HEAD
```

Expected: behind `0`；差異只包含本計畫允許的資料、關卡、測試、README 與文件。

- [ ] **Step 4: 建立交付報告並提交**

交付報告必須記錄：

- 題庫總筆數。
- 第一章 placement 數。
- 唯一 `idiomId` 數。
- 唯一文字數。
- 測試、typecheck、lint、build 與 CI 結果。

```bash
git add README.md docs/superpowers/reports/2026-08-06-chapter-one-unique-idioms-delivery.md
git commit -m "docs: record unique chapter idiom delivery"
```

---

## Final Review Checklist

- [ ] `data/idioms.source.csv` 恰好至少 70 筆且無重複。
- [ ] 第一章恰好 20 關。
- [ ] 第一章恰好 61 個 placement。
- [ ] 61 個 `idiomId` 全部唯一。
- [ ] 61 個成語文字全部唯一。
- [ ] 每個 placement 都存在於生成字典。
- [ ] 每關交叉鏈正確且可完成。
- [ ] 進度 schema、星級、解鎖與關卡 ID 未變更。
- [ ] 無 React、CSS、自由接龍、打地鼠、PWA 或依賴變更。
- [ ] `./scripts/verify.sh` 與 GitHub Actions CI 全綠。
