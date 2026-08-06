# 成語電台與 YouTube 影音中心設計規格

## 0. 文件資訊

- Repository：`gshan1209-cell/Chinese-Idiom-Chain-Game`
- Branch：`feat/media-center`
- 日期：2026-08-06
- 狀態：書面規格已核准，v1.0 已依 TDD 實作並完成 Repository Gate
- 功能名稱：成語電台與 YouTube 影音中心 v1.0

## 1. 背景

本專案目前以手機優先、離線優先、可安裝 PWA 的繁體中文成語填字闖關為主玩法，並保留自由接龍與成語打地鼠作為附加玩法。

本功能新增兩種網路媒體能力：

1. 遊戲過程可持續播放的網路收音機。
2. 使用 YouTube 官方嵌入式播放器觀看影片或播放清單的獨立影音區。

媒體功能不得取代主玩法，也不得影響關卡解鎖、星級、分數、提示、進度保存或打地鼠獎勵規則。

## 2. 核心決策

本功能固定採用以下設計：

- 同時支援收音機與 YouTube。
- 內建核准內容與玩家自訂內容並存。
- 玩家資料只保存在本機。
- 支援 JSON 匯出與匯入。
- 一般闖關與自由接龍期間，收音機持續播放。
- 打地鼠開始時，收音機自動降至基準音量的 30%。
- 打地鼠結束時，恢復目前基準音量。
- YouTube 只在可見的正式播放器內播放，不作為隱藏式純音訊播放器。
- 播放 YouTube 時暫停收音機；播放收音機時暫停 YouTube。
- 首次進入 App 不自動發聲，必須由玩家主動操作後開始播放。
- 第一版不新增後端、登入、YouTube Data API、付費服務或雲端同步。

## 3. 目標

### 3.1 玩家目標

玩家可以：

- 在首頁開啟成語電台。
- 從內建清單選擇已核准的網路電台。
- 在闖關與自由接龍之間切換時持續收聽電台。
- 在獨立影音區觀看 YouTube 影片或播放清單。
- 新增自己的 HTTPS 電台或 YouTube 連結。
- 收藏、排序與刪除自訂項目。
- 匯出自訂媒體清單與偏好。
- 在另一台裝置匯入備份。

### 3.2 產品目標

- 增加長時間遊玩的陪伴感。
- 不阻擋成語盤面、候選字、關卡地圖或打地鼠操作。
- 網路媒體失敗時，遊戲仍可離線正常使用。
- 將媒體規則集中在獨立模組，避免散落於 React 元件。

## 4. 非目標

v1.0 明確不實作：

- YouTube 搜尋。
- YouTube Data API 或 API Key。
- YouTube、Google 或其他帳號登入。
- 下載 YouTube 影片或音訊。
- 將 YouTube 轉換為 MP3。
- 隱藏 YouTube 播放器只播放聲音。
- 自建音訊串流或轉碼伺服器。
- Spotify、Apple Music 或其他付費音樂服務。
- 背景錄音。
- 跨裝置自動同步。
- 雲端媒體資料庫。
- 鎖定畫面或切換到其他 App 後仍持續播放的保證。
- HLS JavaScript polyfill；v1 僅依賴瀏覽器原生可播放能力。
- 媒體播放影響星級、分數、提示券、護盾或雙倍分數。

## 5. 使用者介面

## 5.1 首頁入口

首頁新增「成語電台／影音」入口，與「進入闖關地圖」及「其他玩法」分開。

入口開啟 `MediaLibraryPanel`，顯示：

- 收音機
- YouTube
- 我的收藏
- 自訂內容
- 匯入／匯出

媒體入口不得被放入主線關卡地圖節點。

## 5.2 常駐迷你播放器

收音機開始播放或恢復上次選取項目後，顯示常駐 `MediaDock`：

- 手機：底部安全區上方的橫向播放器。
- 桌面：右下角浮動播放器。
- 支援收合與展開。
- Dock 出現時，App 內容增加安全底部空間，不覆蓋主要遊戲按鈕、盤面或候選字。

