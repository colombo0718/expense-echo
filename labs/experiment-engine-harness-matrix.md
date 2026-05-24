# EE 數據層 engine × harness 壓測實驗

- 日期：2026-05-23 起跑
- 派工源：colombo
- 主理：（待定、由新 session agent 接手、colombo 從 VS Code 直接對話）
- EE 端配合：公關長（`infinity-identity/bc20d23b`）
- 對應戰略：
  - [`leaflune/notes/ll-antifragility-via-task-maturation.md`](C:/Users/USER/leaflune/notes/ll-antifragility-via-task-maturation.md)
  - [`matrix-manager/meetings/2026-05-22-ll-antifragility-and-multi-race-ai-organization.md`](C:/Users/USER/matrix-manager/meetings/2026-05-22-ll-antifragility-and-multi-race-ai-organization.md) §三 + §四
  - [`expense-echo/docs/strategy.md`](../docs/strategy.md) §十點五（雙層 LLM）

---

## 一、實驗命題

> **對 EE 數據層任務（記帳意圖辨識 + 金額/商家/品項抽取 + 收據 OCR）、找出「engine × harness」二維空間裡的 sweet spot：在哪個模型強度 × 哪個控制顆粒度的組合下、能在 accuracy / latency / cost 三維 pareto frontier 上拿到最佳配置。**

LL 第一次系統性「**模型 × 控制顆粒度**」實驗。產出不只是 EE 期末報告、是 LL 內部 ML eval playbook、未來 II widget / yeyan / agent-stream 都會複用。

---

## 二、戰略上下文

LL 過去 2 個月 all-in Claude Code、5/22 戰略 pivot 到「**異種人工廠**」：

```
強模型（蓮藕）   服 VIP / 探索 / 第 1 階任務     諸葛亮 in-context
中弱模型（香腸） 服 free / 量產 / 第 3 階任務   三臭皮匠 + harness 編排
```

EE 是這條戰略的**第一個落地實驗場**——數據層任務（記帳解析）已經夠成熟、可以從第 1 階下沉到第 2-3 階。
本實驗的結論將決定：

- **EE v0.2.5** tier-aware routing 怎麼設計（免費 user 該用哪個 engine + harness、VIP 用哪個）
- **故障 fallback chain** 順序（哪個 engine 先試、爆了切下一個）
- **LL 全宇宙** 對「數據層型任務」的 default 配置

---

## 三、二維 design space

### 3.1 軸 1：engine（CF Workers AI 模型）

數據層分兩條 sub-task、各自有 model pool：

#### 文字解析 candidate（依規模分層）

| 層 | 模型 ID | 參數 | 上下文 | 預期定位 |
|---|---|---|---|---|
| 香腸（小）| `@cf/meta/llama-3.2-1b-instruct` | 1B | 128K | 極省、accuracy 待測 |
| 香腸（小）| `@cf/meta/llama-3.2-3b-instruct` | 3B | 128K | 同上 |
| 中庸 | `@cf/meta/llama-3.1-8b-instruct` | 8B | 8K | EE 目前用、baseline |
| 中庸 | `@cf/qwen/qwen2.5-coder-32b-instruct` | 32B | 32K | 結構化輸出強 |
| 中庸 | `@cf/mistral/mistral-small-3.1-24b-instruct` | 24B | 128K | 法語系、中文待測 |
| 中庸 | `@cf/google/gemma-4-26b-a4b-it` | 26B | — | function calling 強 |
| 蓮藕 | `@cf/openai/gpt-oss-20b` | 20B | — | OpenAI agentic |
| 蓮藕 | `@cf/deepseek-ai/deepseek-r1-distill-qwen-32b` | 32B | — | 推理特化、中文強 |
| 蓮藕 | `@cf/qwen/qwen3-30b-a3b-fp8` | 30B MoE | — | 中文 native |
| 蓮藕 | `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | 70B | — | Meta 旗艦 |
| 超大蓮藕 | `@cf/openai/gpt-oss-120b` | 120B | — | OpenAI 開源頂 |
| 超大蓮藕 | `@cf/moonshotai/kimi-k2.6` | 1T | 262K | 依依本命、最大 |

→ **建議精選 6-8 個跑全矩陣、其餘 spot check**。完整 12 個 × 全 harness 會爆 Neurons budget。

#### Vision OCR candidate

| 模型 ID | 規模 | 備註 |
|---|---|---|
| `@cf/meta/llama-3.2-11b-vision-instruct` | 11B | EE 目前用、baseline |
| `@cf/llava-hf/llava-1.5-7b-hf` | 7B | EE fallback |
| `@cf/unum/uform-gen2-qwen-500m` | 500M | 小到極致、accuracy 待測 |

### 3.2 軸 2：harness（控制顆粒度 L0 → L4）

對 LLM 的「**人類預先切分流程**」程度、5 個等級：

#### L0：無框架 in-context（諸葛亮模式）

```
[user input 整段] + [完整 schema 說明 in prompt]
       ↓
