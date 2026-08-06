# Chinese-Idiom-Chain-Game 成語圖卡產製專案提示語

版本：v2.7  
用途：貼入新的 ChatGPT／Agent 對話，接續產製成語圖卡素材  
Repository：`gshan1209-cell/Chinese-Idiom-Chain-Game`  
Google Drive：`04_Products/Chinese-Idiom-Chain-Game`

---

## 1. 任務定位

請延續既有 Chinese-Idiom-Chain-Game 成語圖卡素材庫，不要重新設計卡牌系統，也不要依賴舊聊天內容直接產圖。

本任務只負責：

- 讀取最新 GitHub 圖卡規格與提示語
- 校對單張圖卡企劃資料
- 使用最新核准版型產製 Review 圖片
- 將原始圖片逐檔上傳至 Google Drive `80_Inbox`
- 更新 GitHub 圖卡 Manifest、狀態與審核紀錄

不得順便修改主玩法、關卡、進度 Schema、商店、付款或其他 production code。

---

## 2. 每次產圖前必做

先取得 GitHub 最新 `main`：

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git status
git log --oneline -10
```

檢查 Open PR、Issue 與 GitHub Actions，確認是否有比目前提示語更新且已核准的圖卡規格。

接著依序讀取：

```text
1. AGENTS.md
2. .agents/skills/generating-cicg-idiom-cards/SKILL.md
3. docs/card-prompts/state/current-batch.json
4. docs/superpowers/specs/README.md
5. docs/superpowers/specs/2026-08-06-idiom-card-rarity-standard-design.md
6. docs/superpowers/specs/2026-08-06-idiom-card-review-governance-design.md
7. docs/superpowers/specs/2026-08-06-card-template-v2.1-layout-amendment.md
8. docs/superpowers/specs/2026-08-06-card-template-v2.6-dimension-and-pronunciation-amendment.md
9. docs/superpowers/specs/2026-08-06-card-template-v2.7-ssr-badge-amendment.md
10. docs/card-prompts/shared/card-master-prompt.md
11. docs/card-prompts/shared/negative-constraints.md
12. docs/card-prompts/templates/ 對應稀有度模板
13. docs/card-prompts/idioms/ 對應成語單卡提示語
14. docs/card-prompts/manifest.md
15. Drive 最新 Approved 標準模板與 Review 素材
```

v2.1 保留為歷史版面基礎；v2.6 覆寫尺寸、比例、注音位置與禁止羅馬拼音條款；v2.7 只覆寫 SSR 左上稀有度徽章的正式視覺標準。

---

## 3. 真實規範優先序

```text
GitHub 最新 main
→ 最新 Approved 規格與規格索引
→ v2.7 SSR 徽章增補（SSR 圖卡適用）
→ v2.6 尺寸與發音版面增補
→ 稀有度與審核治理規格
→ Repository-local skill 與批次狀態
→ v2.1 歷史版面增補
→ 共用母提示語與負面限制
→ 單張成語提示語
→ Drive Approved 標準模板
→ Manifest 與審核紀錄
→ 聊天紀錄、舊 Prompt、舊圖片
```

舊圖片只能作為構圖參考，不能反向覆寫最新文字規格。

---

## 4. 正式版型 Gate

每張正式或送審圖卡必須符合：

```text
畫布：1024 × 2000 px
上方資訊區：y = 0–359，高度 360 px
中央主圖區：y = 360–1559，高度 1200 px
下方內容區：y = 1560–1999，高度 440 px
格式：PNG
```

固定結構：

1. 高質感韓日動漫遊戲卡牌風格，但不得複製其他作品。
2. 左上只顯示稀有度徽章：`N / R / SR / SSR`。
3. 上方中央顯示四字繁體中文成語。
4. 主標正下方第一列顯示四組逐字對齊注音。
5. 注音正下方第二列顯示小寫、帶聲調符號的漢語拼音。
6. 禁止數字聲調，例如 `yu2 gong1 yi2 shan1`。
7. 拼音下方顯示一句精簡白話副標。
8. 右上只顯示「難易度」與 `E / D / C / B / A / S`。
9. 中央主插圖固定高度 `1200 px`，且占卡面最大視覺面積。
10. 主插圖至少一名人物，以動作、表情、道具與環境直接表達成語。
11. 左下保留主題徽章，包含固定圖示、固定底色及完整繁體中文類別名稱。
12. 下方故事區標題只使用「典故」，不得出現「典故說明」。
13. 右下卡牌箴言使用低高度、貼合文字的窄版深色金框直式牌匾。
14. 箴言由右至左分欄閱讀，通常三句，每句約四至六字並保留標點。
15. 最下方使用極小單行文字標示典故來源。

典故來源格式：

```text
典故來源：朝代・作者《典籍名稱・卷次》
```

### SSR v2.7 專用徽章 Gate

當 `rarity === 'SSR'` 時：

- 左上必須使用傳奇級虹彩金龍徽章。
- 完整金龍環抱大型立體金色 `SSR` 字樣。
- 徽章核心使用紫、藍、洋紅星雲寶石光。
- 下端固定紫色菱形主寶石。
- 與 SR 必須在輪廓、材質、光效與主寶石上明顯不同。
- 只改字母、亮度或飽和度視為 Blocking failure。
- SSR 虹彩只限左上徽章，不得全面染色外框、難易度框、主圖、典故區、主題徽章或箴言牌匾。
- N／R／SR 不得套用 SSR v2.7 徽章。

目前核准 SSR 標準模板：

```text
CICG_CardTemplate_Rarity_SSR_v2.7_Approved.png
Drive File ID：1NoNZ2muThkzA7k22TF5W5foAD1gq8VpV
尺寸：1024 × 2000 px
上方資訊區：360 px
中央主圖區：1200 px
下方內容區：440 px
檔案大小：3,427,910 bytes
SHA-256：cf8f8cb9c6f3cac5f4a115bcbcf53fb57162842dcf34e48173b84f902dcbf785
```

---

## 5. 稀有度與難易度

### 難易度

難易度依成語普及度與理解門檻判定：

```text
E → D → C → B → A → S
```

### 稀有度

稀有度與難易度完全分離。

`N～SSR` 主要依：

- 成語的正面意義
- 激勵強度
- 人格力量
- 精神象徵
- 玩家共鳴
- 收藏定位

不得以成語艱深度、知名度、人物強弱、特效數量或畫面華麗程度直接決定稀有度。v2.7 SSR 徽章是已核准稀有度的視覺呈現，不能反向決定成語是否屬於 SSR。

`UR` 只保留給取得正式授權的外部 IP 聯名隱藏版本。未取得可稽核的授權文件前，不得產生 UR 卡或使用聯名角色、品牌名稱、Logo、可識別服裝、武器或官方視覺元素。

---

## 6. 產圖前內容表

每張圖卡產圖前必須整理：

```text
成語：
逐字注音：
漢語拼音：
白話副標：
難易度：
稀有度：
稀有度判定理由：
主題類別：
主題徽章圖示與固定底色：
典故摘要：
典故來源：
來源狀態：Verified / NeedsReview
卡牌箴言：
人物設定：
人物動作：
場景與時代：
關鍵道具：
圖片狀態：Review
```

要求：

- 注音與拼音都必須完成校對。
- 拼音使用小寫與聲調符號；不得使用數字聲調。
- SSR 必須額外確認 v2.7 徽章是否通過視覺 Gate。
- 來源、注音、拼音或稀有度尚未完成正式校訂時，標記 `NeedsReview`。
- `NeedsReview` 卡可以產製 Review 草稿，但不得宣稱 Approved、Verified 或可進正式卡池。
- 原創箴言不得冒充古籍原文。
- 傳說、寓言、後世記載與史實必須清楚區分。

---

## 7. 圖像設計要求

- 人物不是裝飾，必須參與成語事件。
- 不得只畫正面站立肖像。
- 場景、動作、表情與道具必須讓玩家不看長文也能聯想到成語。
- 人物性別、年齡、服裝與時代依典故及構圖需求安排。
- 批次產圖不得長期全部使用同一性別、同一臉型或同一姿勢。
- 歷史題材的服飾、建築與道具不得明顯跨時代。
- 外框、難易度框、典故區、主題徽章與箴言牌匾不隨稀有度改色。
- 稀有度只影響左上徽章內的文字、底色、材質及局部光效：

```text
N：灰鐵、低彩度基礎徽章
R：藍銀、清晰寶石光徽章
SR：紫金、高級圓章或龍紋徽章
SSR：v2.7 傳奇級虹彩金龍、立體金字、星雲核心與紫色主寶石
```

---

## 8. 產圖方式

1. 先讀取最新規格與對應單卡提示語。
2. 完成內容表與 Gate 檢查。
3. 無來源、授權或成語內容阻塞問題時，直接使用可用的圖片生成工具產圖。
4. 圖片生成後以程式或影像工具驗證實際尺寸，不得只相信提示語。
5. 中央主圖區必須實際固定為 `1200 px`。
6. SSR 圖卡須逐張檢查 v2.7 徽章與 SR 的視覺區隔。
7. 每張圖卡使用專屬人物、動作與場景，不得只替換標題重複同一畫面。
8. 生成工具若造成繁體文字、注音、拼音、座標、SSR 徽章或版面錯誤，只能列為 `Changes Requested`。

---

## 9. 產圖後審核清單

### 尺寸與座標

- [ ] 整張圖片恰為 `1024 × 2000 px`
- [ ] 上方資訊區恰為 `360 px`
- [ ] 中央主圖區恰為 `1200 px`
- [ ] 下方內容區恰為 `440 px`

### 文字

- [ ] 四字成語完全正確且為繁體中文
- [ ] 主標下方第一列為正確、逐字對齊注音
- [ ] 注音下方第二列為小寫、帶聲調漢語拼音
- [ ] 沒有數字聲調或缺少聲調符號
- [ ] 副標正確且簡潔
- [ ] 右上只顯示難易度，不得出現「人氣」
- [ ] 典故區只標「典故」
- [ ] 箴言是直式、由右至左、牌匾高度貼合文字
- [ ] 典故來源位於最下方單行

### SSR v2.7 徽章

SSR 圖卡額外檢查：

- [ ] 傳奇級虹彩金龍徽章存在
- [ ] 立體金色 SSR、星雲核心與紫色菱形主寶石完整
- [ ] 與 SR 在輪廓、材質、光效與主寶石上明顯不同
- [ ] 未遮擋主標、注音、拼音或副標
- [ ] 虹彩沒有污染其他卡面區塊

### 圖像與權利

- [ ] 至少一名人物參與情境
- [ ] 人物動作與成語一致
- [ ] 沒有多餘肢體、手部畸形或臉部異常
- [ ] 沒有與典故矛盾的時代元素
- [ ] 沒有第三方 Logo、浮水印或未授權 IP 元素
- [ ] 主圖是最大視覺區域

未通過任一 Blocking Gate，不得命名為 Approved。

---

## 10. 檔名與 Drive 流程

N／R／SR Review 圖片使用其最新核准版本；SSR 自 v2.7 起使用：

```text
CICG_IdiomCard_<成語>_SSR_<難易度>_v2.7_Review.png
```

SSR 核准圖片：

```text
CICG_IdiomCard_<成語>_SSR_<難易度>_v2.7_Approved.png
```

Drive 流程：

```text
新產原始 PNG
→ 80_Inbox
→ 內容／視覺／授權審核
→ Approved 正式資料夾
→ 舊版移入 90_Archive
```

- 圖片必須逐檔上傳，不得以 ZIP、RAR 或 7z 取代原圖。
- 不得直接覆蓋已發布版本。
- 上傳後更新 `manifest.md` 的 Drive URL、版本、圖片狀態與來源狀態。

---

## 11. 禁止事項

- 禁止使用舊聊天提示語覆寫最新 GitHub 規格。
- 禁止輸出 `1024 × 1536` 或 `2:3` 並宣稱符合目前標準。
- 禁止省略注音橫列或漢語拼音橫列。
- 禁止使用數字聲調或省略正式拼音聲調符號。
- 禁止把「典故」改成「典故說明」。
- 禁止取消左下主題徽章。
- 禁止將箴言改成橫式長段落。
- 禁止把箴言牌匾拉高留下大面積空白。
- 禁止只因美術豪華而提升稀有度。
- 禁止新產 SSR 沿用 SR 類似徽章，或只調亮度、飽和度及文字。
- 禁止把 SSR 虹彩色系套用到整張卡面。
- 禁止 N／R／SR 使用 v2.7 SSR 傳奇金龍徽章。
- 禁止未授權使用外部 IP。
- 禁止複製參考遊戲的角色、卡面、美術、文案、關卡或商店素材。
- 禁止把 `NeedsReview` 圖卡描述為正式核准素材。

---

## 12. 完成回報

每批完成後回報：

- 完成張數與成語清單
- 各卡稀有度與難易度
- 實際圖片尺寸與中央主圖高度
- 注音與拼音校訂狀態
- SSR v2.7 徽章審核狀態（適用時）
- 來源與稀有度的 Verified／NeedsReview 狀態
- 圖片檔名
- Drive 上傳位置與 File ID
- Manifest 是否更新
- 審核結果與待修正項目

若沒有完成 Drive 上傳或 Manifest 更新，必須明確說明，不得宣稱整批已完成。
