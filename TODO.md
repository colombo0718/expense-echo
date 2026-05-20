# TODO — Expense Echo

## ⬡ MM 同步

| title | status | importance | energy | effort | due | next_action | tags |
|-------|--------|------------|--------|--------|-----|-------------|------|
| LINE OA channel 設定 + webhook 接通 | active | 1 | l | 60 | 2026-05-22 | 申請 LINE Developer channel、拿 channel secret / token | line,setup |
| Workers + D1 + R2 + AI 全家桶 hello world | active | 1 | m | 90 | 2026-05-22 | wrangler init、設好 binding、Workers AI 試打一張收據 | cf,setup |
| Llama 3.2 Vision 收據解析 prompt 調校 | queued | 1 | h | 120 |  | 準備 5 張不同店家收據樣本、寫測試 script | ai,prompt |
| 文字訊息解析（口語記帳） | queued | 1 | m | 90 |  | prompt template + 結構化抽取 | nlp |
| 條碼補價（OpenFoodFacts 整合） | idea | 2 | l | 60 |  | 等收據主流程穩 | barcode |
| 期末報告版本：壓測 + 結果分析 | active | 1 | h | 240 | 2026-06-15 | 跑 config 拆題 stress test、收結果做圖 | report |
| 期末報告 slide deck | active | 1 | m | 180 | 2026-06-20 | 沿 cell2sentence_slides 風格、Problem-Method-Result 結構 | report |
| 會員制 echo（歷史關係性回饋） | idea | 3 | h | 480 |  | 等核心穩、有 user data 才有意義 | membership |

---

## 詳細

### MVP（兩週內出 demo）

- [ ] **LINE channel 設定**
  - 申請 LINE Developer Account → 建 Messaging API channel
  - 拿 `LINE_CHANNEL_SECRET` + `LINE_CHANNEL_ACCESS_TOKEN`
  - 註冊 webhook URL（指向 *.workers.dev）

- [ ] **Cloudflare 環境**
  - `wrangler init` 起 Worker 專案
  - 建 D1 database（`wrangler d1 create expense-echo-db`）
  - 建 R2 bucket（`wrangler r2 bucket create expense-echo-receipts`）
  - 確認 Workers AI binding（`[ai]` block）

- [ ] **Hello world webhook**
  - 收到 LINE event → log 到 D1 → reply 回 user
  - 確認 channel secret 簽章驗證

- [ ] **Vision 流程**
  - 收到 image event → fetch image binary from LINE
  - 暫存 R2（key = `<userId>/<messageId>.jpg`）
  - 餵 Workers AI Llama 3.2 Vision、prompt 要求 JSON 輸出
  - parse JSON → 寫 D1 → reply user「記到了：7-11 156 元」

- [ ] **Text 流程**
  - 收到 text → Workers AI text 模型解析
  - 抽 `{ 品項, 金額, 分類? }`
  - 不確定就反問 user

### 期末報告 track（六月中）

- [ ] **壓測流程**
  - 設計 config：店家種類 × 收據品質 × 模糊度 × 中英文混雜
  - 跑 50-100 張、收 vision 模型輸出
  - 量化：欄位正確率、JSON 格式合法率、推理時間
  - 跟 baseline（純 OCR + 規則式）比較

- [ ] **報告 slide deck**
  - 沿用 cell2sentence_slides 風格
  - 13-15 張：Cover / Outline / Problem / Method / Stress Test / Results / Discussion / Conclusion
  - 強調 AI 元素：vision-language 模型、controlled prompt perturbation

### 未來（會員化、整合進 II）

- [ ] 歷史關係性回饋（會員價值）
- [ ] 跨 user 隱私邊界設計
- [ ] II 整合：把 EE 累積的 user 消費 history 餵進 II 的關係資料

---

## 擱置

- **自有網域**：先不買、`*.workers.dev` 夠用、課程結束後若繼續再評估
- **付費 LLM API**：堅持 Workers AI 跑 Llama、$0 是賣點