迷你播放器提供：

- 播放／暫停。
- 上一個／下一個。
- 靜音。
- 音量控制。
- 目前來源名稱。
- 開啟完整媒體清單。
- 收合播放器。

收音機播放器可以跨 `home`、`campaign`、`classic` 模式持續存在。

## 5.3 YouTube 影音區

YouTube 使用獨立且可見的 16:9 播放面板：

- 建議桌面尺寸至少 480 × 270。
- 所有裝置的播放器可視區域不得小於 200 × 200。
- 保留 YouTube 官方控制列、識別與播放器行為。
- 不在播放器上方放置遮罩、按鈕或互動層。
- 同一畫面最多一個 YouTube 播放器播放。
- v1 不使用自動播放；玩家需在可見播放器內主動按下播放。
- 關閉影音面板、暫停或切換到收音機時，YouTube iframe 必須卸載。
- YouTube 不會縮成隱藏式迷你音訊播放器。

## 5.4 打地鼠整合

打地鼠不得直接操作 `HTMLAudioElement`、YouTube Player 或媒體偏好。

`App.tsx` 只將 `game.bonus.view === 'playing'` 傳給 MediaProvider。`MediaPlaybackPolicy` 接收狀態後：

- 開始：有效音量為 `baseVolume × 0.3`。
- 結束：有效音量恢復為最新的 `baseVolume`。

若玩家在降音量期間調整音量：

- 新數值更新 `baseVolume`。
- 降音期間仍套用 30%。
- 結束後恢復至新的 `baseVolume`，不得跳回舊數值。

## 6. 媒體資料模型

```ts
export type MediaItemType =
  | 'radio'
  | 'youtube-video'
  | 'youtube-playlist';

export interface MediaLibraryItem {
  readonly id: string;
  readonly type: MediaItemType;
  readonly title: string;
  readonly sourceUrl: string;
  readonly canonicalUrl: string;
  readonly category: string;
  readonly homepageUrl?: string;
  readonly origin: 'built-in' | 'custom';
  readonly enabled: boolean;
  readonly createdAt?: string;
  readonly youtubeVideoId?: string;
  readonly youtubePlaylistId?: string;
}
```

欄位規則：

- `id`：全域唯一，內建項目使用固定 ID，自訂項目使用 `crypto.randomUUID()`。
- `title`：去除首尾空白後 1～80 字。
- `category`：去除首尾空白後 1～30 字。
- `sourceUrl`：玩家輸入或內建來源。
- `canonicalUrl`：正規化後用於去重與實際播放。
- `homepageUrl`：可選，只接受 HTTPS。
- `origin`：決定是否允許刪除。
- `enabled`：內建內容只有通過內容 Gate 後才能設為 `true`。

內建項目不能由玩家刪除，但可以取消收藏。

## 7. 內建媒體內容治理

### 7.1 GitHub 與 Drive 分工

GitHub 保存：

- `data/media/default-library.json`
- 播放器程式與測試。
- 內容 ID、標題、分類及公開 URL。

Drive 保存：

- `03_Game_Content_And_Data/Media_Library_Approvals/`
- 來源授權、使用條款截圖或核准紀錄。
- 電台官方首頁與串流驗證證據。
- YouTube 頻道、影片或播放清單核准紀錄。
- 實機播放證據。

UI 圖與播放器實機截圖放置於：

- `02_UI_UX_And_Visuals/Media_Center/`

測試證據放置於：

- `04_Testing_And_Evidence/Media_Center/`

### 7.2 內容 Gate

內建項目設為 `enabled: true` 前必須確認：

- 來源為官方或有明確授權的公開頁面。
- 網址使用 HTTPS。
- 電台允許網頁播放器直接播放。
- YouTube 影片或播放清單允許嵌入。
- 不使用第三方 YouTube 音訊擷取網址。
- 不包含登入憑證或私人 Token。
- Drive 中存在對應核准證據。

目前 Drive 尚無核准的媒體內容，因此：

```json
[]
```

`data/media/default-library.json` 保持空陣列。自訂新增功能可完整使用，不使用測試網址或推測授權的電台冒充正式內容。

