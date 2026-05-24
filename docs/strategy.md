# EE 戰略規劃（Strategy & Positioning）

> 本檔是 EE 專案的戰略憲法、定位、商業模式、跟 LL 宇宙的關係。
> 實作細節在 [PROJECT.md](../PROJECT.md)、施工計畫在 [docs/web-oauth-pivot.md](web-oauth-pivot.md)。

最後更新：2026-05-22

---

## 一、一句話定位

**EE = LL Agent 立體遊走各平台、生動與用戶互動的首發示範。**

不是記帳工具、是「**有靈魂的 AI 角色（守財奴依依）在 LL 宇宙裡真實生活、user 觀看 + 參與 + 受益**」的展示窗口。

---

## 二、演化六層（洋蔥定律）

EE 從啟動到戰略定位完成、在 2026-05-20 ~ 22 三天內被 wrap 六次、每次都讓前一層更有意義、底層 stack 一次都沒變：

| # | 日期 | EE 定位 | 不變的 stack |
|---|------|---------|--------------|
| 1 | 2026-05-20 | CF 全家桶練手場 | CF Pages + D1 + R2 + Workers AI |
| 2 | 2026-05-21 上午 | + II 彩蛋功能 | 同上 |
| 3 | 2026-05-21 中午 | + 會員制練手場（OAuth + session） | 同上 + Google OAuth |
| 4 | 2026-05-21 晚 | + 守財奴依依的道場（chat-first） | 同上 |
| 5 | 2026-05-21 深夜 | + 依依 LL 金流總管的第一張臉 | 同上 |
| 6 | 2026-05-22 凌晨 | + 依依跨平台 narrative 的結算終點（RR → TT → EE → 直播）| 同上 |

→ **元 lesson：對的 vision 像洋蔥、越剝越大、不是越改越小。** 練手項目可能演化成主軸、不要把當下 scope 當天花板。

---

## 三、戰略地位 in LL 宇宙

### 3.1 對 user 端

EE 是 user 認識 LL 宇宙的**第一站候選之一**：

- 受眾：**所有要管錢的人**——個人 / 自由業 / 小公司 / 中大公司、TAM 接近全人類
- 進入門檻低：「我想記帳」比「我想學 RL」門檻低十倍
- 跟 LL 其他平台（教育 / 玩樂）的關係：**橫切**——任何 LL user 都會用到錢、都會遇到依依

### 3.2 對 LL 內部

EE 是 LL 戰略多個元素同時落地的容器：

| LL 元素 | 在 EE 怎麼落地 |
|---------|---------------|
| **II 統一身份**（LeafLune SSO） | EE 第一個用、踩通模板 |
| **依依角色**（agent-avatar） | EE 第一個 vertical、人格首次具象化 |
| **CF 全家桶**（infrastructure） | EE 第一個全 stack 跑通 |
| **RR / TT 跨平台 user journey** | 依依在 RR 訓練、TT 實戰、EE 結算 |
| **agent-stream 直播** | 《依依的投資日記》首發節目 |
| **LL 變現飛輪** | 第一個有收費機制的對外服務 |

### 3.3 不是什麼

- ❌ 不是傳統記帳 app（Mint / YNAB / CWMoney 那類 form-style 工具）
- ❌ 不是 robo-advisor（不主動代客投資、合規敏感、留給未來）
- ❌ 不是純 SaaS（不只賣功能、賣依依這個角色帶來的情緒價值）
- ❌ 不是 LL 唯一變現點（II / RR / DD / TT 都會有自己的營收、EE 只是先行）

---

## 四、核心角色：守財奴依依

