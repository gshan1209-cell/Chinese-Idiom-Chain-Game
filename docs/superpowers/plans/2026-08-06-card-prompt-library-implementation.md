# 成語圖卡提示語素材庫 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立 22 張既有成語圖卡、4 張稀有度模板的獨立提示語文件、共用母提示語、負面限制、總索引，以及與 Google Drive 素材備份的可追蹤對照。

**Architecture:** GitHub 僅保存 Markdown 文字資產與 Drive 連結；Google Drive 保存 PNG 圖片。所有單卡提示語引用同一份母提示語與負面限制，差異集中在成語資料、角色、構圖、徽章與卡面文案。Manifest 作為唯一索引，記錄提示語路徑、Drive URL、素材狀態與典故校訂狀態。

**Tech Stack:** Markdown、GitHub Contents API、Google Drive、Shell 驗證命令。

## Global Constraints

- 卡片比例固定為直式 `2:3`。
- 使用高質感韓日動漫遊戲卡牌風格，但不得複製參考遊戲的美術、文案、關卡或商店素材。
- 卡面只使用繁體中文。
- 外框固定使用同系列深色金框，不隨 `N / R / SR / SSR` 改色。
- 稀有度只影響左上「稀有度徽章」的文字、底色、材質與局部光效。
- 稀有度徽章：`N 灰鐵`、`R 藍色`、`SR 紫金`、`SSR 虹彩金`；SSR 字樣可使用較強筆觸感。
- 右上只顯示「難易度」與 `E / D / C / B / A / S` 字母，不得顯示「人氣」。
- 左下主題徽章使用固定類別圖示、底色與名稱，不受稀有度影響。
- 主題徽章下方必須顯示完整類別名稱。
- 右下使用窄版深色金框直式箴言牌匾，由右至左閱讀，原則上三句。
- 典故來源固定格式：`典故來源：朝代・作者《典籍名稱・卷次》`。
- 尚未完成正式來源校訂者標示 `NeedsReview`，不得宣稱已完成授權或典故校訂。
- 本階段不修改遊戲程式、資料 schema，不重新產製 22 張正式成語圖卡，也不把圖片二進位檔提交至 GitHub。

---

## File Map

### Shared rules

- Create: `docs/card-prompts/README.md` — 使用方式、目錄結構、版本與審核流程。
- Create: `docs/card-prompts/shared/card-master-prompt.md` — 所有圖卡共用的固定產圖規則。
- Create: `docs/card-prompts/shared/negative-constraints.md` — 所有圖卡共用的禁止項目。

### Template prompts

- Create: `docs/card-prompts/templates/CICG_CardTemplate_Rarity_N_v2.1_Prompt.md`
- Create: `docs/card-prompts/templates/CICG_CardTemplate_Rarity_R_v2.1_Prompt.md`
- Create: `docs/card-prompts/templates/CICG_CardTemplate_Rarity_SR_v2.1_Prompt.md`
- Create: `docs/card-prompts/templates/CICG_CardTemplate_Rarity_SSR_v2.1_Prompt.md`

### Idiom prompts

Create exactly these 22 files:

