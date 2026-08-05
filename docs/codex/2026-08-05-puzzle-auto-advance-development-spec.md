# Codex 開發規格書：成語填字輸入格智慧自動跳轉

## 0. 任務資訊

- Repository：`gshan1209-cell/Chinese-Idiom-Chain-Game`
- Base branch：`main`
- 工作分支：`feat/puzzle-auto-advance`
- 既有 PR：`#5`
- PR URL：`https://github.com/gshan1209-cell/Chinese-Idiom-Chain-Game/pull/5`
- 任務類型：既有功能增強＋回歸測試
- 開發方式：TDD，直接提交至既有工作分支
- 禁止事項：不得另開分支、不得另開 PR、不得修改無關功能

## 1. Codex 執行目標

在「第一章縱橫成語填字」主玩法中，玩家每次從候選字池放入任一文字後，系統都要自動選取下一個可輸入格。

無論本次放入的文字正確或錯誤，都必須自動跳格；錯字保留在原格並維持既有紅色顯示。系統先引導玩家走完所有尚未填字的空格，全部空格填滿後，才依固定順序回到錯誤格修正。

## 2. 開發前必讀文件

Codex 開始修改前，必須完整閱讀：

1. `docs/superpowers/specs/2026-08-05-puzzle-auto-advance-design.md`
2. `docs/superpowers/plans/2026-08-05-puzzle-auto-advance.md`
3. `src/domain/puzzle.ts`
4. `src/puzzle/puzzle-board.ts`
5. `src/puzzle/puzzle-engine.ts`
6. `tests/puzzle-engine.test.mjs`
7. `scripts/verify.sh`

若本文件與 implementation plan 有文字差異，以本文件的「強制行為」與設計規格為準；不得自行擴充需求。

## 3. 分支與 Git 操作

```bash
git fetch origin
git checkout feat/puzzle-auto-advance
git pull --ff-only origin feat/puzzle-auto-advance
```

若本機沒有相依套件：

```bash
npm install
```

執行基線測試：

```bash
npm run test:puzzle
```

基線若失敗，先判斷是否為既有問題；不得在未記錄原因的情況下繼續開發。

## 4. 強制行為規格

### 4.1 任意文字都自動跳格

`placePuzzleTile` 成功寫入有效且未被其他格使用的字牌後：

- 填對：保留既有正確狀態與加分，並跳到下一格。
- 填錯：保留錯字、既有扣分與 `mistakes + 1`，仍跳到下一格。
- 無效操作不跳格：沒有選取格、關卡已完成、格子不存在、固定格、字牌不存在、字牌已被使用。

### 4.2 跳轉優先順序

跳轉必須依下列五階段執行，順序不可交換：

1. **目前偏好 placement 正向的下一個空格**
   - 橫向向右。
   - 直向向下。
   - 略過固定格與所有已有文字的格子。

2. **目前格的相交 placement**
   - 偏好 placement 已無空格時，切換至目前交叉格的另一個 placement。
   - 優先搜尋交叉格之後的空格。
   - 正向沒有空格時，搜尋該 placement 內排序第一個其他空格。

3. **直接相連 placement**
   - 搜尋與目前／偏好 placement 透過交叉格直接相連的 placement。
   - 候選以目前格的曼哈頓距離排序。

4. **全盤最近空格**
   - 在所有尚未填字且非固定的格子中選取最近格。
   - 距離公式：`abs(rowA-rowB) + abs(columnA-columnB)`。
   - 距離相同時：`row` 小者優先，再以 `column` 小者優先。

5. **錯誤格巡回**
   - 只有盤面已無任何空格時才執行。
   - 選取目前文字不等於答案的第一個錯誤格。
   - 排序固定為 `row`、`column` 升冪。

### 4.3 關卡完成

全部可填格都正確時：

```ts
status === 'completed'
selectedCellKey === null
preferredPlacementId === null
```

不得再執行自動跳轉；沿用既有過關、星級與進度保存流程。

### 4.4 手動選格的方向判定

玩家手動選取格子時，重新推導 `preferredPlacementId`：

- 格子只屬於一個 placement：選該 placement。
- 格子屬於兩個 placement：選尚未完成格較多者。
- 未完成數量相同：橫向優先。
- 仍相同：placement id 字典序優先，確保結果決定性。

### 4.5 其他 Session 操作

- 覆蓋錯字：先釋放原字牌，再寫入新字牌，然後繼續自動跳格。
- `removePuzzleCell`：選取被移除格並重新推導方向。
- `usePuzzleHint`：提示格維持選取並重新推導方向；若提示後完成關卡則 `null/null`。提示操作本身不套用一般自動跳格流程。
- `clearPuzzleEntries`：回到第一個可填格，重新推導方向。

## 5. 領域模型與介面

### 5.1 `PuzzleSession`

在 `src/domain/puzzle.ts` 增加：

```ts
readonly preferredPlacementId: string | null;
```

所有建立或重建 `PuzzleSession` 的程式路徑都必須提供此欄位，不得使用型別斷言逃避。

### 5.2 導航結果與純函式

在 `src/puzzle/puzzle-engine.ts` 提供：

```ts
export interface PuzzleNavigationResult {
  readonly cellKey: string | null;
  readonly preferredPlacementId: string | null;
}

export function findNextPuzzleCell(
  session: PuzzleSession,
  currentCellKey: string,
  preferredPlacementId: string | null
): PuzzleNavigationResult;
```

要求：

- 純函式，不修改傳入 Session。
- 不依賴 React、DOM、瀏覽器尺寸或亂數。
- 相同輸入必須得到相同結果。
- 可新增小型私有 helper，但不得把 UI 行為寫入引擎。