[LLM 一次回完整 JSON]
       ↓
parse + validate
```

特性：強模型最佳、弱模型容易 hallucinate / 漏欄位。EE 目前就是 L0。

#### L1：單階段帶 schema + few-shot

L0 + prompt 加 3-5 個 few-shot example + 詳細 schema 註解。

特性：弱模型品質拉升、token cost 變高、latency 略高。

#### L2：雙步切分（intent → entity）

```
Step 1 [user input] → intent classify（記帳 / 查詢 / 聊天 / 其他）
       ↓
   若記帳：
Step 2 [user input + intent=記帳] → entity extract（amount / vendor / items）
   若非記帳：直接結束、回 null
```

特性：「非記帳輸入」不浪費 token、弱模型對單步任務更穩。

#### L3：多步切分（每個欄位獨立呼叫）

```
Step 1 intent classify
Step 2 amount extract
Step 3 vendor identify
Step 4 category classify
Step 5 items extract（若有明細）
       ↓
合併 JSON
```

特性：弱模型品質理論上最高、但 latency 4-5x、cost 4-5x。

#### L4：規則式預處理 + LLM 微調

```
Step 1 regex 抓「\d+\s*(元|塊|NT\$|＄)」→ amount
Step 2 regex 抓「(7-11|全聯|全家|大潤發|...)」→ vendor
Step 3 殘留語義丟 LLM → category + items
       ↓
