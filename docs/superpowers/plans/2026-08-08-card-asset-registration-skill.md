# Card Asset Registration Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立單一成語圖卡註冊技能，並完成胡蝶忍「綿裡藏針」UR 設計參考圖與完整提示語的 Drive 上傳及 GitHub 登記。

**Architecture:** 技能負責順序與 Gate；Drive 保存二進位圖檔及提示語；GitHub 保存不可變的真實 File ID、尺寸、SHA-256、授權與發布狀態。無正式授權的 UR 不更新正式卡號 Registry。

**Tech Stack:** Markdown skill、GitHub JSON 資產紀錄、Google Drive connector、PNG metadata、SHA-256

## Global Constraints

- 使用分支 `feat/card-asset-registration-skill`。
- 圖片實際尺寸與雜湊必須如實記錄。
- 無 `licenseEvidenceId` 不得配置或消耗 `UR-####`。
- 不得宣稱取得《鬼滅之刃》商業授權。
- 圖片與完整提示語必須位於同一 Drive 資料夾。
- 重複 SHA-256 不得重複註冊。

---

### Task 1: 建立註冊技能

**Files:**
- Create: `.agents/skills/registering-cicg-card-assets/SKILL.md`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: 圖片路徑、卡牌資料、Drive 目標資料夾、授權證據狀態
- Produces: Drive File ID 與 GitHub 資產紀錄

- [ ] **Step 1: 建立失敗情境檢查表**

確認技能必須阻擋：假的 Drive ID、缺少 SHA-256、無授權卻配置正式 UR 卡號、圖片與提示語分散於不同資料夾、同雜湊重複上傳。

- [ ] **Step 2: 建立最小技能文件**

技能只保留六步：讀取真實狀態 → 檢查檔案 → 授權 Gate → 上傳圖片及提示語 → 登記 → 回報。

- [ ] **Step 3: 將技能加入 AGENTS 必讀入口**

凡出現「註冊、上傳、歸檔、正式用、登記」即先讀技能。

- [ ] **Step 4: 自我驗證**

搜尋技能，確認沒有 `TBD`、`TODO`、虛構 ID、允許未授權 UR 正式編號的文字。

- [ ] **Step 5: Commit**

```bash
git add .agents/skills/registering-cicg-card-assets/SKILL.md AGENTS.md
git commit -m "feat: add card asset registration skill"
```

### Task 2: 上傳胡蝶忍 UR 圖片與完整提示語

**Files:**
- Source image: `/mnt/data/imagegen.png`
- Create locally for upload: `CICG_UR_Kimetsu_Shinobu_MianLiCangZhen_FullPrompt_v1.0.md`

**Interfaces:**
- Consumes: Drive folder ID `15vXPQ7w4-aS6dlLcSCAZUzG_GjrRNJtc`
- Produces: image Drive File ID、prompt Drive File ID

- [ ] **Step 1: 驗證圖片**

```bash
file /mnt/data/imagegen.png
sha256sum /mnt/data/imagegen.png
```

預期：PNG、897 × 1752、SHA-256 `63aadecb7903e4946b6437558f59245caad2399ef8553f3f3780e226ca5a0752`。

- [ ] **Step 2: 建立完整提示語文件**

文件包含 artwork prompt、renderer data、禁用項目、授權 Gate 與本次實際資產狀態。

- [ ] **Step 3: 上傳圖片**

檔名：`CICG_UR_Kimetsu_Shinobu_MianLiCangZhen_DesignReference_v1.0.png`

- [ ] **Step 4: 上傳提示語**

檔名：`CICG_UR_Kimetsu_Shinobu_MianLiCangZhen_FullPrompt_v1.0.md`

- [ ] **Step 5: 讀回 Drive metadata**

記錄兩個真實 File ID、Web View Link、檔案大小與父資料夾。

### Task 3: 建立不可變註冊紀錄

**Files:**
- Create: `data/drive-assets/ur-card-assets-2026-08-08.json`

**Interfaces:**
- Consumes: Task 2 的真實 Drive metadata
- Produces: 單一 canonical GitHub 登記紀錄

- [ ] **Step 1: 建立紀錄**

寫入圖片與提示語兩筆資產，包含真實 ID、尺寸、大小、SHA-256、角色、成語、主題、狀態及授權 Gate。

- [ ] **Step 2: 驗證 JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('data/drive-assets/ur-card-assets-2026-08-08.json','utf8')); console.log('valid')"
```

預期：`valid`。

- [ ] **Step 3: 確認正式卡號 Registry 未變動**

`data/cards/card-number-registry.json` 的 UR `assignedCount` 必須維持 0、`nextSequence` 維持 1。

- [ ] **Step 4: Commit**

```bash
git add data/drive-assets/ur-card-assets-2026-08-08.json docs/card-prompts/shared/CICG_UR_Kimetsu_Shinobu_MianLiCangZhen_FullPrompt_v1.0.md
git commit -m "docs: register Shinobu UR design reference"
```

### Task 4: 驗證與 PR

**Files:**
- Verify all files from Tasks 1–3

**Interfaces:**
- Consumes: 完整分支
- Produces: 可審核 PR

- [ ] **Step 1: 比對 main**

確認分支只包含技能、規格、計畫、提示語與本卡資產紀錄。

- [ ] **Step 2: 驗證無占用正式 UR 編號**

搜尋 `UR-0001`，本次新增檔案不得將其標示為本卡正式卡號。

- [ ] **Step 3: 建立 PR**

標題：`feat: simplify card asset registration and register Shinobu UR reference`

- [ ] **Step 4: ChatGPT Audit**

核對 Drive ID、SHA-256、尺寸、授權狀態與 GitHub 記錄完全一致。