## 6. 允許修改的檔案

主要修改範圍：

- `src/domain/puzzle.ts`
- `src/puzzle/puzzle-engine.ts`
- `tests/puzzle-engine.test.mjs`
- `README.md`

原則上不得修改：

- React 元件與 CSS
- `src/progress/**`
- 關卡資料
- IndexedDB schema
- 星級規則
- 自由接龍與打地鼠模組
- PWA 設定
- `package.json` 依賴

若確實必須修改上述禁止範圍，停止實作並在交付報告說明阻礙，不得自行擴張。

## 7. TDD 開發順序

生產程式碼前必須先加入會正確失敗的測試，確認 RED 後才寫最小實作。

### Task 1：Session 方向偏好

新增測試：

- 新 Session 選第一個可填格。
- `preferredPlacementId` 正確初始化。
- 手動選交叉格時，以未完成數量決定方向。
- 數量相同時橫向優先。

### Task 2：同 placement 自動前進

新增測試：

- 填對後跳到同成語下一空格。
- 填錯後保留錯字但仍跳格。
- 略過固定格。
- 略過已有文字格。
- 無效字牌不跳格。

### Task 3：交叉與直接相連 placement

新增測試：

- 原方向走完後切換交叉 placement。
- 交叉 placement 正向無空格時，回找該 placement 其他空格。
- 目前格不是交叉點時，可移動至直接相連 placement。

### Task 4：全盤最近格與錯誤格

新增測試：

- 無相連空格時選曼哈頓距離最近格。
- 距離相同時驗證 row tie-break。
- row 相同時驗證 column tie-break。
- 仍有空格時不得跳回錯字。
- 全部格已有文字後跳到第一個錯誤格。
- 全部正確後兩個選取欄位皆為 `null`。

### Task 5：覆蓋與其他操作

新增測試：

- 覆蓋錯字會釋放舊字牌並繼續跳格。
- 移除格後重新選取該格與方向。
- 提示後選取狀態一致，但不自動跳到下一格。
- 清空後回到第一個可填格與初始方向。

## 8. 測試要求

至少覆蓋以下行為：

1. 填對後沿橫向前進。
2. 填錯後仍前進。
3. 固定格略過。
4. 已填格略過。
5. 交叉方向切換。
6. 交叉 placement fallback。
7. 直接相連 placement 搜尋。
8. 全盤最近格。
9. row tie-break。
10. column tie-break。
11. 空格優先於錯字。
12. 錯誤格固定排序。
13. 完成狀態取消選取。
14. 手動交叉方向推導。
15. 覆蓋錯字釋放字牌。
16. 移除、提示、清空狀態一致。

測試必須驗證公開行為，不得只測私有 helper，也不得用複製生產邏輯的方式計算預期值。

## 9. 驗證命令

每個 Task 完成後先執行：

```bash
npm run test:puzzle
```

最終完整 Gate：

```bash
./scripts/verify.sh
```

`verify.sh` 會依序執行：

```bash
npm run build:data
npm run test
npm run typecheck
npm run lint
npm run build
```

所有命令必須 exit code `0`。不得只以單一測試通過宣稱完成。

## 10. 分支漂移處理

提交前執行：

```bash
git fetch origin
git rev-list --left-right --count origin/main...HEAD
```

若分支落後 `main`：

1. 整合最新 `main` 到 `feat/puzzle-auto-advance`。
2. 解決衝突時保留兩側既有功能。
3. 重新執行 `./scripts/verify.sh`。
4. 不得強制推送覆蓋他人提交。

## 11. Commit 建議

建議依可審查單位提交：

```text
feat: track preferred puzzle placement
feat: auto advance puzzle input cells
feat: navigate puzzle crossings and fallbacks
test: cover puzzle navigation state transitions
docs: explain puzzle auto advance
```

不得將格式化整個 Repository、無關重構或依賴更新混入本 PR。

## 12. PR 更新要求

直接更新既有 PR #5，不得新建 PR。

完成後將 PR 標題更新為：

```text
feat: 成語填字輸入格智慧自動跳轉
```

PR 說明必須列出：

- 實作行為摘要。
- 實際修改檔案。
- 新增測試數與完整測試總數。
- `test`、`typecheck`、`lint`、`build` 結果。
- 分支 ahead／behind。
- 尚未完成的實機驗收項目（若有）。

## 13. Codex 最終交付格式

Codex 完成後，在 PR 留下或回傳以下報告：

```markdown
## Codex 開發結果

- 狀態：DONE / DONE_WITH_CONCERNS / BLOCKED
- 工作分支：feat/puzzle-auto-advance
- 最終 HEAD：<sha>
- Commits：
  - <sha> <message>
- 修改檔案：
  - <path>
- 新增測試：<數量>
- 完整測試：<通過數>/<總數>
- Typecheck：PASS/FAIL
- Lint：PASS/FAIL
- Production build：PASS/FAIL
- 分支狀態：ahead <n> / behind <n>
- 風險或未完成事項：無／<內容>
```

若發現規格矛盾或結構性阻礙，使用 `BLOCKED`，清楚列出檔案、行為與原因；不得自行改寫產品規則。

## 14. 完成定義

只有同時符合以下條件，才可回報 DONE：

- 所有強制行為完成。
- 所有新增測試通過。
- 既有 puzzle、progress、打地鼠、PWA 與資料測試均未退化。
- `./scripts/verify.sh` 完整成功。
- 分支未落後 `main`。
- PR #5 已更新驗證摘要。
- 未新增無關功能、依賴或跨模組修改。

Codex 完成後不要自行關閉或合併 PR；交由 ChatGPT 進行最終 Audit 與合併決策。
