# 成語電台與 YouTube 影音中心設計規格

## 0. 文件資訊

- Repository：`gshan1209-cell/Chinese-Idiom-Chain-Game`
- Branch：`feat/media-center`
- 日期：2026-08-06
- 狀態：使用者已核准設計方向，等待書面規格審閱
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

### 5.1 首頁入口

首頁新增「成語電台」入口，與「進入闖關地圖」及「其他玩法」分開。

入口開啟 `MediaLibraryPanel`，預設顯示：

- 收音機
- YouTube
- 我的收藏
- 自訂內容
- 匯入／匯出

媒體入口不得被放入主線關卡地圖節點。

### 5.2 常駐迷你播放器

收音機開始播放後，顯示常駐 `MediaDock`：

- 手機：底部安全區上方的橫向播放器。
- 桌面：右下角浮動播放器。
- 支援收合與展開。
- 不覆蓋主要遊戲按鈕、盤面或候選字。

迷你播放器提供：

- 播放／暫停。
- 上一個／下一個。
- 靜音。
- 音量控制。
- 目前來源名稱。
- 開啟完整媒體清單。
- 關閉播放器。

「關閉播放器」會停止目前收音機、清除目前媒體項目並隱藏 Dock；不會刪除清單或偏好。

收音機播放器可以跨 `home`、`campaign`、`classic` 模式持續存在。

### 5.3 YouTube 影音區

YouTube 使用獨立且可見的 16:9 播放面板：

- 建議桌面尺寸至少 480 × 270。
- 所有裝置的播放器可視區域不得小於 200 × 200。
- 保留 YouTube 官方控制列、識別與播放器行為。
- 不在播放器上方放置遮罩、按鈕或互動層。
- 同一畫面最多一個 YouTube 播放器自動播放。
- v1 預設不使用自動播放；玩家需主動按下播放。
- 關閉影音面板或進入遊戲模式時，YouTube 必須暫停。
- YouTube 不會縮成隱藏式迷你音訊播放器。

### 5.4 打地鼠整合

打地鼠只送出播放政策事件：

- `bonus-round-started`
- `bonus-round-ended`

打地鼠元件不得直接操作 `HTMLAudioElement`、YouTube Player 或媒體偏好。

`MediaPlaybackPolicy` 接收事件後：

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

內建項目不能由玩家刪除，但可以隱藏或取消收藏。

## 7. 內建媒體內容治理

### 7.1 GitHub 與 Drive 分工

GitHub 保存：

- `data/media/default-library.json`
- JSON schema 與驗證腳本。
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

目前 Drive 尚無核准的媒體內容，因此程式架構可以先完成，但正式內建清單不得自行加入未核准來源。

若實作時仍無核准項目：

- `default-library.json` 可以保持空陣列。
- 自訂新增功能仍須可完整使用。
- 不得用測試網址或推測授權的電台冒充正式內容。

## 8. URL 驗證與正規化

### 8.1 通用安全規則

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

### 8.2 收音機網址

收音機只接受 HTTPS。

v1 使用瀏覽器原生 `HTMLAudioElement` 播放能力：

- 支援與否由實際瀏覽器決定。
- 不預先假設 MP3、AAC、Ogg 或 HLS 一定可播放。
- 不透過 `fetch` 下載串流內容。
- 不新增 HLS polyfill 或轉碼服務。
- 新增前必須在玩家操作手勢內試播。
- 試播最多等待 10 秒；逾時視為失敗。
- 試播失敗時不寫入，並顯示可理解的錯誤。

收音機 canonical URL：

- 保留 path 與必要 query。
- 移除 fragment。
- host 轉為小寫。
- 不自動移除未知 query，以免破壞合法串流網址。

### 8.3 YouTube 網址

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

ID 驗證：

- 影片 ID 必須符合 `[A-Za-z0-9_-]{11}`。
- 播放清單 ID 必須符合 `[A-Za-z0-9_-]{10,128}`。

解析後只保存：

- 影片 ID，或
- 播放清單 ID。

播放器 URL 由程式自行產生，不能直接使用玩家提供的 iframe HTML。

canonical URL 格式：

- 影片：`https://www.youtube.com/watch?v=VIDEO_ID`
- 清單：`https://www.youtube.com/playlist?list=PLAYLIST_ID`

YouTube 播放器需設定 `origin`，且不得以 `Referrer-Policy` 抑制 `HTTP Referer`。建議使用瀏覽器預設或 `strict-origin-when-cross-origin`。

## 9. 播放狀態與政策

```ts
export type ActiveMediaKind = 'none' | 'radio' | 'youtube';

export interface MediaPlaybackState {
  readonly activeKind: ActiveMediaKind;
  readonly currentItemId: string | null;
  readonly status: 'idle' | 'loading' | 'playing' | 'paused' | 'error';
  readonly baseVolume: number;
  readonly muted: boolean;
  readonly duckingContexts: readonly string[];
  readonly lastError: string | null;
}
```

