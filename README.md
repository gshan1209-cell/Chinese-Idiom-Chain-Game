# Chinese-Idiom-Chain-Game

**中文成語填填字（CICG）**是一款大字體、離線優先、可安裝至手機主畫面的繁體中文成語填字闖關 PWA。

目前 Repository 已完成 **Phase 0–4：PWA 基礎、成語資料層、手機安裝、自由接龍附加模式，以及 20 關縱橫成語填字主玩法**。

## 目前完成範圍

- React + TypeScript + Vite 專案骨架。
- PWA Manifest、Service Worker 與字典快取設定。
- 適合手機、兒童與中高齡使用者的大字體首頁。
- 成語 CSV 來源格式與 JSON Schema。
- CSV 驗證、重複偵測、首尾字索引及 SHA-256 校驗碼。
- 37 筆可形成接龍關係的繁體中文示範資料。
- 20 關縱橫成語填字關卡，從 2 個成語逐步增加到 4 個成語。
- 純 TypeScript 填字盤面引擎：交叉字驗證、固定提示格、候選字池。
- 填字 session 引擎：選格、填字、移除、重排、提示、計分與過關判定。
- 手機大字體闖關介面；原自由接龍保留為「其他玩法」。
- 純 TypeScript 成語索引查詢服務。
- 經典模式遊戲引擎：接龍判定、重複偵測、計分、連擊、提示與自然結束。
- 大字體可玩介面：輸入、回饋、分數板、最近紀錄與重新開始。
- 離線字典載入與資料格式防護。
- Android／Chromium PWA 安裝按鈕與安裝結果回饋。
- iPhone／iPad「分享 → 加入主畫面」三步驟教學。
- 離線就緒標示與 Service Worker 新版本套用提示。
- Node 內建測試、GitHub Actions 與一鍵執行腳本。

## 尚未實作

- 關卡地圖、章節解鎖與 IndexedDB 闖關進度保存。
- 60 秒限時模式與選擇題模式。
- 生命值、難度篩選與完整結算頁。
- 設定頁、成語小冊與發音輔助。
- Lighthouse、瀏覽器 E2E、Android 安裝及 iOS 加入主畫面實機驗證。

## 執行環境

- Node.js `>=22.13.0`
- npm `>=10`

## 快速啟動

```bash
./start.sh
```

預設服務位置：

```text
http://localhost:5173
```

可自訂 Host 與 Port：

```bash
HOST=127.0.0.1 PORT=4173 ./start.sh
```

## 常用指令

```bash
./start.sh             # 安裝依賴、建置字典並啟動開發伺服器
./test.sh              # 建置字典並執行全部核心測試
./build.sh             # 建立正式 PWA 產物
./scripts/verify.sh    # test、typecheck、lint、build 全面驗證
```

也可直接使用 npm：

```bash
npm install
npm run dev
npm run test
npm run build
```

## 安裝到手機

- Android／Chromium：當瀏覽器確認符合 PWA 安裝條件後，首頁會顯示「安裝到手機」。
- iPhone／iPad：首頁會顯示「查看安裝步驟」，依序使用 Safari「分享 → 加入主畫面 → 新增」。
- 已安裝或以 standalone 模式啟動時，不再重複顯示安裝按鈕。
- Service Worker 完成快取後會顯示「離線可用」。

## 成語填字闖關規則

- 上方顯示由 2～4 個成語交叉組成的方格。
- 先點選空格，再點擊下方候選中文字完成填入；不需叫出手機鍵盤。
- 綠色格代表正確，紅色格代表錯誤，可移除後重新選字。
- 「提示」會自動填入一格正確答案；「重排」只改變候選字順序。
- 所有可填格正確後過關，並顯示本關成語與解釋。
- 第一章目前提供 20 關，前 5 關為 2 個成語，後續增加至 3～4 個成語。

## 自由接龍附加模式規則

- 下一個成語第一字必須等於目前成語最後一字。
- 僅接受本機字典內啟用的四字成語。
- 同一局不能重複使用相同成語。
- 正確答案基礎分為 100 分；連擊每次增加 20 分，上限加成 200 分。
- 使用提示扣 50 分，分數最低維持 0 分。
- 當目前成語已無未使用的接續候選，本局自然完成。

## 成語資料維護

人工維護來源：

```text
data/idioms.source.csv
```

欄位順序固定為：

```text
id,text,bopomofo,pinyin,meaning,example,source,difficulty,tags,enabled,version
```

更新資料後執行：

```bash
npm run build:data
```

系統會驗證：

- 成語必須是四個中文字。
- `id` 與成語文字不得重複。
- 解釋不得留空。
- 難度只能是 `easy`、`normal`、`hard`。
- `enabled` 必須為布林值。
- `version` 必須為正整數。

產物位置：

```text
public/generated/idioms.v1.json
public/generated/idiom-index.v1.json
public/generated/manifest.json
```

`manifest.json` 會記錄字典版本、資料筆數及 SHA-256 校驗碼。

> [!WARNING]
> 現有 37 筆內容是**開發用示範資料**。正式作為教育產品發布前，必須完成來源授權、文字校訂、注音／拼音補充及例句審核；不得將目前資料直接宣稱為正式辭典內容。

## 架構邊界

```text
src/domain       領域型別與遊戲契約
src/idioms       純 TypeScript 字典索引與載入服務
src/game         自由接龍純 TypeScript 遊戲引擎
src/puzzle       成語填字關卡、盤面與 session 引擎
src/pwa          PWA 裝置判斷與安裝純函式
scripts          成語資料建置與驗證
public/generated 離線字典與首尾字索引
src/app          React PWA 使用者介面與瀏覽器事件 Hook
```

遊戲規則不直接寫在 React 元件內；`game-engine` 與 `puzzle-engine` 皆以 TDD 實作，再由 UI 透過公開介面呼叫。

## PWA 驗收方式

完成 `npm install` 後：

```bash
npm run build
npx vite preview --host 0.0.0.0
```

正式驗收需確認：

1. Chromium 顯示可安裝 PWA。
2. 安裝後以 `standalone` 視窗啟動。
3. 首次完整載入後，關閉網路仍可開啟首頁與字典資源。
4. 360px 寬度無水平捲軸。
5. 主要按鈕高度至少 56px，主要文字至少 24px。

## 文件

- [開發規格書 v1.0](docs/specs/chinese-idiom-chain-game-v1.0-spec.md)
- [Phase 0–1 Implementation Plan](docs/superpowers/plans/2026-08-05-phase-0-1-foundation.md)
- [Phase 2 Classic Gameplay Plan](docs/superpowers/plans/2026-08-05-phase-2-classic-gameplay.md)
- [Phase 3 PWA Installation Plan](docs/superpowers/plans/2026-08-05-phase-3-pwa-installation.md)
- [Phase 4 Idiom Crossword Plan](docs/superpowers/plans/2026-08-05-phase-4-idiom-crossword.md)
