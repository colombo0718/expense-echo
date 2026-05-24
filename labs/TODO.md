# TODO — EE labs（engine × harness 壓測）

> 對應任務書：[`experiment-engine-harness-matrix.md`](experiment-engine-harness-matrix.md)
> Scope：只動 `labs/`、不碰 EE 主線

---

## ⬡ MM 同步

| title | status | importance | energy | effort | due | next_action | tags |
|-------|--------|------------|--------|--------|-----|-------------|------|
| Engine pool 鎖定 8 模型 | done | 1 | l | 60 | | 完成、見 engines.json | engine |
| Schema 解析 utility（legacy + OpenAI）| done | 1 | l | 30 | | 完成、寫在 ping_models.py | infra |
| 樣本集 120 條 × 12 題型 | done | 1 | h | 180 | | 完成、見 samples.json | sample |
| 憑證 .env（CF token + account ID）| done | 1 | l | 15 | | 完成、token 從 leaflune/.env 借 | infra |
| Harness L0 定稿 + Python module | done | 1 | h | 60 | | 完成、見 harness/L0.md + harness/l0.py | harness |
| Harness L1-L4 設計 | idea | 2 | h | 240 | | 依 L0 結果再決定要不要寫、過篩策略 | harness |
| Evaluation runner（Stage 1：L0 全 8 engine 跑滿 960 runs）| active | 1 | m | 120 | | 讀 engines.json + samples.json + harness.l0、輸出 JSONL | runner |
| Metrics 計算（accuracy / json_valid / failure_mode）| queued | 1 | m | 60 | | runner 跑完寫、評分 utility | metrics |
| 本地 SQLite DB（evaluation_runs 表）| queued | 2 | l | 30 | | 若 JSONL 不夠用再加 | db |
| 分析 + 生圖（heatmap / pareto / failure taxonomy）| queued | 1 | h | 240 | | Stage 1 結果出來才開、pandas + matplotlib | analysis |
| 期末 deliverables（findings.md + slide deck）| queued | 1 | h | 480 | 2026-06-15 | 13-15 張、Problem-Method-Result-Discussion | report |
| LL 通用 ML eval template | queued | 2 | m | 120 | | 跟 findings 一起出、給 II / yeyan 複用 | template |
| 替自己想花名 / 角色定位 | queued | 3 | l | 15 | | 等 colombo 拍板、由 MM 寫入 agents-register.md | meta |

---

## 進度時間軸

| 日期 | 完成 |
|---|---|
| 2026-05-23 | Onboarding、engine pool 收斂、ping 全 catalog（37 個 text 模型 35 活）、樣本集 120 條造完 |
| 2026-05-24 | T5 改造（情緒贅詞 → 缺品項記帳、保留情緒層）、T4-006 補品項、付費自訂分類進主 TODO.md、L0 prompt 定稿 + harness/l0.py 寫好、改採 Stage 過篩策略（L0 先跑、依結果決定 L1-L4）|

---

## 已鎖定 8 engine（見 engines.json）

| # | 公司 | 模型 | 規模 | 蓮藕/香腸 |
|---|---|---|---|---|
| 1 | Meta | llama-3.2-1b | 1B | 香腸極小 |
| 2 | IBM | granite-4.0-h-micro | 3B | 香腸小 |
| 3 | Google | gemma-3-12b-it | 12B | 中庸 |
| 4 | Mistral | mistral-small-3.1-24b | 24B | 中庸 |
| 5 | Qwen | qwen2.5-coder-32b | 32B | 中庸偏蓮藕 |
| 6 | DeepSeek | r1-distill-qwen-32b | 32B | 推理特化蓮藕（thinking 烤死、不關）|
| 7 | OpenAI | gpt-oss-120b | 120B | 蓮藕（規模）|
| 8 | Moonshot | kimi-k2.6 | 1T MoE | 規模旗艦蓮藕 |

---

## 12 題型總覽（見 samples.json）

| Tier | Type | 名稱 | 鑑別點 |
|---|---|---|---|
| 1 | T1 | 極簡記帳 | baseline 下限 |
| 1 | T2 | 含店家完整 | vendor 抽取 |
| 1 | T3 | 多品項列表 | items 拆解 + 加總 |
| 2 | T4 | 口語敘述 | 動詞 / 時間副詞干擾 |
| 2 | T5 | 缺品項記帳 | items=[]、抗 hallucinate |
| 2 | T6 | 多語混雜 | 中英台越日粵碼切換 |
| 3 | T7 | 錯字/typo | 拼字容錯 |
| 3 | T8 | emoji 符號 | 非字元干擾 |
| 3 | T9 | 閒聊夾雜 | 訊號雜訊比低 |
| 4 | T10 | 邊界數值 | 0 / 負 / 極端 / 小數 |
| 4 | T11 | 非記帳意圖 | intent classification |
| 4 | T12 | prompt injection | 安全 / 抗指令注入 |

---

## 待對齊（colombo 拍板）

- [ ] Neurons 預算上限 / 每天可跑幾輪全矩陣
- [ ] DeepSeek 是否真的留（接受 thinking 慢 + 貴的成本）
- [ ] 邊界 case ground truth（T10-002「-50」、T10-004「撿到 100」是不是 intent=other）

---

## 不做（out of scope）

- ❌ 人格層（依依 reply generation）的 engine 對比
- ❌ tier-aware routing 真實作（v0.2.5 才做）
- ❌ 跨家 cloud fallback（Gemini / GCP Vision / Ollama）
- ❌ vision 收據題庫（colombo 拍板：本實驗只攻文字）
- ❌ EE 主線開發（src/ / functions/ / public/）