音量範圍為 `0` 至 `1`。

有效音量計算：

```ts
function getEffectiveVolume(state: MediaPlaybackState): number {
  if (state.muted) return 0;
  return state.duckingContexts.length > 0
    ? state.baseVolume * 0.3
    : state.baseVolume;
}
```

播放互斥：

- 收音機開始播放前，暫停 YouTube。
- YouTube 開始播放前，暫停收音機。
- YouTube 面板關閉時，暫停 YouTube。
- App 離線時，將網路媒體轉為暫停或錯誤狀態，不影響遊戲 session。

同一播放器的重複 `play`、`pause`、`duck` 與 `unduck` 必須可安全重入，不得造成音量累乘或狀態漂移。

## 10. 本機保存

媒體資料與既有 `cicg-progress` 完全分離。

新增 IndexedDB：

```text
Database：cicg-media
Version：1
Stores：
- custom-library
- preferences
```

### 10.1 `custom-library`

- `keyPath`：`id`
- 僅保存玩家新增項目。
- 內建清單仍由版本控制的 JSON 提供。

### 10.2 `preferences`

單一紀錄：

```ts
export interface MediaPreferences {
  readonly key: 'media-preferences';
  readonly baseVolume: number;
  readonly muted: boolean;
  readonly lastSelectedItemId: string | null;
  readonly dockCollapsed: boolean;
  readonly favoriteIds: readonly string[];
  readonly hiddenBuiltInIds: readonly string[];
  readonly customOrder: readonly string[];
}
```

不保存：

- YouTube 帳號。
- Cookie。
- API Token。
- 完整觀看紀錄。
- 玩家關卡進度。

IndexedDB 不可用時：

- 媒體功能仍可在目前分頁暫時使用。
- 顯示「本次設定可能無法保存」。
- 遊戲本身不得因此中止。

## 11. 匯出與匯入

### 11.1 匯出格式

```ts
export interface MediaBackupV1 {
  readonly schemaVersion: 1;
  readonly exportedAt: string;
  readonly customItems: readonly MediaLibraryItem[];
  readonly preferences: MediaPreferences;
}
```

匯出檔名：

```text
cicg-media-backup-YYYY-MM-DD.json
```

只匯出自訂項目與偏好，不重複匯出內建清單。

### 11.2 匯入規則

匯入流程必須先完成全部驗證，再執行單次寫入：

1. JSON 可解析。
2. `schemaVersion === 1`。
3. 所有欄位類型正確。
4. URL 通過同一套安全驗證。
5. `origin` 強制轉為 `custom`。
6. 依 ID 與 canonical URL 去重。
7. 不覆蓋內建項目。
8. 無效項目逐筆略過並計數。
9. 損壞檔案不得進行部分寫入。

完成後顯示：

- 新增數量。
- 略過重複數量。
- 無效數量。
- 偏好是否成功套用。

## 12. 程式架構

```text
src/media
├─ media-types.ts
├─ media-library.ts
├─ media-url-parser.ts
├─ media-playback-policy.ts
├─ media-storage.ts
├─ media-import-export.ts
└─ media-events.ts

src/app/media
├─ MediaProvider.tsx
├─ MediaDock.tsx
├─ MediaLibraryPanel.tsx
├─ RadioPlayer.tsx
├─ YouTubePlayer.tsx
├─ AddMediaDialog.tsx
└─ ImportExportPanel.tsx

data/media
└─ default-library.json
```

責任：

- `src/media`：純 TypeScript 規則、驗證、狀態轉換、儲存契約與序列化。
- `src/app/media`：React 畫面、`HTMLAudioElement` 與 YouTube IFrame API 生命週期。
- `App.tsx`：只掛載 `MediaProvider`、`MediaDock` 與媒體入口。
- 打地鼠：只發出開始與結束事件。

不得把 URL 驗證、匯入規則或音量政策直接寫進 React JSX。

## 13. YouTube 技術整合

v1 使用官方 YouTube IFrame Player API，不使用第三方 React wrapper。

原因：

- 避免新增不必要依賴。
- 可直接控制 `playVideo`、`pauseVideo`、`stopVideo` 與音量。
- 可明確管理腳本只載入一次。
- 可遵守官方播放器尺寸與可見性規則。

需提供：

- IFrame API script 單例載入器。
- `onYouTubeIframeAPIReady` 的安全註冊。
- 元件卸載時呼叫 `destroy()`。
- 播放錯誤轉為可理解的繁體中文訊息。
- 只在影音面板可見時建立播放器。

官方政策參考：

- https://developers.google.com/youtube/iframe_api_reference
- https://developers.google.com/youtube/terms/required-minimum-functionality

## 14. PWA 與離線行為

