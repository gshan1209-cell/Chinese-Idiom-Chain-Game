# CICG 交付與稽核報告索引

本目錄保存實作結果、驗證證據、Drive drift audit 與 readiness 判定。

規格、Implementation Plan 與報告分工：

```text
docs/superpowers/specs/    定義必須達成什麼
docs/superpowers/plans/    定義如何依 TDD 執行
docs/superpowers/reports/  記錄實際完成、證據與未解除阻擋
```

## Drive Asset Governance

依序閱讀：

```text
2026-08-06-drive-phase1-baseline-inventory.md
2026-08-07-drive-phase1-migration-report.md
2026-08-07-drive-phase2-readiness.md
```

- Baseline inventory 是歷史唯讀盤點，不代表目前 Drive 狀態。
- Phase 1 migration report 是最新實體搬移與 drift audit 摘要。
- Phase 2 readiness 必須逐項列出 Gate，不得在最新完整 repository verify 尚未通過時設為 true。

Machine-readable 真實狀態：

```text
data/drive-assets/drive-folders.json
data/drive-assets/idiom-card-assets.json
data/drive-assets/migrations/
data/drive-assets/physical-audit-2026-08-07.json
```

報告不得複製完整 Folder ID mapping；Folder Registry 是唯一 canonical source。
