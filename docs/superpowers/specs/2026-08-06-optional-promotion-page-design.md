# 使用者主動開啟的推薦專區設計規格

日期：2026-08-06  
Repository：`gshan1209-cell/Chinese-Idiom-Chain-Game`  
狀態：Approved  
建議實作分支：`feat/optional-promotion-page`

## 1. 目標

在不干擾主線填字、自由接龍及成語打地鼠的前提下，新增獨立的「推薦專區」。

永久產品原則：

> 遊戲過程零廣告。推薦內容只有在使用者主動點擊入口後才會顯示。

第一階段只顯示自有產品、其他遊戲、學習工具、官方活動與已核准的合作內容，不導入第三方廣告 SDK、追蹤程式或觀看廣告獎勵。

## 2. 強制產品規則

### 2.1 遊戲過程禁止廣告

以下位置與流程不得顯示、自動開啟或預載廣告內容：

- PWA 啟動流程
- 關卡地圖
- 填字關卡開始前
- 填字關卡進行中
- 提示與錯誤修正流程
- 暫停畫面
- 關卡完成及星級結算
- 自由接龍答題流程
- 成語打地鼠開始、進行及結束流程
- Service Worker 更新提示
- 離線提示

禁止的形式包括：

- 插頁廣告
- 彈窗廣告
- 浮層廣告
- 倒數廣告
- 自動播放影片
- 強制觀看廣告
- 自動跳轉外部網站
- 偽裝成系統訊息、遊戲任務或獎勵的廣告
- 以紅點、倒數或跳動動畫誘導點擊

### 2.2 不得影響遊戲權益

查看或點擊推薦內容不得影響：

- 關卡解鎖
- 星級
- 分數
- 提示次數
- 錯誤次數
- IndexedDB 進度
- 自由接龍 Session
- 打地鼠能量
- 提示券
- 雙倍分數
- 失誤護盾

不得建立「看廣告才能繼續」、「看廣告才能過關」或「未看廣告即限制完整功能」的機制。

## 3. 第一階段內容範圍

允許：

- 開發者的其他遊戲
- 開發者的學習工具
- 官方活動
- 新產品介紹
- 已核准合作專案
- 清楚標示的贊助內容

禁止：

- Google AdSense
- Google AdMob
- Meta Audience Network
- 其他第三方廣告 SDK
- 遠端廣告競價
- 個人化廣告
- 跨網站 Cookie
- 裝置指紋
- 廣告識別碼
- 使用者行為追蹤
- 未核准的外部 JavaScript

未來如需第三方廣告，必須另開設計規格，完成隱私政策、兒童與教育產品合規、商店政策及效能審查後才能啟用。

## 4. 頁面與入口

### 4.1 使用者介面名稱

正式名稱：

```text
推薦專區
```

首頁入口建議文字：

```text
看看其他推薦
```

輔助文字：

```text
由你主動開啟，不影響遊戲進度
```

### 4.2 入口位置

入口只可放在非遊戲中的次要功能區，例如：

- 首頁的「其他功能」
- 設定頁
- 關於本遊戲頁

入口優先級必須低於：

1. 繼續闖關
2. 關卡地圖
3. 主線填字玩法
4. 自由接龍

### 4.3 禁止出現入口的位置

- 填字盤面
- 關卡完成畫面
- 自由接龍答題畫面
- 打地鼠畫面
- 暫停畫面
- 提示流程
- 錯誤修正流程

玩家進行遊戲時不得被引導離開遊戲查看推薦。

## 5. 使用者流程

### 5.1 開啟流程

```text
首頁或設定頁
→ 使用者主動點擊「看看其他推薦」
→ 進入推薦專區
→ 瀏覽推薦卡片
→ 點擊「了解更多」
→ 顯示離開遊戲確認
→ 使用者確認後才開啟外部網站
```

### 5.2 返回流程

```text
推薦專區
→ 點擊返回
→ 回到開啟前的安全頁面
```

離開推薦專區後不得重設或改寫任何遊戲狀態。

## 6. 頁面設計

### 6.1 頁首

必須包含：

- 返回按鈕
- 標題「推薦專區」
- 說明文字

建議說明：

```text
這裡整理其他遊戲、學習工具與合作內容。
只有你主動開啟時才會顯示，不會打斷遊戲。
```

### 6.2 推薦卡片

每張卡片包含：

- 圖片
- 名稱
- 一至兩行介紹
- 內容類型
- 「了解更多」按鈕
- 外部連結標示
- 贊助標示（適用時）

內容類型：

- 其他遊戲
- 學習工具
- 官方活動
- 合作推薦
- 贊助內容

付費推廣必須清楚顯示：

```text
贊助內容
```

不得把付費內容偽裝成官方通知或遊戲功能。

### 6.3 空狀態