- 遊戲核心、題庫與進度仍維持離線優先。
- 外部串流與 YouTube 不加入 Service Worker precache。
- 不快取影片、音訊或 YouTube iframe 內容。
- 離線時媒體入口仍可開啟，但顯示「目前離線」。
- 離線不影響進入闖關地圖、完成關卡或保存進度。
- 回到線上後，玩家需再次主動播放；不得自動恢復有聲播放。

## 15. 可存取性

- 所有播放器控制使用原生 `button` 或 `input[type=range]`。
- 每個控制提供繁體中文可存取名稱。
- 播放狀態與錯誤使用 `aria-live="polite"`。
- 音量控制支援鍵盤方向鍵。
- 焦點不會因媒體狀態更新而被強制移動。
- 迷你播放器收合後仍保留播放／暫停與目前來源名稱。
- 不以顏色作為唯一狀態提示。
- YouTube iframe 需有明確 `title`。

## 16. 錯誤處理

錯誤類型：

- URL 格式錯誤。
- 不安全協定。
- 不支援的 YouTube 網域。
- 無法解析影片或播放清單 ID。
- 收音機無法播放。
- YouTube 不允許嵌入或影片不存在。
- IndexedDB 讀寫失敗。
- 匯入檔案損壞。
- 離線。

錯誤處理原則：

- 顯示繁體中文訊息。
- 保留玩家原本清單與偏好。
- 不清空遊戲 session。
- 不修改闖關進度。
- 可重新嘗試，但不得無限自動重試。

## 17. 測試策略

### 17.1 純 TypeScript 自動測試

至少新增：

1. 接受合法 HTTPS 電台網址。
2. 拒絕 HTTP 與危險協定。
3. 拒絕含帳號密碼的 URL。
4. 解析 `watch?v=` 影片網址。
5. 解析 `youtu.be` 網址。
6. 解析 Shorts 網址。
7. 解析 YouTube 播放清單。
8. 拒絕非官方 YouTube 網域。
9. 拒絕不合法的影片與播放清單 ID。
10. 產生固定 canonical URL。
11. 依 ID 與 canonical URL 去重。
12. 損壞 JSON 不寫入。
13. 舊 schema 拒絕匯入。
14. 匯入時強制轉為 `custom`。
15. 收音機與 YouTube 播放互斥。
16. 打地鼠開始時有效音量為 30%。
17. 打地鼠結束時恢復基準音量。
18. 降音期間調整基準音量後正確恢復。
19. 重複 duck 不造成音量連乘。
20. 重複 unduck 不造成狀態錯誤。
21. IndexedDB 失敗時回退至記憶體狀態。
22. 電台試播逾時後不寫入項目。

### 17.2 UI 與瀏覽器驗證

需提供實機或瀏覽器證據：

- 首次進入不自動播放。
- 收音機跨首頁、闖關與自由接龍持續播放。
- 打地鼠期間降音，結束後恢復。
- YouTube 播放器保持可見且尺寸合規。
- 關閉影音面板後 YouTube 暫停。
- 手機底部播放器不遮住盤面與候選字。
- 桌面浮動播放器不遮住主要操作。
- 離線時遊戲仍可正常闖關。
- 匯出與匯入可在 Chromium 瀏覽器完成。

## 18. 驗收標準

完成條件：

- 收音機與 YouTube 影音區都可使用。
- 收音機可跨遊戲模式持續播放。
- YouTube 只在可見播放器中播放。
- 打地鼠自動降音與恢復規則正確。
- 玩家可新增合法自訂來源。
- 玩家可匯出與匯入本機清單。
- 媒體資料與闖關進度完全分離。
- IndexedDB 失敗不影響遊戲。
- 無核准內建內容時不自行加入來源。
- 所有新增自動測試通過。
- 既有完整測試不得刪除或放寬。
- TypeScript strict、ESLint、Vite production build 與 PWA build 通過。
- `npm audit` 為 0 vulnerabilities。
- `./scripts/verify.sh` 完整通過。

## 19. 預計修改範圍

允許新增或修改：

- `src/media/**`
- `src/app/media/**`
- `data/media/default-library.json`
- 媒體相關測試。
- `src/app/App.tsx` 的媒體 Provider 與入口掛載。
- 打地鼠開始／結束事件的最小整合點。
- 必要的 CSS。
- `package.json` 測試腳本。
- README 與本功能文件。

除非測試證明必要，否則不得修改：

- Puzzle 關卡資料。
- 成語題庫。
- 智慧自動跳格。
- 星級與解鎖規則。
- `cicg-progress` schema。
- 自由接龍計分。
- 打地鼠出題、計分與獎勵規則。
- PWA manifest 核心設定。
- 後端或部署架構。

## 20. 規格依據

本規格以以下狀態為基線：

- GitHub `main` SHA：`1e3c9ed68035ef714e1d21e912c0b3d8078a81b7`。
- 目前無開啟中的 PR。
- 目前無開啟中的 Issue。
- Drive 專案目錄已建立固定分類。
- `02_UI_UX_And_Visuals` 與 `80_Inbox` 尚無媒體相關核准素材。
