# Drive Phase 2 Readiness

日期：2026-08-07  
判定：**Phase 2 Ready = false**

## 1. Readiness Gate

Phase 2 只有在以下條件全部成立時才能設為 true：

```text
Blocking drift = 0
Duplicate current Approved = 0
Unverified applied migrations = 0
Missing rollback snapshots = 0
Unregistered files in Approved = 0
Full repository verify = PASS
```

目前判定：

| Gate | 結果 | 證據 |
|---|---|---|
| Blocking drift | 0 / PASS | Live Drive scan 與 Registries 一致 |
| Duplicate current Approved | 0 / PASS | 只有四張 current Approved rarity frames |
| Unverified applied migrations | 0 / PASS | Batch 1、Batch 2 全部 verified |
| Missing rollback snapshots | 0 / PASS | 每個 mutation entry 皆有 rollback snapshot |
| Unregistered files in Approved | 0 / PASS | 9 個 Approved leaf folders 已全部掃描 |
| Latest full repository verify | **PENDING** | 最新 commit 尚無可引用的完整 CI 結果 |

因此：

```text
Phase 2 Ready = false
Blocking reason = latest-full-repository-verify-pending
```

在新 CI 明確通過前，不得開始 Phase 2 實體搬移，也不得將 PR 標記可合併。

## 2. Phase 1 已達成的能力

- 43／43 required folder keys 已建立並使用真實 Folder IDs。
- Registry 總計 60 folders。
- Asset Registry 總計 9 assets。
- 四張 N／R／SR／SSR current Approved masters 已移入唯一 Approved 位置並採 canonical names。
- Difficulty badge sheet 已移入正式 Review，未因舊檔名自動升格。
- 四張 v2.7 templates 已設為 quarantined。
- Pending Review、Legacy Backup、v2.1 容器已移入 governed Inbox。
- Migration Ledgers 具有完整 before／after／rollback snapshots。
- `scripts/verify.sh` 永久執行 Drive governance validation。
- CLI 自動掃描 `data/drive-assets/migrations/` 下全部 JSON Ledgers。

## 3. 尚待逐檔治理的 Phase 1 素材

以下素材已位於 Inbox 或 Archive，不會污染正式 Approved，但尚未完成逐檔治理：

| 類別 | 數量／狀態 |
|---|---|
| Pending Review batches | 3 批 × 10 張 = 30 張 |
| Legacy Backup | 7 個直接子項，另有巢狀素材 |
| v2.1 legacy container | 6 個直接子項 |
| Archive Templates v2.5 | 4 張 |
| Archive Templates v2.2 | 3 張 |
| v2.7 quarantined templates | 4 張，已個別登錄 |

這些不阻擋 Phase 1 governance 架構完成，但後續不得整批直接升格、刪除或發布。每一批仍須：

1. 計算 SHA-256 與尺寸。
2. 判定 asset type、identity、version 與 lifecycle。
3. 建立 approval、rejection 或 unverifiable 證據。
4. 建立完整 Migration Ledger。
5. 逐檔 move、驗證或 rollback。

## 4. Phase 2 建議範圍

Phase 2 不是繼續擴散圖卡搬移，而是將同一治理模式擴展到整個專案 Drive：

```text
00_Project_Management
01_Design_And_Specs
02_UI_UX_And_Visuals（非圖卡資產）
03_Game_Content_And_Data
04_Testing_And_Evidence
05_Releases_And_Store_Assets
80_Inbox
90_Archive
```

推薦執行順序：

1. 建立全專案 read-only inventory。
2. 為每一資產領域定義 type-first target topology。
3. 先處理明確 Approved／Review／Archive，未知項目留 Inbox。
4. 每次只搬移一個小批次並保存 rollback。
5. 以同一 Registry、Ledger、physical audit 與 CI Gate 驗證。

## 5. Canonical Entry Points

後續 Agent 不得從本報告複製 Folder IDs；必須直接讀取：

```text
data/drive-assets/drive-folders.json
data/drive-assets/idiom-card-assets.json
data/drive-assets/migrations/
data/drive-assets/physical-audit-2026-08-07.json
```

對應規格與報告：

```text
docs/superpowers/specs/2026-08-06-drive-asset-governance-design.md
docs/superpowers/plans/2026-08-06-drive-asset-governance.md
docs/superpowers/reports/2026-08-07-drive-phase1-migration-report.md
```

## 6. 解除阻擋條件

當最新 PR head 完成以下驗證後，才可重新計算 readiness：

```bash
npm install
./scripts/verify.sh
git status --short
git diff --check
```

並要求：

- GitHub Actions 最新 run 成功。
- `behind_by = 0`。
- 未解決 review threads = 0。
- Live Drive metadata 與 physical audit snapshot 無新漂移。
- PR 完成 ChatGPT Audit。

滿足後可將 `Phase 2 Ready` 更新為 true；在此之前維持 false。
