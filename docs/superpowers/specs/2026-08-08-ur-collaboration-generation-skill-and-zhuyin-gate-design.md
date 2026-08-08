# UR 聯名卡產製技能與注音 Gate 規格

日期：2026-08-08  
狀態：Approved  
適用範圍：Chinese-Idiom-Chain-Game 的 UR 外部 IP 聯名成語卡

## 1. 目標

建立 Repository-local 技能，使使用者只需提供：

```text
IP 名稱
角色正式名稱
```

Agent 即可依現有 UR 標準，自動完成單張 UR 聯名成語卡的內容規劃、中央插畫產製、模板組裝與 Review 交付流程。

本規格同時建立永久注音 Gate，避免臺灣注音被圖片模型、字型替代或錯誤資料轉成平假名、片假名、羅馬拼音或近似假字。

## 2. 真實狀態與依賴

技能必須依序讀取：

1. `AGENTS.md`
2. `.agents/skills/generating-cicg-idiom-cards/SKILL.md`
3. `docs/card-prompts/state/current-batch.json`
4. `docs/superpowers/specs/2026-08-07-idiom-card-layout-lock-v2-6-1-design.md`
5. `docs/superpowers/specs/2026-08-08-ur-collaboration-card-standard-v1-0-design.md`
6. `docs/card-prompts/shared/ur-collaboration-master-prompt-v1.md`
7. `data/cards/theme-badge-registry.json`
8. `data/drive-assets/idiom-card-assets.json`
9. Card Catalog、卡號 Registry、Manifest 與 Drive 授權證據

真實狀態優先序沿用 Repository 規則，不得以聊天產圖或使用者口頭核准取代正式授權證據。

## 3. 觸發條件與最小輸入

符合下列任一情況時使用新技能：

- 使用者指定一個 IP 與一名角色，要求產生 UR 卡。
- 使用者要求繼續、修正、審核或重製某張 UR 聯名卡。
- 使用者說「幫這個角色做 UR 卡」且上下文已明確提供 IP 與角色名。

必填輸入只有：

```text
ipName: string
characterName: string
```

以下欄位可以由使用者指定；未指定時由技能自動決定：

- 四字成語
- 卡號或 Review 暫用識別
- 注音
- 資料層拼音
- 原始成語難度
- 九大主題類別
- 成語本義、典故與來源
- 精神短句與三欄箴言
- 角色場景、動作與特效

## 4. 自動決策流程

### 4.1 唯一性與內容選擇

技能先檢查 Card Catalog、卡號 Registry、Manifest 與 active batch，避免同一角色重複使用相同成語，並避免同批成語重複。

若使用者未指定成語，技能應從已啟用且可校訂的四字成語中選擇最符合角色核心特質者。判定依據依序為：

1. 角色可觀察的核心行動與價值。
2. 成語本義是否能被角色動作直接表現。
3. 成語來源與注音是否可驗證。
4. 是否與既有聯名卡重複。
5. 九大主題是否能由 Registry 正確解析。

不得只依角色戰力、畫面華麗度或人氣選擇成語。

### 4.2 UR 與授權狀態

- UR 只用於外部 IP 聯名。
- 有可稽核 `licenseEvidenceId` 時，才具備進入正式 Approved 流程的資格。
- 沒有授權證據時仍可產製 Draft／Review artwork 與 Review composite，但不得標記 Approved、發布、上架或加入正式卡池。
- 聊天中產生的圖片、官方作品名稱或使用者口頭允許都不是授權證據。

### 4.3 難度與聯名標籤

- 原始成語難度仍須依正式成語資料決定並保存在資料層。
- UR 卡面不顯示難度徽章。
- v2.6.1 的 difficulty Bounding Box 改放該 IP 專屬、版本化聯名標籤。
- 聯名標籤只顯示 IP 名稱與角色正式名稱。
- 每個 IP 必須有獨立的標籤母件，不得只在通用標籤上換字冒充專屬設計。

## 5. 產圖與組裝

### 5.1 中央插畫

圖片模型只能逐張生成：

```text
1024 × 1200 px
人物＋背景＋情境＋道具＋角色特效
無文字
無卡框
無 UR 徽章
無聯名標籤
無主題徽章
無典故、箴言、來源、Logo 或浮水印
```