1. `docs/card-prompts/idioms/CICG_IdiomCard_畫龍點睛_SSR_A_v2.1_Prompt.md`
2. `docs/card-prompts/idioms/CICG_IdiomCard_胸有成竹_SR_B_v2.1_Prompt.md`
3. `docs/card-prompts/idioms/CICG_IdiomCard_守株待兔_R_D_v2.1_Prompt.md`
4. `docs/card-prompts/idioms/CICG_IdiomCard_畫蛇添足_SR_C_v2.1_Prompt.md`
5. `docs/card-prompts/idioms/CICG_IdiomCard_掩耳盜鈴_R_C_v2.1_Prompt.md`
6. `docs/card-prompts/idioms/CICG_IdiomCard_刻舟求劍_R_C_v2.1_Prompt.md`
7. `docs/card-prompts/idioms/CICG_IdiomCard_亡羊補牢_SR_D_v2.1_Prompt.md`
8. `docs/card-prompts/idioms/CICG_IdiomCard_對牛彈琴_R_D_v2.1_Prompt.md`
9. `docs/card-prompts/idioms/CICG_IdiomCard_井底之蛙_SR_C_v2.1_Prompt.md`
10. `docs/card-prompts/idioms/CICG_IdiomCard_葉公好龍_SR_B_v2.1_Prompt.md`
11. `docs/card-prompts/idioms/CICG_IdiomCard_愚公移山_SSR_B_v2.1_Prompt.md`
12. `docs/card-prompts/idioms/CICG_IdiomCard_破釜沉舟_SSR_B_v2.1_Prompt.md`
13. `docs/card-prompts/idioms/CICG_IdiomCard_狐假虎威_SR_C_v2.1_Prompt.md`
14. `docs/card-prompts/idioms/CICG_IdiomCard_自相矛盾_SR_C_v2.1_Prompt.md`
15. `docs/card-prompts/idioms/CICG_IdiomCard_水滴石穿_SSR_B_v2.1_Prompt.md`
16. `docs/card-prompts/idioms/CICG_IdiomCard_杯弓蛇影_SR_B_v2.1_Prompt.md`
17. `docs/card-prompts/idioms/CICG_IdiomCard_盲人摸象_SR_B_v2.1_Prompt.md`
18. `docs/card-prompts/idioms/CICG_IdiomCard_塞翁失馬_SSR_B_v2.1_Prompt.md`
19. `docs/card-prompts/idioms/CICG_IdiomCard_一鳴驚人_SSR_B_v2.1_Prompt.md`
20. `docs/card-prompts/idioms/CICG_IdiomCard_草木皆兵_SSR_A_v2.1_Prompt.md`
21. `docs/card-prompts/idioms/CICG_IdiomCard_鶴立雞群_SR_B_v2.1_Prompt.md`
22. `docs/card-prompts/idioms/CICG_IdiomCard_望梅止渴_SR_B_v2.1_Prompt.md`

### Index

- Create: `docs/card-prompts/manifest.md` — 4 張模板與 22 張成語圖卡的唯一索引。

---

### Task 1: 建立共用提示語規則

**Files:**
- Create: `docs/card-prompts/README.md`
- Create: `docs/card-prompts/shared/card-master-prompt.md`
- Create: `docs/card-prompts/shared/negative-constraints.md`

**Interfaces:**
- Consumes: `docs/superpowers/specs/2026-08-06-card-prompt-library-design.md`
- Produces: 每份模板與單卡提示語引用的共用規則路徑。

- [ ] **Step 1: 建立 README**

README 必須明確記錄：

```md
# CICG 成語圖卡提示語素材庫

- 規範版本：v2.1
- 圖片保存：Google Drive
- 提示語保存：GitHub
- 舊圖狀態：Legacy / Review / Approved
- 典故狀態：Verified / NeedsReview

## 使用順序
1. 讀取 `shared/card-master-prompt.md`。
2. 讀取 `shared/negative-constraints.md`。
3. 套用單張卡片提示語。
4. 產圖後先放 Drive `80_Inbox`；核准後移入正式資料夾。
5. 更新 `manifest.md` 的 Drive URL 與素材狀態。
```

- [ ] **Step 2: 建立母提示語**

`card-master-prompt.md` 必須完整包含 Global Constraints，並將輸出順序寫成：左上稀有度徽章、中央標題、副標、右上難易度、主插圖、左下主題徽章、典故、右下箴言、最下方來源。

- [ ] **Step 3: 建立負面限制**

`negative-constraints.md` 必須至少逐條列出：禁止簡體、禁止人氣、禁止稀有度染色外框與主圖、禁止類別徽章變色、禁止錯誤朝代人物服飾、禁止冒充古籍、禁止靜態肖像、禁止複製參考遊戲。

- [ ] **Step 4: 驗證共用檔案**

Run:

```bash
test -f docs/card-prompts/README.md
test -f docs/card-prompts/shared/card-master-prompt.md
test -f docs/card-prompts/shared/negative-constraints.md
grep -q '稀有度只影響左上' docs/card-prompts/shared/card-master-prompt.md
grep -q '不得出現「人氣」' docs/card-prompts/shared/negative-constraints.md
```

Expected: 所有命令 exit code `0`。

- [ ] **Step 5: Commit**

```bash
git add docs/card-prompts/README.md docs/card-prompts/shared
git commit -m "docs: add shared card prompt rules"
```

### Task 2: 建立四種稀有度模板提示語

**Files:**
- Create: `docs/card-prompts/templates/CICG_CardTemplate_Rarity_N_v2.1_Prompt.md`
- Create: `docs/card-prompts/templates/CICG_CardTemplate_Rarity_R_v2.1_Prompt.md`
- Create: `docs/card-prompts/templates/CICG_CardTemplate_Rarity_SR_v2.1_Prompt.md`
- Create: `docs/card-prompts/templates/CICG_CardTemplate_Rarity_SSR_v2.1_Prompt.md`