## 8. URL 驗證與正規化

## 8.1 通用安全規則

只接受 URL 物件可解析的完整網址。

拒絕：

- `http:`
- `javascript:`
- `data:`
- `file:`
- `blob:`
- 含有使用者名稱或密碼的網址。
- 長度超過 2048 字元的網址。
- 任意 iframe HTML、script 或 embed 標籤。

任何玩家輸入都當作純文字處理，不使用 `dangerouslySetInnerHTML`。

## 8.2 收音機網址

收音機只接受 HTTPS。

v1 使用瀏覽器原生 `HTMLAudioElement` 播放能力：

- 支援與否由實際瀏覽器決定。
- 不預先假設 MP3、AAC、Ogg 或 HLS 一定可播放。
- 不透過 `fetch` 下載串流內容。
- 不新增 HLS polyfill 或轉碼服務。
- 新增前必須在玩家操作手勢內試播。
- 試播成功條件為 `playing`、`canplay` 或 `loadedmetadata`。
- 試播逾時固定為 10 秒；錯誤或逾時不寫入資料庫。

收音機 canonical URL：

- 保留 path 與必要 query。
- 移除 fragment。
- host 由 URL 標準化。
- 不自動移除未知 query，以免破壞合法串流網址。

## 8.3 YouTube 網址

接受官方網域：

- `youtube.com`
- `www.youtube.com`
- `m.youtube.com`
- `music.youtube.com`
- `youtu.be`
- `youtube-nocookie.com`
- `www.youtube-nocookie.com`

支援格式：

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/shorts/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- `https://www.youtube.com/playlist?list=PLAYLIST_ID`
- 含 `v` 與 `list` 的影片播放清單網址

驗證：

```ts
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const PLAYLIST_ID = /^[A-Za-z0-9_-]{10,80}$/;
```

解析後只保存影片 ID 或播放清單 ID，播放器 URL 由程式自行產生，不能直接使用玩家提供的 iframe HTML。

canonical URL：

- 影片：`https://www.youtube.com/watch?v=VIDEO_ID`
- 清單：`https://www.youtube.com/playlist?list=PLAYLIST_ID`

## 9. 播放政策

### 9.1 播放互斥

- `PLAY_RADIO`：啟用收音機並卸載 YouTube iframe。
- `PLAY_YOUTUBE`：暫停收音機並掛載可見 YouTube iframe。
- `PAUSE_ALL`：停止兩者，但保留目前選取項目供 Dock 恢復。
- `SET_SELECTED_ITEM`：只恢復選取項目，不啟動任何播放。

### 9.2 音量

```ts
effectiveVolume = muted
  ? 0
  : baseVolume * (bonusActive ? 0.3 : 1);
```

- `baseVolume` 固定限制在 `0..1`。
- `muted` 優先於 ducking。
- `BONUS_STARTED` 與 `BONUS_ENDED` 重複觸發時必須具冪等性。

## 10. 本機保存

新增獨立 IndexedDB：

```text
Database：cicg-media
Version：1
Stores：
- library
- preferences
```

固定 key：

```text
library/custom-items
preferences/player
```

保存：

- 自訂媒體。
- 收藏 ID。
- 排序。
- 音量與靜音。
- Dock 收合狀態。
- 上次選取項目。

不保存：

- YouTube 登入資訊。
- Cookie。
- API Token。
- 完整觀看紀錄。
- 玩家闖關資料。

要求：

- 讀取失敗時切換至記憶體 Repository，顯示非阻擋警告。
- 寫入序列化，舊寫入不得覆蓋新狀態。
- 儲存失敗時切換至記憶體暫存，遊戲持續可用。
- App 重開後恢復上次選取項目，但不自動播放。

## 11. JSON 匯出／匯入

格式：

```json
{
  "schemaVersion": 1,
  "exportedAt": "ISO-8601",
  "library": [],
  "favoriteIds": [],
  "preferences": {}
}
```

規則：

