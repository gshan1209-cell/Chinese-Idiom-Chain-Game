# 成語圖卡資產註冊技能設計

**狀態：** Approved
**日期：** 2026-08-08
**範圍：** 成語圖卡完成後的 Drive 上傳與 GitHub 註冊

## 目標

把原本分散的「檢查、命名、上傳、取回 Drive ID、寫入資產紀錄、回報」收斂成一個技能入口，使用者只需核准一次。

## 單一路徑

1. 讀取 GitHub `main` 的卡牌規格、Registry、Manifest 與狀態。
2. 檢查本機圖檔：存在、PNG、尺寸、SHA-256、檔案大小。
3. 判定生命週期：
   - 一般卡可依既有核准流程登記。
   - UR 無 `licenseEvidenceId` 時只能登記為 `approved-design-reference` 或 `review`，不得占用正式 `UR-####`。
4. 依規範命名後上傳至 Drive 指定資料夾。
5. 以 Drive 回傳的真實 `driveFileId`、連結、尺寸、雜湊建立單一註冊紀錄。
6. 回報完成項目與仍受阻項目；不得把聊天核准當成正式 IP 授權。

## 最小資料模型

每張資產只保留下列必要欄位：

```json
{
  "assetId": "string",
  "status": "review | approved-design-reference | approved",
  "filename": "string",
  "driveFileId": "string",
  "webViewLink": "string",
  "mimeType": "image/png",
  "sizeBytes": 0,
  "sha256": "64-char lowercase hex",
  "widthPx": 0,
  "heightPx": 0,
  "idiom": "string",
  "rarity": "UR",
  "ipName": "string",
  "characterTitle": "string",
  "characterName": "string",
  "themeCategory": "string",
  "licenseEvidenceId": null,
  "publicationStatus": "not-approved-for-publication"
}
```

## 簡化原則

- 不重複建立 PR、Issue 或多份狀態檔。
- 不先寫假的 Drive ID、SHA-256 或正式卡號。
- 同一 SHA-256 已存在時停止重複上傳並回報既有紀錄。
- 完整提示語與圖片放在同一 Drive 資料夾。
- 登記紀錄集中於一份對應資產清單；只有正式授權 UR 才更新 `card-number-registry.json`。

## 本次胡蝶忍 UR 處理

- 成語：綿裡藏針
- IP：鬼滅之刃
- 角色：蝶柱－胡蝶忍
- 主題：智謀
- 圖檔：`/mnt/data/imagegen.png`
- 實際尺寸：897 × 1752
- SHA-256：`63aadecb7903e4946b6437558f59245caad2399ef8553f3f3780e226ca5a0752`
- 授權證據：無
- 登記狀態：`approved-design-reference`
- 發布狀態：`not-approved-for-publication`
- 正式 UR 卡號：不配置

## 驗收

完成時必須同時具備：

- Drive 圖片 File ID
- Drive 完整提示語 File ID
- GitHub 註冊紀錄
- 技能文件
- 檔案尺寸、大小與 SHA-256
- 明確的授權與發布狀態