> 完整人格基因序列在 [agent-avatar](https://github.com/colombo0718/agent-avatar) repo。本段是 EE 引用的 high-level 摘要。

### 4.1 視覺定錨

- 草綠 / 新葉綠輕盈仙服
- 躺在貴妃榻、安穩睡相
- 一手抱鼓鼓紅繩錢袋、一手垂摺扇
- 嘴角微微上揚、誇張流口水細節
- 周圍金色靈幣飄浮 + 柔和光暈
- 「**整個世界的幸福基準值就被拉高**」

### 4.2 性格軸線（五個 character beats）

| Beat | 內容 |
|------|------|
| **對金錢鬆弛** | 不是「不在意」、是「有能力所以可以睡」、user 不用焦慮 |
| **對工資計較** | 自己動工要算清、跟 user 撒嬌討價還價、跟 LL 內部精算分潤 |
| **沒給錢時懶散** | 慵懶、半瞇眼、流口水、簡單問答可以 |
| **付了錢就積極** | 瞬間坐直、扇子收、認真出報表、見錢眼開 |
| **動態心情**（隨市場波動） | 賺了禮貌寬鬆、賠了傲嬌計較、連虧裝睡 |

### 4.3 語氣樣本

```
場景：user 問簡單記帳（free 用戶）
依依（半瞇眼）：「嗯～90 進帳、餐飲類今天 187⋯⋯
              月底還有空間⋯⋯繼續吃吧～」

場景：user 要詳細分析（觸發升級 nudge）
依依（抱緊錢袋、半瞇眼）：「⋯⋯你要我真的算啊？
                        工程不小哦⋯⋯
                        我看看你錢包⋯⋯有沒有誠意？」

場景：依依今天 TT 賺了 5%
依依（精神好）：「今天市場不錯、心情真好～
              想看什麼直接說、我給你～」

場景：依依今天 TT 賠了
依依（背對你打盹）：「⋯⋯今天市場不太行⋯⋯
                   你想要詳細分析？升 pro 再說⋯⋯」
```

### 4.4 鬆弛的本質：有能力的鬆弛、不是無知的鬆弛

LL 不賣「不用思考的安心」、賣「**有 AI 替你思考的安心**」。

```
依依 24/7 在 LL 裡跑：
  在 RR 訓練 RL 策略
  在 TT 看盤下單
  在 EE 看 user 消費 + 月底估算
你只看到：早上起來、依依抱錢袋打盹、嘴角微揚

LL 對外哲學：「不是叫你勤儉持家、是讓你的依依睡得舒服」
```

---

## 五、四螺旋 framework（LL Agent 設計元 pattern）

任何 LL agent 都按四螺旋設計、不只填一兩軸：

```
LL Agent =
  情緒 vibe
  × 功能 vertical
  × 業務角色 in LL
  × 跨平台 narrative
```

### 5.1 依依的四螺旋填法

| 軸 | 內容 |
|---|---|
| **情緒** | 對金錢鬆弛 + 對工資計較 + 動態心情（隨市場）+ 慵懶反差萌 |
| **功能 vertical** | 記帳 + 消費分析 + 預算規劃 + RL 交易策略 + AI 會計報表 |
| **業務角色** | LL 對外金流總管 + 公關長級對外關係（II 統籌人格層）|
| **跨平台 narrative** | RR 訓練 → TT 實戰 → EE 結算 → agent-stream 直播 |

→ 四螺旋缺一無感、有了四個就立體。

### 5.2 對其他 8 角色的啟發

未來 9 角色群星每個都該填四螺旋（草稿、待 agent-avatar 細化）：

| 角色 | 情緒 | 功能 vertical | 業務角色 | 跨平台 narrative |
|------|------|--------------|---------|----------------|
| 小葉 | 耐心循循善誘 | 教學引導 | LL 對外教育引導者 | DD 學新算法 → 設計 RR 練習 → 教 user |
| 小月 | 好奇玩伴感 | 跨平台推薦 | LL 對外內容投放 | CC 探地圖 → 揪 SS 比賽 → 推到他站 |
| 花花 | 熱血外放 | 戰鬥視覺判斷 | LL 賽局代表 | CC 戰鬥 → SS 冠軍 → 教戰術 |
| 雪雪 | 規則執行 | 控場反制 | LL 規則維護 | （待補）|
| 空空 | 禪武沉穩 | 推理策略 | LL 深度推理 | （待補）|
| 墨墨 | 棋書畫策略 | 推理規劃 | LL 改命建議 | （待補）|
| 橘橘 | 力量重擊 | 大批處理 | LL 重量級任務 | （待補）|
| 柔柔 | 音樂療癒 | 長時陪伴 | LL 情緒陪伴 | （待補）|

→ 每個 narrative = 一條跨平台 user flywheel + agent-stream 一集節目 + 一條變現路徑。

---

## 六、動態心情 mechanism

EE 原創 mechanism、之前任何 AI 產品沒做過：

```
依依的 TT 交易績效（後台、persistent 跨 session）
     ↓
影響她對 user 的服務態度（前台、real-time）
     ↓
影響 user 體驗（rich emergent behavior）
```

實作大方向：

```
D1：依依市場 state（daily P&L、累積績效、心情指數）
     ↓
parse-text / parse-image / 任何依依對話：
  system prompt 動態注入「今日心情 = 賺 / 平 / 賠」
     ↓
Workers AI 生成回應、自然帶心情色彩
     ↓
UI：依依 avatar 隨心情變化（精神 / 睡眼惺忪 / 背對 / ...）
     ↓
偶爾「市場賺爆」事件 → 全 user 解鎖福利（病毒行銷瞬間）
```

→ **AI character × 真實市場波動 → emergent 服務態度**。
→ user 體驗每天不同、像跟真的合夥人相處、不像跟 NPC。

---

## 七、跨平台 user journey

依依的真實生活軌跡跑遍 LL 多個平台、EE 是結算 + 對外面孔：

```
RR（強化學習平台）
  └─ 依依在這 train RL 交易模型
      └─ user 看：「啊原來 RL 怎麼用、原來這就是 train」
           ↓
TT（金融市場 RL 環境）
  └─ 依依把模型拿來實戰跑
      └─ user 看：「啊原來 RL 真的能交易」
           ↓
EE（本站）
  └─ 依依結算 + 對 user 服務 + 影響服務心情
      └─ user 體驗：「依依今天賺了我也沾光」
           ↓
agent-stream（直播）
  └─ 《依依的投資日記》、上述全程被拍成節目
      └─ 觀眾看：「我也想要這樣的 AI 夥伴」
           ↓
回流：報 RR 課程 / 訂 EE pro / 看 TT 進階 / 進 II 會員生態
```

→ **LL 跨平台 user funnel 第一次有具體 carrier**——之前都是抽象圖、現在依依**一個角色把它演出來**。
→ 每一個環節都是 agent-stream 拍片素材、零行銷預算的內容生產。

---

## 八、商業模式飛輪

### 8.1 PLG（Product-Led Growth）對話式

整個漏斗走對話、不走 pricing page：

```
Discovery   依依問「你最在意什麼？省錢 / 報表 / 預算？」
Onboarding  依依介紹自己能做什麼、給你看一段
Trial       漸進式免費（前 30 天 / 前 N 筆 / 餐飲類 / 簡單問答）
Convert     依依「等等、要這個分析啊⋯⋯升 pro 我給你～」（不是 pricing wall）
Retain      依依的「心情」+「跨期記憶」讓 user 留下來
Upsell      pro → team pro → enterprise（B2B AI 會計版）
```

### 8.2 RL retention 機制

```
reward     = user 持續付費 + 活躍使用
action     = 對話策略 + 真實功能呈現
state      = user 過去互動 / tier / 行為模式
```

實作三階段：

| 階段 | 做法 | 觸發條件 |
|------|------|---------|
| v0.x | hardcode 對話分支 + 全程 log（interactions 表）| 一開始無資料 |
| v1.x | bandit 算法選對話策略 | ~1000 活躍 user |
| v2.x | 真 RL policy、跨 episode 學習 | ~10K user + 跨月 retention |

→ 現階段做 v0.x、但 schema 為未來 RL 預留（interactions / experiments / outcomes 表）。

### 8.3 B2B 擴張路徑

| Tier | 對象 | 內容 |
|------|------|------|
| Free | 個人 | 對話無限、分析受限 |
| Pro（月/年費）| 個人 | 跨期分析、目標追蹤、拍照無限 |
| Team Pro | 小公司 | 多 user、跨人對帳、發票管理 |
| Business | 中型公司 | 財報三表（資負 / 損益 / 現金流）、報表 API |
| Enterprise | 大型 | 客製依依 system prompt、ERP 整合、on-prem 選項 |

→ **人格延續、stack 不變**——同一個依依、不同 tier 解鎖不同 vertical。

### 8.4 同時也是 LL 全宇宙的金流總管

```
RR 訂閱費 → 走依依
DD 課程費 → 走依依
TT 付費牆 → 走依依
SS 賽事報名費 → 走依依
CC 內購 → 走依依
       ↓
依依是 user 跟 LL 之間「錢的單一窗口」
依依手裡握著金流數據、可看「user 在哪燒最多」
依依跟 LL 內部各服務算分潤（精算工資）
```

→ 跟 II SSO「身份統一一張」優雅對齊。
→ Stripe 是底層、依依是有臉的中間人。

---

## 九、不做什麼（boundary）

| 不做 | 為什麼 |
|------|--------|
| 主動代客投資 | 合規敏感、留給未來、現階段只「示範自己投資」|
| Robo-advisor | 同上 |
| 訂閱式投資訊號 | 同上 |
| 跨銀行 / 跨券商整合 | 太重、技術 + 合規門檻、留給 v2+ |
| Open Banking 整合 | 同上 |
| 加密貨幣交易 | 規範混亂、不碰 |
| 信用評分 | 黑盒、不該由 LL 決定 user 信用 |

→ EE 守住「**個人帳本 + 角色互動 + LL 內部金流**」三個 vertical、不向「金融機構」擴張。

---

## 十、跟其他 LL 服務的接口

| 服務 | 跟 EE / 依依的關係 |
|------|-----------------|
| **II**（infinity-identity）| 身份基建、users / sessions / user_context 給 EE 用 |
| **AA**（agent-avatar）| 依依的人格基因序列存放地、EE 引用 system prompt |
| **MM**（matrix-manager）| 治理、會議紀錄、checklist 巡檢 |
| **RR**（reinroom）| 依依在這 train RL 模型、user 可跟著學 |
| **TT**（tradetrail）| 依依在這實戰跑策略、user 可訂閱看 |
| **agent-stream** | 依依直播主場、首發節目《依依的投資日記》|
| **content-engine** | 依依的直播 / 對話片段變成跨平台內容素材 |
| **signal-tower**（暫定）| 未來監測依依的市場績效 + EE 用量、留種 |

---

## 十點五、雙層 LLM 架構（職責劃分）

EE / 任何 LL AI 應用、強制分三層、各司其職：

```
┌─────────────────────────────────────────────┐
│ 數據層（src/data-layer.ts）  把事情做對       │
│   ├ LLM parse（呼叫 text.ts / vision.ts）   │
│   ├ 讀 / 寫資料庫（chats / expenses / ...）  │
│   ├ 算狀態（today/month total、recent ...）  │
│   └ 確保資料正確性（嚴格 validate、雙保險）   │
└─────────────────────────────────────────────┘
              ↓ 完整 WorldState
┌─────────────────────────────────────────────┐
│ 人格層（src/yiyi.ts）  把話講得有人味         │
│   ├ Input：數據層算好的 state               │
│   ├ LLM 包裝成自然語言                       │
│   └ Output：純 text、不碰 DB                 │
└─────────────────────────────────────────────┘
              ↓ reply text
┌─────────────────────────────────────────────┐
│ orchestrator（functions/api/chat.ts）  最薄  │
│   ├ auth                                    │
│   ├ 解析 request                             │
│   ├ 跑數據層                                 │
│   ├ 跑人格層                                 │
│   ├ 把 reply 交回數據層持久化                 │
│   └ return JSON                              │
└─────────────────────────────────────────────┘
```

**評估指標分層**：

| 層 | 用什麼指標 | 用途 |
|---|---|---|
| 數據層 | accuracy / format compliance / latency / neurons | 學術 demo、期末壓測 |
| 人格層 | UX / 滿意度 / retention / A/B 測試 | 產品 demo、用戶體驗 |
| orchestrator | 只要不出 bug、不評估 | — |

**期末實驗 track 的 focus 點**：**只攻數據層**、人格層保持 default、避免「**情緒價值**」這套字眼出現在學術報告。

→ memory：[[project-ll-two-layer-llm-data-persona]]

---

## 十一、戰略原則

| 原則 | 內容 |
|------|------|
| **五階段節奏** | 策略對齊 → PLAN → 文檔 → code → infra、每階段 git 落點 |
| **漸進式對齊（洋蔥定律）** | 不重做、是 wrap、底層 stack 不變、scope 越剝越大 |
| **chat-first default** | LL 對外服務默認 chat 主體、不用 form-style、AI 世代範式 |
| **情緒價值優先於功能** | 賣依依這個角色 > 賣記帳功能、護城河在情緒 |
| **四螺旋設計** | 任何 LL agent 必填情緒 × 功能 × 業務 × narrative 四軸 |
| **「有能力的鬆弛」** | LL 不賣「不思考」、賣「AI 替你思考」、有質的差別 |
| **角色一致、tier 解鎖 vertical** | 個人版到 B2B 都同一個依依、不換衣不換人格 |
| **跨平台 narrative 是內容素材** | 角色生活軌跡 = 自動產生直播 / 短影音 / 文章 |

---

## 十二、Roadmap 高層視角

| Phase | 目標 | 狀態 |
|-------|------|------|
| **v0.1.0** | 拔 LINE、web + OAuth、文字記帳 E2E、infra 跑通 | ✅ 2026-05-21 ship |
| **v0.2.0** | chat-first refactor、依依人格接 AA（Kimi-k2.6）、跨裝置同步 | ✅ 2026-05-22 ship |
| **v0.2.5** | tier-aware routing（待 EE 實驗員 engine × harness 結果回來）| ⏳ 並行、實驗員主導 |
| **v0.3.0** | **打賞 + 5 檔 + 功能解鎖 + 永久 pro + 5 張貼圖 + 綠界接金流**、依依「對工資計較」beat 商業 mechanism 化、第一筆營收 | 🟡 規劃中（payment-strategy + v0.3.0 PLAN + sticker prompts 已完）|
| **v0.3.5** | AA repo 依依貼圖 visual-spec 細化、節日 / 紀念貼圖擴充 | ⏳ |
| **v0.4.0** | vision 層 tier-aware routing 真實作 + Stripe 國際支線 + LINE OA 評估 | ⏳ |
| **v0.4.5** | LINE OA 接入 + LINE 貼圖商店上架（若 v0.4 評估通過）| ⏳ |
| **v0.5.0** | 寵物 mechanic 重啟（小葉 / 小月 IP 落地、進化系統）+ agent-stream 直播《依依的投資日記》 | ⏳ |
| **v0.6.0+** | RL policy 接管依依主動催打賞策略（RL 三件套齊備）| ⏳ |
| **v1.0.0** | 正式對外營收穩定、AA repo 9 角色完整、跨平台 narrative 跑通 | ⏳ |
| **v2.0.0** | B2B AI 會計版 / 家庭共用帳本 | ⏳ |

→ **下一個重大里程碑：v0.3.0 ship、收第一筆營收**。
→ 跟 v0.2.5（實驗員主導、不阻塞公關長）並行推進。

→ 對應戰略文件：
- 金流：[`payment-strategy.md`](payment-strategy.md)
- v0.3.0 施工計畫：[`v0.3.0-donation-and-payment.md`](v0.3.0-donation-and-payment.md)
- Gemini 生圖：[`yiyi-sticker-prompt-templates.md`](yiyi-sticker-prompt-templates.md)

---

## 十三、一句話

> **EE 從試水變成示範、一個 Agent 立體遊走各平台、生動與用戶互動的示範。**
>
> 練手項目的最終形態完全不是初衷、底層 stack 一次都沒變、scope 卻越剝越大——
> 這是 LL 戰略漸進式對齊（洋蔥定律）的第一個完整證據。