- 只匯出自訂媒體定義，不匯出內建項目定義。
- 可保留內建項目的收藏 ID。
- 損壞 JSON、錯誤頂層結構或不支援 schema：整份拒絕，不產生部分狀態。
- 個別不安全項目：略過並計入 `failed`。
- ID 或 canonical URL 重複：略過並計入 `skipped`。
- 內建 ID 不得被覆蓋。
- 匯入完成時停止舊播放，套用匯入偏好與合法選取項目。

摘要：

```ts
interface MediaImportSummary {
  added: number;
  skipped: number;
  failed: number;
}
```

## 12. 離線與錯誤處理

- 離線時播放控制停用或顯示提示。
- 已載入的離線遊戲仍可正常使用。
- 媒體錯誤不得改變關卡、星級、分數、提示或獎勵狀態。
- YouTube 嵌入失敗由官方播放器顯示；關閉面板可返回遊戲。
- 媒體 IndexedDB 失敗時使用記憶體 fallback。

## 13. 無障礙與行動裝置

- 所有控制使用可聚焦的原生按鈕、輸入、select 與 range。
- iframe 必須有可理解的 `title`。
- 錯誤與匯入摘要使用 `role="alert"` 或 `role="status"`。
- 手機版使用安全區 `env(safe-area-inset-*)`。
- Dock 出現時只對 `.app-shell` 增加安全底部空間。
- YouTube 容器保持 `min-width: 200px`、`min-height: 200px`、`aspect-ratio: 16 / 9`。

## 14. 程式架構

```text
src/media
├─ media-types.ts
├─ media-library.ts
├─ media-url-parser.ts
├─ media-storage.ts（實際拆為 repository 與 indexeddb repository）
├─ media-import-export.ts
└─ media-playback-policy.ts

src/app/media
├─ MediaContext.tsx
├─ MediaProvider.tsx
├─ MediaDock.tsx
├─ MediaLauncher.tsx
├─ MediaLibraryPanel.tsx
├─ AddMediaForm.tsx
├─ YouTubePlayer.tsx
└─ media.css
```

責任：

- `src/media`：純 TypeScript 規則、驗證、序列化與播放政策。
- `src/app/media`：React、HTML Audio、YouTube iframe、檔案選擇與 UI。
- `App.tsx`：只掛載 Provider、媒體入口與 `bonusActive`。
- `use-whack-a-mole.ts`：保持媒體無關。

## 15. 測試 Gate

永久 Gate 包含：

1. 收音機網址只接受 HTTPS。
2. 正確解析 YouTube 影片網址。
3. 正確解析 YouTube 播放清單網址。
4. 拒絕任意 iframe 與危險協定。
5. 清單 ID 與 canonical URL 去重。
6. 內建項目不可刪除。
7. 匯入時去除重複項目。
8. 損壞 JSON 不產生部分狀態。
9. 舊 schema 拒絕匯入。
10. 收音機與 YouTube 不同時播放。
11. 打地鼠開始時降音量。
12. 打地鼠結束後恢復音量。
13. 玩家在降音期間調整音量時保留新設定。
14. IndexedDB 失敗時仍可遊戲。
15. 離線時只停用網路媒體。
16. YouTube 播放器維持可見尺寸。
17. 暫停後可恢復目前媒體。
18. YouTube 暫停後 iframe 立即卸載。
19. 重開 App 恢復選取但不自動播放。
20. Dock 出現時保留行動裝置安全空間。
21. 完整既有測試不得退化。

最終通過：

```bash
npm install
./scripts/verify.sh
```

## 16. 完成條件

- 收音機可以由玩家操作開始與暫停。
- 收音機跨遊戲模式持續存在。
- YouTube 在可見官方播放器中顯示。
- 兩種來源互斥。
- 打地鼠 ducking 行為正確。
- 自訂清單可保存、匯出及匯入。
- 無核准內建來源時正式清單保持空白。
- 媒體失敗不影響離線遊戲。
- 全部 Repository Gate 通過。

實際交付證據見：

```text
docs/superpowers/reports/2026-08-06-media-center-delivery.md
```