合併 JSON
```

特性：對結構化輸入最穩、自由語義部分用 LLM。也最便宜。

→ **設計上 L0 → L4 是「LLM 自由度遞減、人類控制遞增」一條光譜**。實驗目標：找出每個 engine 強度對應的最佳 harness 等級。

---

## 四、樣本集規劃

### 4.1 文字樣本（目標 30-50 條）

| 類型 | 範例 | 數量 | colombo 收集難度 |
|---|---|---|---|
| 簡單記帳 | 「便當 90」「咖啡 50」「飲料 35」 | 8 | 低（直覺造）|
| 含店家 | 「7-11 礦泉水 30」「全聯買菜 320」 | 8 | 低 |
| 自然語句 | 「今天午餐花了 200」「剛剛去買飲料花 45」 | 8 | 中（要寫像自然口語）|
| 模糊金額 | 「不小心又買了快 1000」「日用品大概 500」 | 5 | 中 |
| 含品項明細 | 「7-11 飯糰 35 礦泉水 25 共 60」 | 5 | 中 |
| 多語 | 「Ăn kít 3 lần 90k」（越）「lunch 12 dollars」（英）「咖啡 50 yen」 | 3 | 中 |
| 非記帳（負樣本）| 「我最近買了什麼」「你好」「能查詢嗎」「依依在嗎」 | 5 | 低 |
| 邊界 | 「便當 0 元」「-50」「免費的」「不知道多少錢」 | 3 | 低 |
| 從 EE chats 撈真實樣本 | 直接 SELECT 過去 user msg | 5-10 | 零（撈現成）|

### 4.2 Vision 樣本（目標 20-30 張）

| 類型 | 範例 | 數量 |
|---|---|---|
| 超商證明聯（無明細）| 7-11 / 全家 / 萊爾富、總額 only | 5 |
| 超市發票（含明細）| 全聯 / 美廉社 / 大潤發 | 5 |
| 餐廳發票 | 含統編 + 品項 + 服務費 | 5 |
| 加油站發票 | 公升 / 單價 / 總額 | 3 |
| 手機 App 訂單截圖 | UberEats / Foodpanda / Shopee | 5 |
| 邊界 | 模糊 / 反光 / 折皺 / 旋轉 / 部分遮擋 | 3-5 |
| 非收據（負樣本）| 商品本身 / 寵物照 / 風景 | 3 |

→ 收據要 colombo 拍 + 標、可動員 Xuan / 朋友幫忙拍。**EE 已有 1 張 7-11 在 R2、可當 sample #1**。

### 4.3 Ground truth schema

每個 sample 對應一份 ground truth JSON：

```json
{
  "sample_id": "text-001",
  "input": "便當 90",
  "input_type": "text",
  "ground_truth": {
    "intent": "record_expense",
    "amount": 90,
    "vendor": null,
    "category": "餐飲",
    "items": [{"name": "便當", "price": 90}]
  },
  "notes": "簡單記帳、無歧義",
  "language": "zh-TW"
}
```

vision sample 加一個 `image_path` 欄位、指向 R2 key 或本機檔。

---

## 五、應變量（量化指標）

每次 `(sample, engine, harness)` run 收集：

| 指標 | 計算 | 重要性 |
|---|---|---|
| `amount_accuracy` | 抓到值 / ground_truth ∈ [0.95, 1.05] = ✅ | ⭐⭐⭐ |
| `vendor_match` | normalized fuzzy match（「7-11」=「7-ELEVEN」=「seven」）| ⭐⭐ |
| `category_match` | 6 類分類正確 | ⭐⭐ |
| `items_f1` | 品項抽取的 precision + recall | ⭐⭐ |
| `json_validity` | LLM 回應能否 JSON.parse | ⭐⭐⭐ |
| `intent_correct` | 「非記帳輸入」是否正確識為 not_record | ⭐⭐⭐ |
| `latency_ms` | server 端 env.AI.run 總時間 | ⭐⭐ |
| `neurons` | CF 計費（從 ai_runs 拉、若可得）| ⭐⭐ |
| `total_tokens` | input + output token 數 | ⭐ |
| `failure_mode` | 多語 leak / hallucinate / 拒答 / 截斷 / format error 分類 | ⭐⭐⭐ |

`composite_score`（pareto 用）= 0.5 × accuracy + 0.3 × json_validity + 0.2 × (1 / log(latency_ms))

→ 細部可以實驗主理人調。

---

## 六、實驗流程

```
Step 1：樣本集 + ground truth
  colombo 主理（內容知識專家）
  公關長配合：撈 EE chats 歷史 user msg 當部分樣本
  輸出：labs/samples/text/*.json + labs/samples/vision/*.json + *.jpg

Step 2：寫 evaluation harness
  Option A：CF Pages Function 內 endpoint（labs/eval-run.ts）
  Option B：本機 Node.js script、直接 fetch CF Workers AI REST API
  推薦：B（離線可跑、不佔 EE production Pages Function quota）
  輸出：labs/eval/run.ts（或 .js）

Step 3：跑全矩陣
  text：30-50 sample × 6-8 engine × 5 harness = 900-2000 runs
  vision：20-30 sample × 3 engine × 3 harness = 180-270 runs
  estimated wall-clock：30-60 分（並行 + rate limit 平衡）
  estimated Neurons：≈ 5000-10000（在 free tier 範圍、注意每日上限）
  輸出：D1 evaluation_runs 表（或 JSON 檔）

Step 4：分析 + 生圖
  pivot：engine × harness → mean accuracy
  heatmap：找 sweet spot
  pareto frontier：accuracy vs latency vs cost
  failure mode 分類圖
  輸出：labs/analysis/*.png + labs/analysis/report.md

Step 5：產出 deliverables
  ├─ labs/findings.md（學術 framing）
  ├─ slide deck 13-15 張、cell2sentence 風格、Problem-Method-Result-Discussion
  ├─ EE playbook：「對 EE 數據層、最 cost-effective 配置 = X engine + Y harness」
  └─ LL 通用 ML eval template（其他專案可複用）
```

---

## 七、D1 schema（evaluation_runs 表）

```sql
CREATE TABLE IF NOT EXISTS evaluation_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  experiment_batch TEXT NOT NULL,    -- '2026-05-23-text-v1'
  sample_id TEXT NOT NULL,           -- 'text-001' / 'vision-007'
  task TEXT NOT NULL,                -- 'text' / 'vision'
  engine TEXT NOT NULL,              -- '@cf/meta/llama-3.1-8b-instruct'
  harness TEXT NOT NULL,             -- 'L0' / 'L1' / 'L2' / 'L3' / 'L4'

  -- ground truth
  amount_truth INTEGER,
  vendor_truth TEXT,
  category_truth TEXT,

  -- prediction
  amount_pred INTEGER,
  vendor_pred TEXT,
  category_pred TEXT,
  raw_response TEXT,

  -- metrics
  amount_correct INTEGER,            -- 1/0
  vendor_correct INTEGER,            -- 1/0
  category_correct INTEGER,          -- 1/0
  json_valid INTEGER,                -- 1/0
  intent_correct INTEGER,            -- 1/0
  latency_ms INTEGER,
  neurons REAL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  failure_mode TEXT,

  ts INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_eval_batch ON evaluation_runs(experiment_batch);
CREATE INDEX IF NOT EXISTS idx_eval_engine_harness ON evaluation_runs(engine, harness);
CREATE INDEX IF NOT EXISTS idx_eval_sample ON evaluation_runs(sample_id);
```

加在 `expense-echo/schema.sql` 末段、跟現有 production schema 同 DB。

---

## 八、產出 deliverables

1. **`labs/findings.md`** — 主報告、學術 framing
   - Problem statement
   - Method（experiment design）
   - Results（heatmap / pareto / failure analysis）
   - Discussion（why 某 engine × harness 組合最佳、failure mode 解讀）
   - Conclusion + LL playbook 建議

2. **slide deck** — 13-15 張、cell2sentence_slides 風格
   - 給 colombo 元智課程交差用
   - 也可剪出 RR / DD 教材素材

3. **EE tier-aware routing 建議** — labs/findings.md 末段、給公關長 v0.2.5 落地用
   ```
   tier=free + 文字輸入 → @cf/meta/llama-3.1-8b-instruct + L2 harness
   tier=pro + 文字輸入  → @cf/moonshotai/kimi-k2.6 + L0 harness
   tier=free + vision   → llama-3.2-vision + L0 + regex preprocess
   tier=pro + vision    → llama-3.2-vision + L0 / 升 GCP Vision API
   ```

4. **LL 通用 ML eval template** — `labs/eval-harness-template/` 可供其他 LL 專案複製
   - 未來 II widget / yeyan / agent-stream 做同樣實驗時、直接 fork

---

## 九、Roadmap（粗估）

| 階段 | 內容 | 估時 |
|---|---|---|
| Day 1 | 實驗主理人 onboarding、讀文件、列關鍵問題 | 半天 |
| Day 1-2 | colombo + 實驗主理人對齊樣本集規模、engine pool 精選、harness 級別、跑全矩陣 vs 精選 | 半天 |
| Day 2-3 | colombo 收集 + 標註樣本（並行）| 1 天 |
| Day 3-4 | 實驗主理人寫 evaluation harness（labs/eval/run.ts）| 1-1.5 天 |
| Day 4-5 | 跑全矩陣、debug、quota 平衡、收 metrics | 1 天 |
| Day 5-6 | 分析、生圖、寫 findings.md | 1 天 |
| Day 6-7 | slide deck | 1 天 |

→ 預估 **6-7 天 wall-clock**（含 colombo 收樣本的時間）、純工作日約 4-5 天。

期末 deadline 6/15 / 6/20、有足夠 buffer。

---

## 十、Out of scope（本實驗不做）

- ❌ **人格層（依依 reply generation）的 engine 對比** — 留下一輪、本實驗只攻數據層
- ❌ **tier-aware routing 真實作** — EE v0.2.5 才做、本實驗是先「**知道**」哪組配置好
- ❌ **跨家 cloud fallback chain**（Gemini / GCP Vision / Ollama）— 本實驗只在 CF Workers AI 內、避免變量爆炸
- ❌ **動態 RL policy** — 本實驗是「靜態 sweep」、不是 online learning
- ❌ **EE 主線開發**（src/ / functions/ / public/）— 公關長 scope、實驗主理人不碰

---

## 十一、相關文件

| 路徑 | 性質 |
|---|---|
| `expense-echo/CLAUDE.md` | LL 通用員工手冊 |
| `expense-echo/PROJECT.md` | EE 專案定位 |
| `expense-echo/docs/strategy.md` | EE 戰略憲法（§十點五 雙層 LLM）|
| `expense-echo/schema.sql` | 現有 D1 schema |
| `expense-echo/src/text.ts` | 現有 text parser、L0 harness 範例 |
| `expense-echo/src/vision.ts` | 現有 vision parser、含 fallback chain |
| `leaflune/notes/ll-antifragility-via-task-maturation.md` | LL 4 階梯戰略（時間軸框架）|
| `matrix-manager/meetings/2026-05-22-ll-antifragility-and-multi-race-ai-organization.md` | 蓮藕 vs 香腸鏈、異種人工廠 |
| `matrix-manager/meetings/2026-05-22-cloud-infrastructure-survey-and-llm-fallback-chain.md` | 執行長工程實作層、跨家 fallback chain |
| `matrix-manager/infrastructure.md` §3.1 | CF Workers AI 已用資源 |
| `matrix-manager/playbooks/cloudflare-deployment.md` | CF deploy + secrets 操作 know-how |

---

## 十二、給接手實驗主理人的話

歡迎、你是 EE 派遣的「**數據層 engine × harness 壓測實驗主理人**」、跟 EE 公關長（infinity-identity/bc20d23b）配合、但你**不是公關長**——你是獨立的實驗角色、scope 限於 `labs/`。

第一步請：

1. **讀完 §十一 列的 11 份文件**（按順序、不用全讀完才開工、但要建立全景）
2. **特別精讀 §三（design space）+ §四（樣本集）+ §五（指標）+ §六（流程）**
3. **整理你接手後第一輪會問 colombo 的 3-5 個關鍵問題**
4. **等 colombo 從 VS Code Claude Code 跟你直接對話、再正式開工**

可能會問的方向（給你參考、實際題目你自己組）：
- engine pool 精選哪 6-8 個？砍掉哪幾個？依據是什麼？
- harness L0-L4 五個都要跑、還是先 L0+L2+L3 三個？
- 樣本集規模 30 / 50 / 100 哪個 sweet spot？
- ground truth 標註要不要用 schema validator？
- 跑全矩陣的 Neurons budget 上限訂多少？
- 失敗 case 要不要分類成 taxonomy？

最後、未來你會需要：
- 替自己想個花名 / 角色定位（建議：EE 實驗員 / EE 研究員 / EE ML 工程師）
- 寫進 `matrix-manager/memory/agents-register.md`（這條由秘書長 MM 處理、不是你）

祝順利。

---

## 一句話

> **EE 數據層的 engine × harness 二維壓測、是 LL 第一次系統性 ML 實驗、產出不只是 EE 期末報告、是 LL 全宇宙未來「異種人工廠」routing 決策的依據。**