```text
目前沒有新的推薦內容。
可以先回去繼續闖關。
```

沒有合法內容時不得顯示假資料或讓頁面崩潰。

## 7. 推薦內容資料模型

建議純 TypeScript 契約：

```ts
export type PromotionType =
  | 'own-product'
  | 'partner'
  | 'official'
  | 'sponsored';

export interface PromotionItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly imageUrl: string;
  readonly destinationUrl: string;
  readonly type: PromotionType;
  readonly sponsorName: string | null;
  readonly enabled: boolean;
  readonly sortOrder: number;
  readonly startsAt: string | null;
  readonly endsAt: string | null;
}
```

驗證規則：

- `id` 必須唯一。
- `title` 與 `description` 不得為空。
- `destinationUrl` 必須為允許清單中的 HTTPS 網址。
- `type === 'sponsored'` 時必須提供 `sponsorName`。
- `enabled === false` 的項目不得顯示。
- 尚未到 `startsAt` 的項目不得顯示。
- 已超過 `endsAt` 的項目不得顯示。
- 依 `sortOrder` 升冪排序，相同時依 `id` 排序。
- 相同輸入必須產生相同結果。

## 8. 資料來源

第一階段採用 Repository 內的靜態資料，不使用後端或遠端廣告服務。

建議位置：

```text
src/promotions/promotion-items.ts
```

不得直接從需要登入權限的 Google Drive 預覽網址載入 runtime 內容。

正式素材流程：

1. 原始素材先放入 Drive 的 `80_Inbox`。
2. 完成來源、授權與內容審查。
3. 核准後移入 `02_UI_UX_And_Visuals` 或 `05_Releases_And_Store_Assets`。
4. 匯出適合網頁的 WebP／AVIF 或其他核准格式。
5. 將部署用資源提交至 Repository。
6. 在 PR 中記錄 Drive 素材位置及版本。

## 9. 架構邊界

建議新增：

```text
src/promotions/
├─ promotion-model.ts
├─ promotion-engine.ts
└─ promotion-items.ts

src/app/
├─ PromotionPage.tsx
└─ PromotionPage.css
```

### 9.1 `src/promotions`

純 TypeScript，負責：

- 資料型別
- 啟用狀態
- 日期有效性
- 排序
- 贊助標示規則
- URL 允許清單驗證

不得依賴：

- React
- DOM
- `window`
- 螢幕尺寸
- IndexedDB
- 亂數
- 使用者追蹤

### 9.2 `src/app`

React 只負責：

- 頁面呈現
- 返回操作
- 外部連結確認
- 手機觸控
- 鍵盤與焦點
- 空狀態
- 圖片載入失敗 fallback

不得在 React 內重複實作資料排序或安全驗證。

## 10. 畫面狀態與路由

若專案尚未使用 Router，不得只為此頁面新增大型路由依賴。

應沿用既有畫面狀態模式，例如：

```ts
type AppScreen =
  | 'home'
  | 'level-map'
  | 'campaign'
  | 'classic'
  | 'promotions';
```

不得從進行中的遊戲 Session 直接切換到推薦頁。

## 11. 外部連結安全

任何外部連結都必須再次確認。

建議訊息：

```text
即將離開遊戲並開啟外部網站。
外部網站可能有不同的隱私權政策與服務條款。
```

按鈕：

```text
取消
繼續前往
```

安全要求：

- 只允許 HTTPS。
- 網域必須存在於明確允許清單。
- 禁止 `javascript:`、`data:`、`file:` URL。
- 禁止未驗證的重新導向網址。
- 使用新分頁開啟。
- 使用 `noopener`。
- 使用 `noreferrer`。
- 不得直接使用資料檔提供的任意網址。

## 12. 離線與效能

離線時：

- 可顯示已打包的推薦文字與圖片。
- 外部連結無法開啟時顯示友善訊息。
- 不得影響主遊戲離線使用。

建議訊息：

```text
目前沒有網路連線，暫時無法開啟外部網站。
```

效能要求：

- 首頁不得預先載入大型推薦圖片。
- 只有進入推薦頁後才載入非必要圖片。
- 優先使用 WebP 或 AVIF。
- 單張圖片建議不超過 200 KB。
- 圖片失敗時使用本機 placeholder。
- 不得破壞 Service Worker 或主遊戲初始載入效能。

## 13. 無障礙與手機規格

- 主要按鈕高度至少 56px。
- 使用繁體中文。
- 圖片必須有替代文字。
- 贊助內容不得只靠顏色區分。
- 外部連結須標示會離開遊戲。
- 所有操作支援鍵盤。
- 焦點順序合理。
- 360px 寬度不得水平捲動。
- 支援 `prefers-reduced-motion`。
- 不使用自動播放、閃爍或跳動效果。

## 14. 隱私規則