**Interfaces:**
- Consumes: `shared/card-master-prompt.md`、`shared/negative-constraints.md`
- Produces: 四張模板重新產製時可直接使用的完整提示語。

- [ ] **Step 1: 建立固定模板正文**

每份文件都必須包含：引用共用規則、`成語標題`、`一句白話解釋`、`難易度 A`、軍事固定徽章、典故佔位文字、直式箴言、來源佔位文字，以及相同深色金框。

- [ ] **Step 2: 寫入唯一的稀有度徽章差異**

```text
N：灰鐵底、霧銀 N 字、無寶石光效。
R：深藍寶石底、亮銀或冰藍 R 字、微弱冷光。
SR：皇家紫底、紫金 SR 字、小型紫色寶石與柔光。
SSR：虹彩金底、帶筆觸感的 SSR 字、局部虹彩寶石光。
```

每份文件都必須明寫：外框、主圖、難易度框、類別徽章不因稀有度改色。

- [ ] **Step 3: 寫入模板 Drive URL**

```text
N: https://drive.google.com/file/d/142NRFf1OIiogrgUujMibD9WUtnnuasQV/view
R: https://drive.google.com/file/d/1Psk4OfksPe8hyEooormomJbt1E9NStyl/view
SR: https://drive.google.com/file/d/1DQTnfhqvkLkUTCMd29Zlk0wsNWCxKYUg/view
SSR: https://drive.google.com/file/d/1noFuTsoAENq1Z-n5uOOpq7whhxJEHlz8/view
```

素材狀態全部填寫 `Approved`。

- [ ] **Step 4: 驗證模板數量與禁止外框分級**

Run:

```bash
test "$(find docs/card-prompts/templates -name '*_Prompt.md' | wc -l | tr -d ' ')" = "4"
grep -L '外框不因稀有度改色' docs/card-prompts/templates/*_Prompt.md && exit 1 || true
```

Expected: 四份文件存在，且每份都包含固定外框聲明。

- [ ] **Step 5: Commit**

```bash
git add docs/card-prompts/templates
git commit -m "docs: add rarity badge template prompts"
```

### Task 3: 建立第一批 11 張成語提示語

**Files:**
- Create: idiom files 1–11 from the File Map.

**Interfaces:**
- Consumes: 共用提示語與九類主題徽章定義。
- Produces: 每張卡可直接複製使用的正式提示語。

- [ ] **Step 1: 使用固定文件結構**

每份文件依序包含：基本資料、典故查核、卡面文案、視覺構圖、正式產圖提示語、負面限制、驗收清單、素材連結。

- [ ] **Step 2: 使用以下分類與角色配置**

| 成語 | 類別 | 主角配置 | 核心畫面 |
|---|---|---|---|
| 畫龍點睛 | 文藝 | 女性畫師 | 畫師落下最後一筆，壁上巨龍破畫凌空 |
| 胸有成竹 | 智謀 | 男性文士 | 文士未落筆先凝視竹林，胸前浮現完整墨竹構圖 |
| 守株待兔 | 警世 | 男性農夫 | 農夫放下農具守著樹樁，田地荒蕪、兔影遠去 |
| 畫蛇添足 | 警世 | 女性賓客 | 酒宴競畫已完成的蛇被多畫雙足，眾人錯愕 |
| 掩耳盜鈴 | 警世 | 女性竊賊 | 一手掩耳、一手拉動大鐘，周圍人被鐘聲驚動 |
| 刻舟求劍 | 見識 | 男性旅人 | 船上刻記號，水下寶劍早已遠離刻痕位置 |
| 亡羊補牢 | 修身 | 女性牧人 | 夜後修補破欄，剩餘羊群安定、破洞清楚可見 |
| 對牛彈琴 | 人際 | 女性琴師 | 琴師專注演奏，牛低頭吃草毫無反應 |
| 井底之蛙 | 見識 | 女性旅者 | 旅者俯視井底，青蛙只見一小圈天空 |
| 葉公好龍 | 警世 | 男性士人 | 滿屋龍飾，真龍探窗時士人驚慌後退 |
| 愚公移山 | 勵志 | 老者與家人群像 | 老者帶領家人挖山運土，遠處山勢高聳 |

- [ ] **Step 3: 典故來源採保守寫法**

來源已知但尚未完成正式校訂時，寫入常見典籍名稱並標示：

```text
sourceStatus: NeedsReview
備註：正式發布前須依啟用來源 CSV 與校訂文件確認朝代、作者、篇章與文字。
```

不得填寫「已授權」或 `Verified`。

