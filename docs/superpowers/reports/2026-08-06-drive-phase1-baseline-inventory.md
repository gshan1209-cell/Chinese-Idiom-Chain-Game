# Drive Phase 1 Baseline Inventory

盤點日期：2026-08-06  
文件角色：**歷史 baseline snapshot**

本文件記錄 Drive governance 實作前的唯讀基線，不代表目前實體狀態。

## Baseline 結果

初次盤點確認：

- 22 個真實 Drive folders 已可識別。
- Phase 1 的 43 個 required folder keys 中，當時缺少 39 個。
- 四張 N／R／SR／SSR rarity frame masters 具 GitHub PR #32 核准證據及相符 SHA-256。
- 其他檔名即使包含 `Approved`，仍缺乏足以直接升格的 Registry／checksum／approval evidence。
- 當時沒有任何 Drive migration entries，Drive 保持唯讀。

## 後續狀態

此 baseline 之後已完成：

- 43／43 required folder keys。
- 60-folder Registry。
- Batch 1：四張 Approved rarity frames move-and-rename。
- Batch 2：Difficulty Review、v2.6 Review 與 Legacy／v2.7 Inbox 隔離。
- 9-asset Registry。
- Physical drift audit。

目前狀態不得從本文件推斷，必須讀取：

```text
data/drive-assets/drive-folders.json
data/drive-assets/idiom-card-assets.json
data/drive-assets/migrations/
data/drive-assets/physical-audit-2026-08-07.json
docs/superpowers/reports/2026-08-07-drive-phase1-migration-report.md
docs/superpowers/reports/2026-08-07-drive-phase2-readiness.md
```

Folder ID、File ID、asset status 與 migration status 以上述 machine-readable Registries／Ledgers 為準。
