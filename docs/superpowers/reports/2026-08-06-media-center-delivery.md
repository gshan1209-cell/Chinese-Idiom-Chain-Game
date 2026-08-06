# 成語電台與 YouTube 影音中心交付報告

完整交付內容、TDD 證據、驗證結果、Drive 狀態、範圍審核與已知限制，以本功能 PR #8 的最終描述與 CI 紀錄為準。

## 核心交付

- HTTPS 網路收音機與跨模式常駐 MediaProvider。
- YouTube 官方可見 iframe，支援影片與播放清單。
- 收音機與 YouTube 互斥播放。
- 打地鼠期間有效音量降至最新基準音量的 30%。
- 玩家自訂內容、收藏、排序與刪除。
- JSON schema v1 匯出／匯入。
- 獨立 `cicg-media` IndexedDB 與記憶體 fallback。
- 暫停後保留選取項目；重開 App 恢復選取但不自動播放。
- YouTube 暫停後 iframe 立即卸載。
- Dock 出現時才保留行動裝置底部安全空間。

## 驗證基線

CI #141 已成功：

- 完整 Node 測試：144 項通過、0 失敗。
- Media：39 項通過、0 失敗。
- Puzzle：37 項通過、0 失敗。
- TypeScript strict、ESLint、Vite production build、PWA Service Worker：通過。
- npm audit：419 packages，0 vulnerabilities。

最新 HEAD 仍須通過同樹 CI 且 `behind_by = 0` 才可合併。

## Drive 與限制

Drive 尚無核准的正式電台或 YouTube 來源，因此 `data/media/default-library.json` 保持空陣列。本次未加入測試網址或來源不明內容。

正式發布前仍需補齊核准來源、Android／iOS 真機播放、YouTube 嵌入允許與不同瀏覽器安全區版面證據。

## 範圍

未修改 `src/progress/**`、`src/puzzle/**`、`src/game/**`、`src/app/use-whack-a-mole.ts`、PWA 設定或 runtime dependencies；不影響關卡、星級、解鎖、智慧跳格、自由接龍或打地鼠計分。
