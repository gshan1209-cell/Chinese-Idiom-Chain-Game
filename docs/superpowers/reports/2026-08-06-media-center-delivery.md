# 成語電台與 YouTube 影音中心交付報告

## 1. 交付摘要

本次在不改變成語填字主玩法、關卡資料、星級、自由接龍計分、打地鼠計分或既有進度 schema 的前提下，完成「成語電台與 YouTube 影音中心 v1.0」。

完成項目：

- HTTPS 網路收音機。
- 跨 `home`、`campaign`、`classic` 模式持續播放的常駐 MediaProvider。
- 手機底部／桌面右下角迷你播放器。
- 播放、暫停、上一個、下一個、音量、靜音與收合。
- YouTube 官方可見 iframe，支援影片與播放清單。
- 收音機與 YouTube 互斥播放。
- 打地鼠期間自動將收音機有效音量降至最新基準音量的 30%。
- 暫停後保留選取項目，可直接恢復播放。
- App 重開後恢復上次選取項目與偏好，但不自動發聲。
- 玩家自訂媒體的新增、刪除、收藏與排序。
- HTTPS、官方 YouTube 網域、影片 ID、播放清單 ID 與危險輸入驗證。
- 收音機新增前最多 10 秒試播 Gate。
- JSON schema v1 匯出／匯入、去重與逐筆結果摘要。
- 獨立 `cicg-media` IndexedDB 與記憶體 fallback。
- 離線或媒體錯誤不阻擋遊戲。
- YouTube iframe 暫停後立即卸載。
- Dock 出現時才替頁面保留底部安全空間。

## 2. 資料與架構

### 2.1 IndexedDB

```text
Database：cicg-media
Version：1
Stores：library、preferences
```

此資料庫與既有進度資料庫完全分離：

```text
Database：cicg-progress
Version：1
Store：campaigns
Key：chapter-1
```

本次未修改 `cicg-progress` schema 或任何進度序列化規則。

### 2.2 模組責任

```text
src/media
  media-types.ts
  media-url-parser.ts
  media-library.ts
  media-import-export.ts
  media-playback-policy.ts
  media-repository.ts
  indexeddb-media-repository.ts

src/app/media
  MediaContext.tsx
  MediaProvider.tsx
  MediaDock.tsx
  MediaLauncher.tsx
  MediaLibraryPanel.tsx
  AddMediaForm.tsx
  YouTubePlayer.tsx
  media.css
```

純 TypeScript 模組負責安全規則、資料、備份、播放政策與保存；React 只負責瀏覽器媒體元素和玩家操作。

打地鼠模組沒有直接操作 `HTMLAudioElement`、iframe 或音量，只由 `App.tsx` 將 `bonus.view === 'playing'` 傳入 MediaProvider。

## 3. 內容治理與 Drive 狀態

Drive 已有標準目錄：

- `02_UI_UX_And_Visuals`
- `03_Game_Content_And_Data`
- `04_Testing_And_Evidence`
- `80_Inbox`
- `90_Archive`

截至本次交付，Drive 尚無已核准的正式電台或 YouTube 來源證據。因此：

```text
data/media/default-library.json = []
```

播放器與玩家自訂功能已完成，但沒有把測試網址、推測授權內容或來源不明音樂放入正式內建清單。

正式啟用內建媒體前，仍需在 Drive 建立來源授權、官方首頁、嵌入允許與實機播放證據。

## 4. TDD 證據

所有 production 行為均先提交失敗測試，再進行最小實作。

| 階段 | RED 證據 | GREEN 證據 |
|---|---|---|
| URL 與 YouTube 解析 | CI #92：`media-url-parser` 不存在 | CI #95 通過 |
| 媒體清單 | CI #96：`media-library` 不存在 | CI #99 通過 |
| JSON 匯入／匯出 | CI #100：模組不存在 | CI #104 通過 |
| 播放互斥與 ducking | CI #106：播放政策不存在 | CI #107 通過 |
| Repository | CI #108：Repository 不存在 | CI #115 通過 |
| React UI 架構 | CI #119：Provider／iframe／CSS 契約失敗 | CI #131 通過 |
| 暫停後可恢復 | CI #133：`activeItemId` 被清空 | 修正後完整 Gate 通過 |
| YouTube 暫停卸載 | CI #134：缺少 `youtubePlaying` Gate | CI #135 通過 |
| 恢復上次選取 | CI #137：reducer 與 hydration 兩項失敗 | CI #139 通過 |
| Dock 安全空間 | CI #140：缺少內容底部留白 | CI #141 通過 |

## 5. 驗證基線與最終 Gate

GitHub Actions CI Run #141 成功執行：

```bash
npm install
./scripts/verify.sh
```

結果：

- 成語資料建置：70 筆，checksum `1601ec3c7424...`
- 完整 Node 測試：144 項通過、0 失敗
- Media 測試：39 項通過、0 失敗
- Puzzle 測試：37 項通過、0 失敗
- TypeScript strict：通過
- ESLint：通過
- Vite production build：通過
- PWA Service Worker：成功產生
- PWA precache：12 entries，355.44 KiB
- npm audit：419 packages，0 vulnerabilities

README、規格狀態與本報告更新後，PR 最新 HEAD 必須再執行相同的同樹 CI。PR 僅在該 CI 成功且 `behind_by = 0` 時合併；最終 Run 編號與 merge SHA 以 PR 紀錄為準。

非阻擋警告：GitHub Actions runner 將 `actions/checkout@v4` 與 `actions/setup-node@v4` 從內部 Node 20 強制執行於 Node 24；專案驗證本身使用 Node 22.16.0 並成功。

## 6. 範圍審核

本次未修改：

- `src/progress/**`
- `src/puzzle/**`
- `src/game/**`
- `src/app/use-whack-a-mole.ts`
- 關卡資料與 61 個唯一成語 Gate
- 星級、解鎖、提示、分數與獎勵規則
- PWA 設定
- runtime dependencies

新增依賴：無。

後端、登入、API Key、YouTube Data API、雲端同步與付費服務：無。

## 7. 已知限制與後續證據

目前完成的是程式、資料安全規則、靜態 UI 契約與 production build 驗證。因 Drive 尚無核准媒體來源，且本次環境沒有實體手機瀏覽器，以下發布證據仍待後續補齊：

- Android／iOS 真機上不同電台格式的播放相容性。
- 真實 YouTube 影片／播放清單的嵌入允許狀態。
- iOS PWA、鎖定畫面與切換 App 後的實際播放行為。
- 不同瀏覽器的 `:has()` 與安全區版面實測。
- 核准內建媒體來源及其授權／使用條款證據。

這些限制不影響離線成語遊戲；媒體失敗時會顯示非阻擋訊息。
