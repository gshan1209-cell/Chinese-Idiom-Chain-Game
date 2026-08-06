# 成語圖卡稀有度標準 v1.0

日期：2026-08-06  
Repository：`gshan1209-cell/Chinese-Idiom-Chain-Game`  
狀態：Approved  
規範類型：圖卡系統永久標準；本文件不包含 production code

## 1. 目的與適用範圍

本文件是 Chinese-Idiom-Chain-Game 成語圖卡系統的正式稀有度標準，適用於：

- 圖卡企劃與文案
- 圖卡素材產製
- 圖卡審核
- 每十關免費贈卡卡池
- 圖卡收藏頁
- 未來指定圖卡購買與固定內容卡包
- 未來正式授權 IP 聯名

所有 Agent 在新增、修改、審核、發放、展示或規劃販售圖卡前，必須先閱讀本文件。

---

## 2. 規範優先序

圖卡相關規格的優先序固定如下：

```text
本文件：圖卡稀有度標準
→ 圖卡審核治理規格
→ 圖卡收藏與里程碑贈卡規格
→ 個別圖卡企劃、Prompt 與素材說明
```

本文件正式取代 `2026-08-06-idiom-card-collection-design.md` 第 3.1 節中「稀有度描述卡牌收藏價值與視覺規格」的舊敘述。

正確規則是：

> N～SSR 主要依成語本身承載的正面意義、勵志程度、精神象徵、共鳴力與收藏定位判定；美術華麗度不得單獨決定稀有度。

---

## 3. 稀有度與難易度必須分離

### 3.1 成語難易度

成語難易度表示普及程度與理解門檻：

```text
E → D → C → B → A → S
```

判定因素包括：

- 日常使用頻率
- 是否常見於課本或媒體
- 是否需要典故背景
- 字義與語境是否容易理解

### 3.2 圖卡稀有度

圖卡稀有度表示成語的正向精神價值與收藏定位：

```text
N → R → SR → SSR → UR
```

永久規則：

```text
rarity !== difficulty
SSR 不代表 A
SSR 不代表 S
UR 不代表成語最艱深
```

例如：

| 成語 | 稀有度 | 難易度 | 說明 |
|---|---|---|---|
| 愚公移山 | SSR | B | 毅力與信念象徵強烈 |
| 破釜沉舟 | SSR | A | 決心與背水一戰的精神張力高 |
| 一心一意 | SR | E | 正面、易懂且具專注價值 |
| 東張西望 | N | E | 常見描述性成語，正向激勵性較低 |

---

## 4. N～SSR 的共同判定維度

N～SSR 必須綜合評估下列五項：

1. **正面意義**：是否鼓勵正向行為或品格。
2. **勵志程度**：是否能帶來行動、堅持或突破的力量。
3. **精神象徵**：是否代表勇氣、毅力、責任、團結、智慧或信念。
4. **共鳴力**：是否容易引起玩家情感共鳴與收藏意願。
5. **代表性**：是否適合作為專案招牌卡、王牌卡或章節核心卡。

不得直接用下列因素提高稀有度：

- 成語比較艱深或冷門
- 圖片比較華麗
- 人物看起來比較強
- 特效比較多
- 產製成本比較高
- 設計者個人偏好

視覺規格必須配合已核准稀有度呈現，但不能反過來決定語義稀有度。

---

## 5. 各稀有度標準

### 5.1 N — Normal

定位：基礎收藏卡。

適用條件：

- 偏描述性、中性或警示性
- 正向激勵效果有限
- 適合作為圖鑑基礎與教學入門
- 不具強烈英雄感或精神象徵

常見類型：

- 日常狀態描述
- 方位、數量或表象描述
- 帶有提醒作用但正面力量較弱的成語

示例：

- 東張西望
- 七上八下
- 五花八門

### 5.2 R — Rare

定位：具明確實用價值的一般稀有卡。

適用條件：

- 中性偏正面或具生活教育意義
- 能表達良好做事方法
- 有一定收藏吸引力，但精神張力中等

示例：

- 循序漸進
- 熟能生巧
- 一絲不苟

### 5.3 SR — Super Rare

定位：正向價值清楚、具成長與教育力量的高品質收藏卡。

適用條件：

- 積極、專注、勤奮、合作或自我成長
- 具有明顯鼓舞效果
- 容易與玩家學習、工作或生活經驗產生共鳴
- 適合作為常態卡池的重要收藏卡

示例：

- 一心一意
- 同心協力
- 孜孜不倦
- 自強不息

### 5.4 SSR — Super Super Rare

