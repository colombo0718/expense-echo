# PROJECT.md — Expense Echo（消費回響）

## 這是什麼

LINE 記帳 chatbot、定位 LL 宇宙 **EE 子品牌**。

兩個價值：
1. **對外**：個人記帳工具、免費版自己記、會員版有歷史關係性回饋（「上次跟女友去 Costco 花了多少」）
2. **對內**：LL 正式遷往 Cloudflare 全家桶前的技術原型、所有 deploy pattern 之後可複製到 II / 葉衍君 / 任一新專案

跟 II 的關係：概念上屬 II（user-facing 個人資料軸）、實作上獨立 repo。II 成熟後納入或整合、看屆時情況。

---

## 部署方式

- **平台**：Cloudflare 全家桶（Workers + D1 + R2 + Workers AI）
- **入口**：`*.workers.dev`（之後可掛 `ee.leaflune.org`）
- **CI/CD**：Workers 直接 `wrangler deploy`、Pages 用 git push 觸發

---

## 架構概覽

```
LINE User
  │ 推訊息（圖片 / 文字）
  ▼
LINE Messaging API webhook
  │ POST /callback
  ▼
Cloudflare Worker（src/index.ts）
  │
  ├─ 圖片 → R2 暫存 → Workers AI（Llama 3.2 Vision）
  │   └─ 抽出 { 店家, 日期, 總額, 品項 } JSON
  │
  ├─ 文字 → Workers AI（Llama 3.x text）解析
  │   └─ 抽出 { 品項, 金額, 分類 }
  │
  ├─ D1 寫入 expenses 表
  │
  └─ LINE Reply / Push API 回應
```

---

## 目錄結構

```
expense-echo/
├── src/
│   ├── index.ts         # Worker 入口、LINE webhook 路由
│   ├── line.ts          # LINE API client（reply / push / 下載 image）
│   ├── vision.ts        # Workers AI 視覺呼叫 + JSON 抽取
│   ├── text.ts          # 文字訊息解析
│   ├── db.ts            # D1 query 封裝
│   └── types.ts         # 共用型別
├── schema.sql           # D1 表結構
├── wrangler.toml        # Workers 設定（含 AI / D1 / R2 binding）
├── package.json
├── tsconfig.json
├── .dev.vars.example    # 本機開發環境變數範本
├── .gitignore
├── README.md
├── PROJECT.md           # 本檔
├── CLAUDE.md            # AI 員工手冊（從 MM 複製）
├── TODO.md              # 待辦 + ⬡ MM 同步表
├── ROUTINE.md           # 例行檢查
└── CHANGELOG.md         # 里程碑
```

---

## 通訊協定

**LINE webhook payload**：標準 LINE Messaging API、events 陣列、每個 event 含 source.userId + message.type / id

**Worker → Workers AI**（vision）：
```ts
const res = await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
  image: [...uint8Array],
  prompt: '從收據抽出：店家、日期、總額、品項清單。回 JSON。',
});
```

**D1 schema**（簡化）：
```sql
CREATE TABLE expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,          -- LINE userId
  amount INTEGER,
  category TEXT,
  vendor TEXT,
  items TEXT,            -- JSON array
  raw_text TEXT,         -- 原始訊息 / OCR
  image_key TEXT,        -- R2 object key（可選）
  ts INTEGER             -- unix timestamp
);
```

---

## 已知注意事項

- Workers free tier 單 request CPU 10ms、Vision 推理可能超時（會升 paid tier 50ms）。先測再決定。
- LINE Push API 每月 200 則免費；reply API 不限、優先用 reply。
- D1 在 region 邊緣複寫、寫入有 eventually consistent 延遲、記帳場景不影響。
- Workers AI 視覺模型在中文 OCR 上**準度不保證**、要實測。fallback 路徑：問 user。

---

## 開發規範

- commit 訊息：繁體中文
- TypeScript strict
- 單一檔案不超過 500 行
- 所有外部 API key 走 wrangler secret、不進 git
- 期末報告版本拉 `release/class-demo-2026-05` 分支保存

---

## 與 LL 宇宙的關係

| 對應 | 角色 |
|---|---|
| LL（matrix-manager） | EE 的治理 / 任務歸屬 |
| II（infinity-identity） | EE 累積的 user 消費 history、未來會餵進 II 的關係資料 |
| AA（agent-avatar） | EE 的 chatbot 角色定義（暫定：echo 君、口語溫和） |
| CF 全家桶 | EE 是 LL 第一個 CF 全站試點、之後 yeyan / II 可比照 |