使用者已明確要求產圖時，技能必須使用可用的圖片生成工具實際產生 artwork，不得只回傳文字 Prompt 代替圖片。

### 5.2 完整卡面

完整卡面只能由 Renderer 使用已核准元件與結構化資料組成：

```text
Canvas       1024 × 2000
Header       360 px
Main Artwork 1200 px
Footer       440 px
Geometry     ±2 px
```

若 Renderer 或必要 Approved 元件不可用，技能只能完成 artwork 並把 `compositionStatus` 設為 `pending` 或 `blocked`；不得改用圖片模型直接重畫完整卡面。

## 6. 永久注音 Gate

### 6.1 資料結構

- 四字成語必須恰好有四筆注音。
- 四筆注音必須與四個漢字逐字對齊。
- 每筆必須是非空字串。
- 注音只能從已校訂的結構化成語資料讀取；Agent 不得臨場猜測後直接標記 Approved。

### 6.2 允許字元

每筆注音只允許：

- Unicode Bopomofo：`U+3105–U+312F`
- 輕聲：`U+02D9`
- 二聲：`U+02CA`
- 三聲：`U+02C7`
- 四聲：`U+02CB`

卡面不得顯示漢語拼音。拼音可留在資料層供搜尋或語音功能使用。

### 6.3 明確禁止

注音欄出現以下任一內容即為 Blocking failure：

- 平假名：`U+3040–U+309F`
- 片假名：`U+30A0–U+30FF`
- 片假名擴充：`U+31F0–U+31FF`
- 半形片假名：`U+FF65–U+FF9F`
- 拉丁字母、漢語拼音、羅馬拼音
- 漢字、日文漢字讀音、日文音節
- 圖片模型產生的近似注音假字、裝飾符號或亂碼

### 6.4 Renderer Gate

- 圖片模型不得生成主標題、注音或任何正式文字。
- Renderer 必須直接使用已通過驗證的 `bopomofo[4]` 文字節點。
- Render plan 或 SVG 文字節點必須能追溯至結構化資料，不接受烙在 artwork 裡的文字。
- 正式字型必須覆蓋全部注音字元；缺字、方框、fallback 成日文字型或無法確認時停止輸出。
- PNG 視覺複核是補充 Gate，不得取代資料與 Render Plan 驗證。

### 6.5 失敗狀態

任一注音 Gate 失敗時：

```text
artworkStatus      可維持既有狀態
compositionStatus  changes-requested 或 blocked
approvalStatus     不得為 Approved
```

必須記錄 finding code；日文假名使用專屬 code：

```text
japanese-kana-in-bopomofo
```

其他非注音字元沿用：

```text
invalid-bopomofo
```

## 7. 技能輸出

技能每次至少回報：

- IP 與角色名
- 選定成語與選擇理由
- 四筆注音及 Gate 結果
- 資料層原始難度
- UR 與授權狀態
- 主題類別與 Asset ID
- 聯名標籤 Asset ID／狀態
- artwork／composition 狀態與實際尺寸
- Drive File ID 與 SHA-256（只有實際取得時）
- Manifest／state commit
- Blocking findings 與下一步

## 8. 測試與永久 Gate

新增或更新測試，至少驗證：

1. 平假名注音被 `japanese-kana-in-bopomofo` 阻擋。
2. 片假名注音被同一 finding 阻擋。
3. 混合注音＋日文假名仍被阻擋。
4. 正確四筆臺灣注音維持通過。
5. 新技能只需 IP 與角色名即可啟動自動內容準備。
6. 新技能明確禁止圖片模型生成注音與完整卡面。
7. UR 無授權時只能 Review。
8. 新技能、既有圖卡技能、UR 母提示語與 AGENTS 入口一致。

## 9. 非目標

本規格不：

- 宣稱任何外部 IP 已取得授權。
- 自動建立或偽造授權證據。
- 改變 `cicg-progress` 或 `cicg-card-collection` Schema。
- 將 UR 加入一般十關里程碑免費卡池。
- 允許圖片模型直接生成 canonical 完整卡面。
