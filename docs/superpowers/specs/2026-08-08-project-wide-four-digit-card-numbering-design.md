# 全專案四碼稀有度卡號設計 v1.0

## 狀態

- 核准日期：2026-08-08
- 適用範圍：Chinese-Idiom-Chain-Game 全專案成語卡
- 取代規則：第一章內三碼稀有度流水號

## 目標

建立全專案唯一、依稀有度分流、四碼固定寬度的永久卡號，並把正式卡號固定渲染於所有稀有度卡片的最下方中央牌匾。

## 卡號格式

```text
N-0001
R-0001
SR-0001
SSR-0001
UR-0001
```

格式固定為：

```text
{rarity}-{sequence:0000}
```

支援稀有度固定為 `N`、`R`、`SR`、`SSR`、`UR`。每個稀有度各自建立獨立序列，從 `0001` 開始，跨章節持續累加，不因新章節歸零。

## Canonical Registry

正式真實來源為：

```text
data/cards/card-number-registry.json
```

Schema：

```text
data/cards/card-number-registry.schema.json
```

既有 `chapter-1-card-number-registry.json` 保留為第一章相容投影，內容必須與 Canonical Registry 的 `chapter-1` 子集合完全一致，不得獨立指派卡號。

## 永久性規則

- 卡號一經正式指派即不可變更。
- 重製、換圖、修字、審核狀態、Drive 搬移、模板升級與版本升級都不得改號。
- 正式卡片退休、下架或刪除後，號碼永久保留，不回收、不補洞。
- 稀有度改變時不得沿用舊卡號；舊號保留為 retired，新稀有度由自己的序列指派新號。
- 圖片模型不得生成、猜測或修補卡號。
- Renderer 只能從 Canonical Registry 取得 `cardNumber`。
- 同一卡號不得對應多張卡；同一正式卡不得同時擁有多個 active 卡號。

## UR 授權 Gate

UR 屬於正式授權外部 IP 聯名序列。沒有可稽核 `licenseEvidenceId` 時：

- 不得指派 `UR-####` 正式號碼。
- 只能使用不占序列的 Review 識別碼。
- 不得標記 Approved、公開發布、上架或進入正式卡池。

Review 識別碼不屬於正式卡號，也不得出現在 Approved 卡片的正式卡號牌匾。

## 卡面渲染

所有 `N`、`R`、`SR`、`SSR`、`UR` 卡面都必須在最下方中央顯示唯一的 `bottom-center card-number-plaque`：

```text
bottom-center card-number-plaque = {{CARD_NUMBER}}
```

固定要求：

- 只顯示 Registry 分配的正式 `cardNumber`。
- 使用四碼數字，不得縮成三碼。
- 不顯示角色名、IP 名稱、難度、版本號或其他文字。
- 卡號牌匾由 Renderer 文字層產生，不得烙入 canonical artwork。
- 底部角色名稱仍禁止重複顯示。
- 卡面只允許一個 canonical `card-number-plaque`，不得出現第二組或裝飾性卡號。
- 牌匾不得改變 `1024 × 2000`、`360 / 1200 / 440` 與 `±2 px` 幾何契約。

v2.6.1 原始 source-line 外框維持：

```text
source-line outer box x=178–846, y=1936–1986
```

其內部固定分割為：

```text
source-line          x=178–398, y=1936–1986
card-number-plaque   x=410–614, y=1936–1986
```

上述分割只重排外框內部內容，不得變更 Footer 高度或其他 Bounding Box。

## 第一章遷移

既有 61 張卡只增加一個前導零，數值、排序與稀有度不變：

```text
N-001   → N-0001
R-018   → R-0018
SR-023  → SR-0023
SSR-008 → SSR-0008
```

第一章遷移後的下一號：

```text
N-0013
R-0019
SR-0024
SSR-0009
UR-0001（僅在授權 Gate 通過後）
```

## 驗證 Gate

CI 必須阻擋：

- 非四碼格式。
- 卡號前綴與稀有度不一致。
- 全專案重複卡號。
- 同稀有度序列重複、倒退或非預期缺號。
- 第一章相容投影與 Canonical Registry 漂移。
- 未授權 UR 占用正式序號。
- 母提示語或技能仍要求三碼卡號。
- 母提示語禁止底部卡號，或未要求 `bottom-center card-number-plaque`。

## 範圍界線

本次只建立編號 Registry、Schema、規格、技能與提示語 Gate；不修改主玩法、IndexedDB 進度 Schema，也不重製既有圖片。