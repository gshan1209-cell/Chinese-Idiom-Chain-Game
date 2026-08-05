# 第一章關卡成語全域不重複交付報告

## 交付資訊

- Repository：`gshan1209-cell/Chinese-Idiom-Chain-Game`
- Branch：`feat/chapter-one-unique-idioms`
- Pull Request：#6
- 日期：2026-08-06

## 完成內容

- 將開發示範題庫由 37 筆擴充為 70 筆已啟用四字繁體中文成語。
- 第一章維持 20 關與 61 個 placement。
- 61 個 placement 使用 61 個不同 `idiomId`。
- 61 個 placement 使用 61 個不同成語文字。
- 保留 `idiom-0062`～`idiom-0070` 共 9 筆未配置成語，供後續校訂或替換。
- 維持關卡 ID、關卡編號、難度梯度、星級、解鎖與 IndexedDB 進度 schema。
- 未修改 React、CSS、智慧跳格、自由接龍、打地鼠、PWA 設定或套件依賴。

## 永久驗證 Gate

`tests/puzzle-levels.test.mjs` 現在固定驗證：

- 第一章恰好 20 關。
- 第一章恰好 61 個 placement。
- 61 個 `idiomId` 全部唯一。
- 61 個成語文字全部唯一。
- 每個關卡成語都存在於已啟用的 `data/idioms.source.csv` 條目，且 ID 與文字一致。
- 所有關卡盤面可建立、交叉字一致，並可由候選字完整解答。

## TDD 紀錄

### RED

提交唯一性測試後，GitHub Actions CI Run #78 如預期失敗：

```text
chapter one repeats an idiomId
37 !== 61
```

此結果證明原第一章確實跨關重複使用成語。

### GREEN

完成題庫擴充與關卡重排後：

- 61 個 placement 全部唯一。
- 來源字典一致性測試通過。
- 20 關全部可建立並可完成。

第一次完整 Gate 的功能與測試皆通過，但 ESLint 指出測試檔使用未宣告的全域 `URL`。修正為從 `node:url` 明確匯入後，CI Run #84 完整成功。

## 最終驗證

GitHub Actions CI Run #84：成功。

- `build:data`：70 筆，checksum 前綴 `1601ec3c7424`
- 完整 Node 測試：105 項通過、0 失敗
- Puzzle 測試：37 項通過、0 失敗
- TypeScript strict typecheck：通過
- ESLint：通過
- Vite production build：通過
- PWA Service Worker：建置成功
- npm audit：0 vulnerabilities

## 相容性

- 玩家既有進度 key 保持 `chapter-1`。
- 關卡 ID `level-001`～`level-020` 不變。
- 不需要資料遷移或進度重設。
- 玩家已解鎖的關卡與星級紀錄可繼續使用；各關題目內容更新為不重複配置。