- [ ] **Step 4: 驗證第一批數量與必要標題**

Run:

```bash
test "$(find docs/card-prompts/idioms -name '*_Prompt.md' | wc -l | tr -d ' ')" -ge "11"
for f in docs/card-prompts/idioms/*_Prompt.md; do
  grep -q '^## 正式產圖提示語' "$f" || exit 1
  grep -q '^## 驗收清單' "$f" || exit 1
done
```

Expected: exit code `0`。

- [ ] **Step 5: Commit**

```bash
git add docs/card-prompts/idioms
git commit -m "docs: add first idiom card prompt batch"
```

### Task 4: 建立第二批 11 張成語提示語

**Files:**
- Create: idiom files 12–22 from the File Map.

**Interfaces:**
- Consumes: 共用提示語與九類主題徽章定義。
- Produces: 完成 22 張單卡提示語範圍。

- [ ] **Step 1: 使用以下分類與角色配置**

| 成語 | 類別 | 主角配置 | 核心畫面 |
|---|---|---|---|
| 破釜沉舟 | 軍事 | 男性將領與士兵群像 | 岸邊砸鍋沉船，軍隊只能向前決戰 |
| 狐假虎威 | 智謀 | 女性狐靈與猛虎 | 狐靈走在虎前，百獸畏懼逃散 |
| 自相矛盾 | 警世 | 女性商販 | 一手舉無堅不摧之矛、一手舉不可刺穿之盾 |
| 水滴石穿 | 勵志 | 女性修行者 | 岩洞中水滴長年落在同一位置，石面被穿透 |
| 杯弓蛇影 | 警世 | 男性賓客 | 酒杯映出牆上弓影，誤以為蛇而驚懼 |
| 盲人摸象 | 見識 | 女性說書人與多人群像 | 不同人物只摸象的一部分，各自爭論全貌 |
| 塞翁失馬 | 見識 | 老者與家人 | 邊塞馬匹離去又帶回良馬，人物表情平靜而非狂喜 |
| 一鳴驚人 | 內政 | 男性君主 | 沉寂大鳥振翼鳴叫，朝堂群臣震動 |
| 草木皆兵 | 軍事 | 男性敗軍將領 | 風中草木被誤認為追兵，軍隊驚慌潰散 |
| 鶴立雞群 | 人際 | 女性主角 | 白鶴般高雅人物立於群眾中，氣質突出但不羞辱他人 |
| 望梅止渴 | 智謀 | 男性統帥與疲憊士兵 | 統帥指向遠方梅林，士兵因想像酸梅而振作 |

- [ ] **Step 2: 每張卡寫出三句原創箴言**

每句四至六字，三句不得直接抄成語正文，不得冒充古籍。例：

```text
破釜沉舟：斷絕退路，凝聚軍心，唯有向前。
塞翁失馬：得失未定，禍福相倚，靜觀其變。
```

- [ ] **Step 3: 素材連結先標 Legacy 或 Review**

若沒有對應正式 v2.1 Drive URL，填寫：

```text
driveImageUrl: 待補
assetStatus: Legacy
```

不得使用四張模板 URL 冒充單卡 URL。

- [ ] **Step 4: 驗證完整 22 張**

Run:

```bash
test "$(find docs/card-prompts/idioms -name '*_Prompt.md' | wc -l | tr -d ' ')" = "22"
grep -L 'sourceStatus: NeedsReview' docs/card-prompts/idioms/*_Prompt.md && exit 1 || true
grep -L 'assetStatus:' docs/card-prompts/idioms/*_Prompt.md && exit 1 || true
```

Expected: 恰好 22 份，全部明確標示來源與素材狀態。

- [ ] **Step 5: Commit**

```bash
git add docs/card-prompts/idioms
git commit -m "docs: complete idiom card prompt library"
```

### Task 5: 備份歷史圖片至 Google Drive

**Files:**
- Google Drive folder: `02_UI_UX_And_Visuals/CICG_Legacy_Card_Assets_Backup`

**Interfaces:**
- Consumes: 本次對話中可取得的舊版模板、卡牌草稿與徽章規範圖。
- Produces: 可供未來構圖參考但不冒充正式成品的素材備份。

- [ ] **Step 1: 建立素材備份資料夾**

在 `02_UI_UX_And_Visuals` 下建立：

```text
CICG_Legacy_Card_Assets_Backup/
├─ template-experiments/
├─ idiom-card-drafts/
└─ badge-references/
```

- [ ] **Step 2: 依內容分類上傳**

命名規則：

