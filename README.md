# Chinese-Idiom-Chain-Game

**中文成語填填字（CICG）**是一款大字體、離線優先、可安裝至手機主畫面的繁體中文成語填字闖關 PWA。

目前完成 PWA 基礎、離線成語資料、第一章 20 關填字闖關、關卡地圖、星級與 IndexedDB 本機進度保存；自由接龍保留為附加模式，並加入可自行啟動的 15 秒成語打地鼠獎勵關卡。

## 目前完成範圍

- React + TypeScript + Vite PWA。
- 成語 CSV、JSON Schema、資料驗證、首尾字索引與 SHA-256 校驗。
- 37 筆可形成接龍關係的繁體中文開發示範資料。
- 第一章 20 關縱橫成語填字，從 2 個成語逐步增加到 4 個成語。
- 純 TypeScript 填字盤面與 session 引擎。
- 關卡地圖、逐關解鎖、1～3 星評價、最高分與繼續上次關卡。
- IndexedDB 本機進度保存與序列化寫入佇列。
- 自由接龍：接龍判定、重複防護、計分、連擊、提示與自然結束。
- 自由接龍趣味獎勵：能量槽、自選獎勵、15 秒補最後一字打地鼠。
- 提示券、失誤護盾、雙倍分數，以及後續限時模式可使用的加時資源。
- 打地鼠 6／9 洞位、數字鍵 1～9、四級難度、單題輪替與背景暫停防護。
- Android／Chromium 安裝提示、iPhone／iPad 加入主畫面教學與離線更新提示。

## 尚未實作

- 第二章與更多關卡。
- 登入、雲端備份與跨裝置同步。
- 60 秒限時模式與選擇題模式。
- 成語小冊、發音輔助與完整設定頁。
- Lighthouse、瀏覽器 E2E、Android／iOS 實機與完整離線 PWA 驗收。

## 快速啟動

需求：Node.js `>=22.13.0`、npm `>=10`。

```bash
./start.sh
```

預設位置：`http://localhost:5173`

```bash
./test.sh              # 建置資料並執行全部核心測試
./build.sh             # 建立正式 PWA 產物
./scripts/verify.sh    # test、typecheck、lint、build
```

## 成語填字闖關

- 上方顯示由 2～4 個成語交叉組成的方格。
- 先點選空格，再點擊候選中文字。
- 綠色格代表正確，紅色格代表錯誤。
- 提示會填入一格正確答案；重排只改變候選字順序。
- 全部完成後顯示本關成語與解釋。

### 闖關與保存

- 第 1 關永遠解鎖；完成第 N 關後解鎖第 N+1 關。
- 三星：0 次提示、0 次錯誤。
- 二星：提示不超過 1 次，錯誤不超過 2 次。
- 一星：完成關卡但未達二星條件。
- 重玩只更新更佳星級、最高分、最少錯誤與最少提示。
- 進度保存在 IndexedDB：database `cicg-progress`、version `1`、store `campaigns`、key `chapter-1`。
- IndexedDB 不可用時仍可遊玩，但會顯示本次可能無法保存的警告。

## 自由接龍＋成語打地鼠

### 接龍規則

- 下一個成語第一字必須等於目前成語最後一字。
- 僅接受本機字典內已啟用的四字成語。
- 同一局不能重複使用相同成語。
- 基礎分 100；連擊每次增加 20，上限加成 200。
- 沒有提示券時使用提示扣 50 分。
- 護盾會在答錯時消耗一層並保留連擊。
- 雙倍分數依剩餘題數套用，不重複相加。

### 能量累積

| 條件 | 能量 |
|---|---:|
| 一般答對 | +15% |
| 連擊達 3 題 | 額外 +5% |
| 連擊達 5 題以上 | 再額外 +10% |
| 困難成語 | 額外 +5% |
| 使用提示後答對 | 僅取得基本 +15% |

- 能量最高 100%，滿格後由玩家自行啟動。
- 離開獎勵選擇畫面不扣能量。
- 可用安全題目少於 8 題時禁止啟動，能量保持不變。
- 完成一輪自由接龍後，下一輪最多保留 50% 能量。

### 獎勵與操作

經典自由接龍可選：

- **提示券**：下一次提示優先免費使用。
- **雙倍分數**：下一批正確答案取得 2 倍分數。
- **失誤護盾**：答錯時保留連擊。

打地鼠規則：

- 基礎時間 15 秒，題型固定為補最後一字。
- 每題提供 4 個安全且唯一的候選字。
- 手機顯示 6 洞；寬度至少 768px 時顯示 9 洞。
- 支援觸控、滑鼠與鍵盤數字鍵 `1`～`9`。
- 單題依難度每 1.5～2.5 秒自動輪替。
- 第一次切到背景會暫停；第二次切到背景視為放棄該輪。

| 難度 | 單題時間 | 打錯處罰 |
|---|---:|---|
| 輕鬆 | 2.5 秒 | 扣 20 分，保留連擊 |
| 標準 | 2.0 秒 | 扣 50 分，連擊歸零 |
| 挑戰 | 1.7 秒 | 扣 50 分並減少 1 秒 |
| 極限 | 1.5 秒 | 減少 1 秒，連擊歸零 |

## 成語資料

人工來源：`data/idioms.source.csv`

```bash
npm run build:data
```

> [!WARNING]
> 現有 37 筆內容是開發用示範資料。正式教育產品發布前，必須完成來源授權、文字校訂、注音／拼音補充及例句審核。

## 架構

```text
src/domain       領域型別與遊戲契約
src/idioms       字典索引與載入
src/puzzle       填字關卡、盤面與 session 引擎
src/progress     星級、解鎖、IndexedDB 與寫入佇列
src/game         自由接龍引擎
src/game/bonus   能量、出題、打地鼠回合與獎勵引擎
src/app          React UI 與瀏覽器事件 Hook
src/pwa          PWA 安裝與裝置判斷
```

規則維持純 TypeScript；React 只呈現狀態並傳送玩家操作。

## 驗證

- 合併前最新主線的闖關／進度版本曾通過 66 項 Node 測試、TypeScript strict、ESLint 與 production build。
- 打地鼠功能分支的五組新增與整合核心測試共 20 項通過、0 失敗。
- 最終整合後仍須由 Pull Request CI 重新執行 `./scripts/verify.sh`，以整體結果作為合併依據。

## 文件

- [開發規格書](docs/specs/chinese-idiom-chain-game-v1.0-spec.md)
- [Phase 4 Idiom Crossword Plan](docs/superpowers/plans/2026-08-05-phase-4-idiom-crossword.md)
- [Phase 5 Campaign Progress Design](docs/superpowers/specs/2026-08-05-phase-5-campaign-progress-design.md)
- [Phase 5 Campaign Progress Plan](docs/superpowers/plans/2026-08-05-phase-5-campaign-progress.md)
- [成語打地鼠設計規格](docs/superpowers/specs/2026-08-05-whack-a-mole-bonus-design.md)
- [成語打地鼠實作計畫](docs/superpowers/plans/2026-08-05-whack-a-mole-bonus.md)
- [成語打地鼠交付報告](docs/superpowers/reports/2026-08-05-whack-a-mole-bonus-delivery.md)
