# ChatGPT Audit：全專案四碼稀有度卡號

## Audit 狀態

```text
Verdict: PASS
Date: 2026-08-08
Pull Request: #45
Branch: feat/project-wide-four-digit-card-numbers
Audited implementation head: 3c26aef53b5a5e09f6e8601b820536a14580ce68
```

本 Audit 檢查全專案卡號 Registry、Schema、第一章遷移、提示語、Agent 技能、UR 授權 Gate 與永久測試。Audit 文件本身加入後，仍須以最新 HEAD GitHub Actions 成功作為最終合併 Gate。

## 核准需求對照

| 需求 | 結果 | 證據 |
|---|---|---|
| 數字固定四碼 | PASS | 格式 `{rarity}-{sequence:0000}`；Schema pattern `^(N|R|SR|SSR|UR)-[0-9]{4}$` |
| 每個稀有度獨立流水 | PASS | N、R、SR、SSR、UR 各自維護 `assignedCount` 與 `nextSequence` |
| 全專案跨章節累加 | PASS | scope 固定為 `project-wide-per-rarity`，章節不得重設序列 |
| 既有第一章序號不洗牌 | PASS | 61 張卡只增加前導零，稀有度、數值與 catalogOrder 不變 |
| 正式號碼不可變更或回收 | PASS | `immutableAfterAssignment=true`、`reuseRetiredNumbers=false` |
| 卡面最下方中央顯示卡號 | PASS | Renderer 固定加入唯一 `bottom-center card-number-plaque = {{CARD_NUMBER}}` |
| 圖片模型不得生成卡號 | PASS | 一般卡與 UR 母提示語、兩套技能皆明確禁止 |
| UR 正式號碼受授權 Gate 保護 | PASS | 無可稽核正式授權 `licenseEvidenceId` 時不得指派 `UR-####` |
| 不修改主玩法或進度 Schema | PASS | Diff 僅涉及卡號資料、文件、技能與測試；IndexedDB 與遊戲規則未修改 |

## Canonical Registry Audit

正式指派來源：

```text
data/cards/card-number-registry.json
data/cards/card-number-registry.schema.json
```

Canonical Registry 已包含五個獨立命名空間：

```text
N-0001
R-0001
SR-0001
SSR-0001
UR-0001
```

目前正式指派統計與下一號：

| 稀有度 | 已指派 | 下一號 |
|---|---:|---|
| N | 12 | N-0013 |
| R | 18 | R-0019 |
| SR | 23 | SR-0024 |
| SSR | 8 | SSR-0009 |
| UR | 0 | UR-0001（僅限授權 Gate 通過後） |

Audit 確認：

- 61 個正式卡號均符合四碼格式。
- 卡號前綴與 `rarity` 相符。
- `cardNumber` 等於 `{rarity}-${sequence.padStart(4, '0')}`。
- 全專案沒有重複卡號。
- 同一 active 卡片沒有多個 active 卡號。
- UR 目前沒有占用正式號碼。

## 第一章相容投影 Audit

相容投影：

```text
data/cards/chapter-1-card-number-registry.json
data/cards/chapter-1-card-number-registry.schema.json
```

投影已升級至 schemaVersion 2，並指向 Canonical Registry。永久測試逐欄比對 Canonical Registry 的 `chapter-1` 子集合，確認 61 張卡完全一致。

代表性遷移：

```text
N-001   → N-0001
R-018   → R-0018
SR-023  → SR-0023
SSR-008 → SSR-0008
```

沒有變更原序號數值、稀有度、成語、`idiomId` 或 `catalogOrder`。

## 卡面與提示語 Audit

一般卡與 UR 卡皆固定：

```text
bottom-center card-number-plaque = {{CARD_NUMBER}}
```

v2.6.1 Footer 外框未改變，原 source-line 外框仍為：

```text
x=178–846, y=1936–1986
```

內部分割為：

```text
source-line          x=178–398, y=1936–1986
card-number-plaque   x=410–614, y=1936–1986
```

Audit 確認：

- 卡面只允許一個 canonical 卡號牌匾。
- 牌匾只顯示 Registry 四碼卡號。
- 不得顯示角色名、IP、難度、版本或第二組卡號。
- 圖片模型仍只生成無文字中央插畫。
- Renderer 讀取結構化 `cardNumber`，不得 OCR、猜測或重畫。
- UR 母提示語原本「不得顯示額外卡號」的矛盾已改為「只允許一個 canonical 卡號牌匾」。

## UR 授權 Gate Audit

UR 規則確認：

- UR 序列為全專案獨立四碼序列。
- 新 IP、角色、章節、批次或版本都不得將 UR 序列歸零。
- 沒有可稽核正式授權 `licenseEvidenceId` 時，只能使用不占號的 Review 識別碼。
- 聊天批准、生成圖片、公開角色圖片或 IP 名稱都不是授權證據。
- 未授權 Review 不得冒用 `UR-0001`，也不得標記 Approved、發布或進入正式卡池。

## TDD 證據

### RED：CI #497

只提交規格、計畫與失敗測試，預期暴露既有缺口：

```text
Card tests: 109
Pass: 106
Fail: 3
```

失敗原因：

1. Canonical project Registry 尚不存在。
2. 第一章仍為三碼、章節內 scope。
3. 提示語尚未要求 bottom-center card-number-plaque。

### 中繼驗證：CI #508

最小實作後剩餘兩個文字契約缺口：

```text
Card tests: 109
Pass: 107
Fail: 2
```

失敗原因：

1. 設計規格缺少固定英文元件名稱 `card-number-plaque`。
2. UR 技能授權句沒有保留舊 Gate 所需的「授權」字樣。

兩處均以最小文件修正完成，沒有改變資料或架構。

### GREEN：CI #510

Audited implementation head：

```text
3c26aef53b5a5e09f6e8601b820536a14580ce68
```

驗證結果：

```text
Node tests:       360 / 360
Card tests:       109 / 109
Puzzle tests:      37 / 37
Card Catalog:       8 / 8
Theme badges:       4 / 4
TypeScript strict: PASS
ESLint:            PASS
Vite build:        PASS
PWA build:         PASS
PWA precache:      12 entries / 403.40 KiB
npm audit:         0 vulnerabilities
```

## 變更邊界

本 PR：

- 沒有新增或搬移 Drive 圖像素材。
- 沒有重製任何卡片圖片。
- 沒有修改第一章關卡、成語 placement 或智慧跳格。
- 沒有修改自由接龍或打地鼠。
- 沒有修改 `cicg-progress`、Database Version 或 IndexedDB Schema。
- 沒有建立正式 UR 授權紀錄或占用 UR 號碼。

## 最終判定

規格、資料、Schema、相容投影、提示語、技能、授權 Gate 與永久測試互相一致，核准需求均已實作。

```text
ChatGPT Audit: PASS
Blocking findings: 0
Final merge gate: latest audit HEAD CI must be success
```