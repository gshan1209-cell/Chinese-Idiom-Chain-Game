# Phase 3 PWA Installation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 Android／Chromium 使用者可從遊戲首頁觸發 PWA 安裝，並為 iPhone／iPad 提供清楚的「加入主畫面」教學，同時顯示離線就緒與更新狀態。

**Architecture:** 裝置判斷與安裝觸發拆成純 TypeScript 函式，以 Node 測試驗證；React Hook 僅負責訂閱瀏覽器事件、保存提示事件與控制 UI。首頁使用獨立安裝卡片呈現，不改動遊戲規則引擎。

**Tech Stack:** React、TypeScript、PWA `beforeinstallprompt`／`appinstalled`、Media Query、Node.js `node:test`。

## Global Constraints

- 不將 Android 安裝提示誤用於 iOS。
- iOS／iPadOS 顯示「Safari 分享 → 加入主畫面」教學。
- 已以 standalone 模式執行時不再顯示安裝按鈕。
- 不蒐集裝置識別資訊，不加入分析 SDK。
- 安裝拒絕或失敗不得阻斷遊戲。
- 所有操作按鈕高度至少 56px，狀態訊息支援 `aria-live`。

---

### Task 1: TDD 建立 PWA 裝置與安裝純函式

**Files:**
- Create: `src/pwa/install.ts`
- Create: `tests/pwa-install.test.mjs`
- Modify: `tsconfig.core.json`
- Modify: `package.json`

- [x] RED：iPhone、iPadOS、桌面瀏覽器判斷測試。
- [x] GREEN：實作 `isIosLikeDevice`。
- [x] RED：standalone 模式判斷測試。
- [x] GREEN：實作 `isStandaloneDisplay`。
- [x] RED：accepted／dismissed 安裝結果測試。
- [x] GREEN：實作 `requestPwaInstallation`。

### Task 2: 建立 PWA 安裝 Hook 與事件橋接

**Files:**
- Create: `src/app/use-pwa-install.ts`
- Modify: `src/main.tsx`

- [x] 訂閱 `beforeinstallprompt` 並阻止瀏覽器迷你提示。
- [x] 訂閱 `appinstalled` 與 standalone media query。
- [x] 接收離線就緒與更新事件。
- [x] 保存並呼叫 Service Worker `updateSW` callback。
- [x] 安裝取消或錯誤只更新 UI，不影響遊戲。

### Task 3: 建立手機安裝卡片與 iOS 教學

**Files:**
- Create: `src/app/PwaInstallCard.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.css`

- [x] Android／Chromium 有提示事件時顯示「安裝到手機」。
- [x] iOS 顯示「查看安裝步驟」。
- [x] 提供三步驟教學與關閉按鈕。
- [x] 顯示「離線可用」「已有新版本」狀態。
- [x] 已安裝時顯示完成狀態，不再顯示安裝按鈕。

### Task 4: 文件與驗證

- [x] 更新 README 已完成與尚未完成範圍。
- [x] 執行全部核心測試、資料建置、TypeScript 核心檢查及臨時 JSX 型別檢查。
- [x] 記錄 npm registry 限制，不誤稱完整瀏覽器 Build 已通過。
- [ ] 同步功能分支、抽查 Blob SHA，ahead 1／behind 0 後快轉 main。