第一階段不得收集：

- 使用者點擊紀錄
- 裝置識別碼
- IP 分析資料
- 精確位置
- 廣告識別碼
- 跨頁追蹤資料
- 兒童使用資料
- 成語表現與推薦點擊的關聯資料

未來若需匿名統計，必須另開隱私與分析規格。

## 15. 錯誤處理

- 圖片失敗：顯示本機 placeholder，不隱藏整張卡片。
- 單筆資料無效：忽略該項目，其他合法項目仍正常顯示。
- 網址無效：停用按鈕並顯示「此連結目前無法使用」。
- 全部項目無效：顯示空狀態。
- 網路中斷：保留頁面，外部連結顯示離線提示。

## 16. TDD 測試要求

實作必須先新增失敗測試並確認 RED 原因正確。

### 16.1 純 TypeScript 測試

至少驗證：

1. 只回傳 `enabled` 項目。
2. 尚未開始的項目不顯示。
3. 已過期項目不顯示。
4. `sortOrder` 正確排序。
5. 相同 `sortOrder` 依 `id` 穩定排序。
6. 贊助項目缺少 `sponsorName` 時無效。
7. 非 HTTPS 網址無效。
8. 不在允許清單的網域無效。
9. `javascript:` URL 無效。
10. `data:` URL 無效。
11. 相同輸入產生相同輸出。
12. 無效項目不影響其他合法項目。

### 16.2 UI／E2E 測試

至少驗證：

1. 首頁可看到推薦專區入口。
2. 關卡進行中看不到推薦入口。
3. 未主動點擊時不顯示推薦內容。
4. 點擊後才進入推薦專區。
5. 返回後不改寫任何遊戲狀態。
6. 不會自動開啟外部網站。
7. 外部連結前顯示確認。
8. 取消後留在推薦頁。
9. 確認後才開啟新分頁。
10. 離線時顯示提示。
11. 空資料時顯示空狀態。
12. 贊助內容有文字標示。
13. 360px 畫面沒有水平捲動。
14. 鍵盤可操作所有按鈕。
15. 主線關卡、星級與 IndexedDB 完全不受影響。

## 17. 永久 Gate

後續功能不得破壞：

```text
遊戲過程廣告數量 = 0
自動彈出廣告數量 = 0
強制觀看廣告數量 = 0
未經主動點擊載入第三方廣告 SDK 數量 = 0
廣告影響關卡進度數量 = 0
廣告影響星級數量 = 0
廣告影響提示權限數量 = 0
```

應建立永久回歸測試：

- 首頁不自動開啟推薦頁。
- 關卡內不存在推薦入口。
- 過關後不顯示推薦彈窗。
- 推薦頁不改寫 campaign progress。
- 推薦頁不載入第三方追蹤 Script。

## 18. 建議允許修改範圍

```text
src/promotions/**
src/app/PromotionPage.tsx
src/app/PromotionPage.css
src/app/App.tsx
src/app/App.css
tests/promotion-engine.test.mjs
相關 UI／E2E 測試
README.md
docs/superpowers/specs/**
docs/superpowers/plans/**
public/assets/promotions/**
```

## 19. 禁止修改範圍

本功能不得修改：

- 第一章 20 關資料
- 61 個成語唯一性規則
- 智慧自動跳格
- 星級規則
- IndexedDB schema
- 逐關解鎖
- 自由接龍規則
- 打地鼠狀態機與獎勵
- 成語來源 CSV
- 音效系統
- 後端服務
- 登入功能
- 付款功能

## 20. 驗收條件

完成時必須同時符合：

- 遊戲過程沒有任何廣告。
- 推薦內容只能由使用者主動開啟。
- 推薦專區為獨立頁面。
- 關卡內沒有推薦入口。
- 推薦頁不影響遊戲狀態。
- 未導入第三方廣告 SDK。
- 未加入追蹤或觀看獎勵。
- 外部連結有二次確認。
- 贊助內容清楚標示。
- 離線時主遊戲正常運作。
- 新增測試與既有完整回歸全部通過。
- TypeScript strict、ESLint、PWA production build 通過。
- npm audit 無新增漏洞。
- 分支相對最新 `main` 的 `behind_by = 0`。

## 21. PR 紀錄要求

實作 PR 必須記錄：

- 遊戲過程維持零廣告。
- 推薦頁只由使用者主動開啟。
- 未導入第三方 SDK。
- 未加入追蹤。
- 未加入觀看獎勵。
- 未修改進度 schema、星級及關卡規則。
- TDD RED 證據。
- 完整測試數量。
- TypeScript、ESLint、Build、PWA、npm audit 結果。
- 新增素材的 Drive 位置。
- 最終允許的外部網域清單。

CI 全綠並完成 ChatGPT Audit 後，才可 Squash Merge。