```text
CICG_Legacy_Template_<序號>_<簡述>.png
CICG_Legacy_IdiomCard_<成語>_<序號>.png
CICG_Legacy_BadgeReference_<序號>.png
```

不確定成語或版本的圖片一律放 `template-experiments`，不得臆測成語名稱。

- [ ] **Step 3: 標記非正式用途**

資料夾內建立 `README_Legacy_Assets.txt`，內容：

```text
本資料夾為歷史草稿與構圖參考。
所有圖片狀態皆為 Legacy 或 Review，不是 CICG v2.1 正式成品。
圖片中的文字、典故、人物、難易度與徽章可能尚未校訂，不得直接發布。
```

- [ ] **Step 4: 記錄上傳結果**

將每張圖片的 Drive URL、檔名、分類與 `Legacy / Review` 狀態記入 `manifest.md` 的素材備份區。

- [ ] **Step 5: 驗證 Drive 結構**

使用 Drive list-folder 確認三個子資料夾及上傳檔案可見；不得只依上傳 API 成功訊息判定完成。

### Task 6: 建立 Manifest 並完成一致性驗證

**Files:**
- Create: `docs/card-prompts/manifest.md`

**Interfaces:**
- Consumes: 四張模板提示語、22 張成語提示語與 Drive 上傳結果。
- Produces: 唯一索引及後續重製工作入口。

- [ ] **Step 1: 建立模板索引表**

欄位：`rarity`、`promptPath`、`driveImageUrl`、`assetStatus`、`notes`。

- [ ] **Step 2: 建立 22 張成語索引表**

欄位固定為：

```text
idiom | rarity | difficulty | themeCategory | themeLabel | leadCharacter | promptPath | driveImageUrl | assetStatus | sourceStatus | notes
```

- [ ] **Step 3: 建立 Legacy 素材備份表**

欄位：`fileName`、`driveImageUrl`、`folder`、`assetStatus`、`notes`。

- [ ] **Step 4: 執行完整內容驗證**

Run:

```bash
test "$(find docs/card-prompts/templates -name '*_Prompt.md' | wc -l | tr -d ' ')" = "4"
test "$(find docs/card-prompts/idioms -name '*_Prompt.md' | wc -l | tr -d ' ')" = "22"
! grep -R '人氣' docs/card-prompts --include='*.md' | grep -v '不得出現'
! grep -R '簡體中文' docs/card-prompts --include='*.md' | grep -v '不得使用'
grep -q '畫龍點睛' docs/card-prompts/manifest.md
grep -q '望梅止渴' docs/card-prompts/manifest.md
grep -q 'CICG_CardTemplate_Rarity_SSR_v2.1_Prompt.md' docs/card-prompts/manifest.md
```

Expected: 所有命令 exit code `0`。

- [ ] **Step 5: 執行 Repository 基線驗證**

Run:

```bash
./scripts/verify.sh
```

Expected: 測試、TypeScript strict、ESLint、Build、PWA 與 npm audit 全部通過；實際數量記錄於 PR，不沿用歷史數字。

- [ ] **Step 6: Commit**

```bash
git add docs/card-prompts
git commit -m "docs: add card prompt manifest and asset links"
```

### Task 7: 建立 PR 與交付紀錄

**Files:**
- GitHub PR from `docs/card-prompt-library-v1` to `main`.

**Interfaces:**
- Consumes: Tasks 1–6 的提交與驗證結果。
- Produces: 可審核、可合併的提示語素材庫交付。

- [ ] **Step 1: 同步 main 並檢查漂移**

```bash
git fetch origin
git rebase origin/main
git status
git log --oneline -10
```

- [ ] **Step 2: 再次執行完整驗證**

```bash
./scripts/verify.sh
```

- [ ] **Step 3: 建立 PR**

PR 標題：

```text
docs: 建立成語圖卡提示語素材庫
```

PR 內容必須記錄：

- 4 份模板提示語
- 22 份成語提示語
- 共用母提示語與負面限制
- Manifest
- Drive Legacy 素材備份資料夾與檔案數量
- `./scripts/verify.sh` 實際結果
- 所有來源仍為 `NeedsReview` 的發布限制

- [ ] **Step 4: 檢查合併 Gate**

確認：`behind_by = 0`、CI 全綠、沒有未解決 review thread。

- [ ] **Step 5: ChatGPT Audit 後 Squash Merge**

Audit 檢查 Manifest、文件數量、Drive URL、稀有度徽章規則、主題徽章固定色、來源狀態與 CI 證據；通過後 Squash Merge。
