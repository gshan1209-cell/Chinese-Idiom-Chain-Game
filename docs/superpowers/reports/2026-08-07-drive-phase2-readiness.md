# Drive Phase 2 Readiness

日期：2026-08-07  
判定：**Phase 2 Ready = true**

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

最終判定：

| Gate | 結果 | 證據 |
|---|---|---|
| Blocking drift | 0 / PASS | Live Drive scan 與 Registries 一致 |
| Duplicate current Approved | 0 / PASS | 只有四張 current Approved rarity frames |
| Unverified applied migrations | 0 / PASS | Batch 1、Batch 2 全部 verified |
| Missing rollback snapshots | 0 / PASS | 每個 mutation entry 皆有 rollback snapshot |
| Unregistered files in Approved | 0 / PASS | 9 個 Approved leaf folders 已全部掃描 |
| Latest full repository verify | **PASS** | GitHub Actions CI #400，run `31138472337`，PR merge ref `a217771a2de7982efe28333a520874b309aa295e` |

因此：

```text
Phase 2 Ready = true
Blocking reason = none
```

Phase 2 可以進入「全專案 read-only inventory 與規格規劃」。這個判定不授權直接大量搬移；每一個後續 mutation batch 仍須具備 Registry、Migration Ledger、rollback snapshot 與批次驗證。

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
- CLI 交叉驗證 Asset status、`currentApproved` 與 Folder lifecycle role。
- Validator 對 malformed raw JSON 回傳可稽核 issue，不因 TypeError 中斷整體 Gate。

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

## 6. 解除阻擋證據

GitHub Actions CI #400 已在 Node.js 22.16.0 執行：

```text
Drive governance：PASS，folders=60 assets=9 migrations=3
全部測試：339 passed，0 failed
Card tests：100 / 100
Puzzle tests：37 / 37
Trap tests：95 / 95
TypeScript strict：PASS
ESLint：PASS
Vite production build：PASS
PWA precache：12 entries（403.12 KiB）
npm audit：419 packages，0 vulnerabilities
```

合併前仍須對本報告更新後的最終 PR head 再執行一次完整 CI，並確認：

- `behind_by = 0`。
- 未解決 review threads = 0。
- Live Drive metadata 與 physical audit snapshot 無新漂移。
- ChatGPT Audit 無 Critical／Important findings。

以上全部成立後，PR #35 才可 Squash Merge。