定位：高正面意義、高精神象徵、高共鳴與高收藏價值的招牌卡。

至少應符合下列多數條件：

- 強烈表達毅力、勇氣、信念、奮鬥或責任
- 具有熱血、突破困境或扭轉局勢的力量
- 能成為玩家長期記憶的精神象徵
- 適合作為章節核心、王牌或宣傳主打卡
- 即使不依靠豪華美術，也具有明確的高階收藏理由

代表示例：

- 愚公移山
- 破釜沉舟
- 勇往直前
- 乘風破浪
- 臥薪嘗膽
- 鍥而不捨
- 力爭上游

SSR 不得因卡面使用金框、特效或高品質人物插圖而自動成立；必須先通過成語語義與精神價值審核。

---

## 6. UR — Ultra Rare 聯名限定規則

### 6.1 定位

`UR` 是正式授權 IP 聯名與重大合作限定等級，不是一般成語正向程度的自然升級。

因此，UR 是 N～SSR 語義稀有度體系的例外層級。

### 6.2 永久限制

未取得正式授權前，不得：

- 製作正式 UR 聯名卡
- 使用外部 IP 角色、名稱或 Logo
- 使用高度可識別的服裝、武器、標誌或角色設定
- 將未授權聯名圖卡加入 GitHub 正式卡表
- 將未授權聯名素材移入 Drive Approved 區
- 發放、展示、宣傳、販售或上架未授權聯名卡

例如未來若與《鬼滅之刃》等外部 IP 合作，只有在取得可稽核的正式授權後，才可建立相應 UR 圖卡。

### 6.3 UR 必填證據

UR 圖卡必須額外保存：

- `licenseEvidenceId`
- 授權方名稱
- 授權範圍
- 可使用角色／名稱／Logo 範圍
- 地區限制
- 通路限制
- 生效日與到期日
- 商業使用權限
- 最終核准紀錄

缺少任何必要授權證據時，`rarity = 'UR'` 必須被自動 Gate 阻擋。

### 6.4 語義基礎稀有度

為保留成語本身的正向價值判定，UR 聯名卡建議同時記錄：

```ts
export type SemanticCardRarity = 'N' | 'R' | 'SR' | 'SSR';
export type CardRarity = SemanticCardRarity | 'UR';

export interface CardRarityMetadata {
  readonly rarity: CardRarity;
  readonly semanticBaseRarity: SemanticCardRarity;
  readonly rarityBasis: 'positive-meaning' | 'licensed-ip-collaboration';
  readonly licenseEvidenceId: string | null;
}
```

UR 必須符合：

```text
rarity === 'UR'
rarityBasis === 'licensed-ip-collaboration'
licenseEvidenceId !== null
```

---

## 7. 稀有度判定紀錄

每張圖卡都必須保存可審核的判定理由：

```ts
export interface CardRarityAssessment {
  readonly cardId: string;
  readonly proposedRarity: CardRarity;
  readonly semanticBaseRarity: SemanticCardRarity;
  readonly positiveMeaningSummary: string;
  readonly motivationalValue: 'low' | 'medium' | 'high' | 'exceptional';
  readonly symbolicThemes: readonly string[];
  readonly reviewerRationale: string;
  readonly licenseEvidenceId: string | null;
}
```

禁止只寫「因為很帥」、「因為畫面很華麗」或「因為很難」作為稀有度理由。

---

## 8. 卡池與取得方式

- 每十關免費贈卡可使用 N、R、SR、SSR，但必須由核准卡池設定實際權重。
- UR 不得進入一般里程碑免費隨機卡池。
- UR 只能透過已核准的聯名活動、指定商品或正式合作規則取得。
- 未來付費取得預設為指定圖卡或固定內容卡包，不導入付費隨機抽卡。
- 稀有度不得影響主線通關、星級、提示或基本遊戲公平性。

---

## 9. 審核 Gate

以下任一情況存在時，圖卡不得 Approved：

- 稀有度與難易度混用
- 無法說明正面意義與稀有度關係
- SSR 只依畫面或特效判定
- UR 沒有正式授權證據
- UR 使用未授權外部 IP 元素
- 稀有度理由與卡面文案互相矛盾
- 稀有度欄位不在合法列舉值內

---

## 10. Agent 必讀入口

所有 Agent 處理圖卡工作時，必須由以下入口開始：

```text
AGENTS.md
→ docs/superpowers/specs/README.md
→ 本文件
→ 圖卡審核治理規格
→ 圖卡收藏規格
```

Agent 不得從聊天紀錄自行推測稀有度，也不得以舊 Prompt 或單張圖片上的標示取代本文件。