# PROJECT.md — Expense Echo（消費回響）

## 別名 / 搜尋關鍵字

- `expense-echo`（repo 名 + CF Pages 專案名、對齊）
- `EE`（雙字母代號）
- `記帳`、`收據`、`vision`、`消費回響`（功能脈絡）

---

## 這是什麼

**LL 第一個全 CF 全家桶 + 會員制練手場**。

對外：web 記帳工具，拍收據 / 講一句話 / 自動入帳，未來收進 II dashboard 當會員小彩蛋。
對內：CF Pages + Functions + D1 + R2 + Workers AI + Google OAuth 一條龍走通、所有 pattern 之後搬到 II Phase 1。

**終局定位**：EE 不獨立成子品牌、最終收進 II dashboard 當會員彩蛋功能。獨立 repo 只為練手時隔離爆炸範圍。

---

## 三重價值

| 對 | 價值 |
|---|---|
| **元智生資課期末報告** | Vision-language 模型 OCR + 理解 + 分類 demo + 壓測流程 + controlled prompt perturbation 分析 |
| **LL 內部 CF 練手** | 第一個全 CF 試點、deploy / binding / OAuth / session 全 pattern 之後可複製 |
| **LL 會員制先行者** | Google OAuth + D1 session + cookie 雙模式先在 EE 走通、II Phase 1 直接拷貝 |

---

## 部署方式

- **平台**：Cloudflare Pages（前端 + Functions）+ D1 + R2 + Workers AI
- **URL**：`https://expense-echo.leaflune.org`（自有子網域、`expense-echo.pages.dev` 為 CF 預設 fallback；未來收進 II 後可改合進 `id.leaflune.org/dashboard`）
- **CI/CD**：git push → CF Pages 自動部署、不需本機 wrangler

---

## 架構概覽

```
未登入用戶
  │ 開 expense-echo.leaflune.org
  ▼
public/login.html — 「用 Google 登入」按鈕
  │ 點 → /api/auth/google-start
  ▼
Google OAuth Consent（品牌：LeafLune）
  │ 用戶授權後回 redirect
  ▼
/api/auth/google-callback
  │ 換 token → 拉 userinfo → upsert users → 建 sessions → set cookie
  ▼
public/index.html（已登入主頁）
  │
  ├─ 文字記帳：app.js POST /api/parse-text
  │   └─ Workers AI text → parse → D1 expenses
  │
  ├─ 圖片記帳：app.js POST /api/parse-image（multipart）
  │   └─ R2 暫存 → Workers AI Vision → parse → D1 expenses
  │
  └─ 每次 AI 呼叫寫 ai_runs metrics（期末壓測用）
```

未登入 access 任何 `/api/*` → 401。所有 API 從 session cookie 取 user_id、無 cookie 直接拒。

---

## 目錄結構

```
expense-echo/
├── docs/
│   └── web-oauth-pivot.md          # 施工計畫
├── public/                         # 靜態前端（Pages 自動 serve）
│   ├── index.html                  # 主頁（需登入）
│   ├── login.html                  # 登入頁
│   ├── app.js                      # 前端互動
│   └── styles.css
├── functions/                      # Pages Functions（filesystem routing）
│   └── api/
│       ├── auth/
│       │   ├── google-start.ts     # 產 OAuth URL + state cookie
│       │   ├── google-callback.ts  # 換 token / upsert user / 發 session
│       │   ├── me.ts               # 回 { id, email, name, tier }
│       │   └── logout.ts           # 砍 session + 清 cookie
│       ├── parse-text.ts           # 文字記帳
│       ├── parse-image.ts          # 圖片記帳
│       └── expenses.ts             # 我的記帳列表
├── src/                            # 純 lib（不再是 Worker 入口）
│   ├── vision.ts                   # Workers AI Vision 解析
│   ├── text.ts                     # 文字解析
│   ├── db.ts                       # D1 query（user / session / expense / ai_runs）
│   ├── auth.ts                     # cookie + session + OAuth helper
│   └── types.ts                    # Env / User / Session / ParsedExpense
├── schema.sql                      # D1 v1（users / sessions / expenses / ai_runs）
├── wrangler.toml                   # Pages 模式 + binding
├── package.json
├── tsconfig.json
├── .dev.vars.example
├── README.md / CLAUDE.md / TODO.md / ROUTINE.md / CHANGELOG.md
```

---

## 通訊協定

### Google OAuth flow

```
GET /api/auth/google-start
  → 產 state（random、寫 HttpOnly cookie）
  → 302 redirect 到 https://accounts.google.com/o/oauth2/v2/auth
     ?client_id=<LL_SSO>&redirect_uri=<callback>&response_type=code
     &scope=openid email profile&state=<state>

GET /api/auth/google-callback?code=...&state=...
  → 驗 state cookie
  → POST https://oauth2.googleapis.com/token 換 access_token + id_token
  → 解 id_token（JWT）取 sub / email / name
  → users 表 upsert（entry_source='google'）
  → sessions 表插一筆（token = crypto.randomUUID() × 2）
  → set cookie: session=<token>; HttpOnly; SameSite=Lax; Secure（prod）; Max-Age=30d
  → 302 回 /
```

### Session cookie 策略

| 模式 | 條件 | Domain | Secure |
|------|------|--------|--------|
| 開發 | `wrangler pages dev` | 無 | false |
| 生產 | `*.pages.dev` | 無（單域名）| true |
| 未來 | `*.leaflune.org`（收進 II） | `.leaflune.org` | true |

Token = `crypto.randomUUID()` × 2 拼接、30 天 TTL、寫 D1 `sessions` 表。撤銷 = DELETE D1 row。

### AI 呼叫

```ts
// Vision
const res = await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
  image: [...uint8Array],
  messages: [{ role: 'user', content: RECEIPT_PROMPT }],
  temperature: 0,                   // 結構化抽取、不要創意
  max_tokens: 512,
});

// Text
const res = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
  messages: [{ role: 'system', content: TEXT_PROMPT }, { role: 'user', content: userText }],
  temperature: 0,
});
```

每次呼叫前後寫 `ai_runs` 一筆（model / task / latency_ms / neurons / ok）。

---

## 已知注意事項

- Pages Functions 同 Workers runtime、CPU 限制 10ms（free）/ 50ms（paid）、Vision 推理可能超時
- D1 寫入 eventually consistent、但同連線 read-your-writes 有保證
- Workers AI 視覺模型中文 OCR 準度不保證、fallback：問 user
- Vision 模型可能下架（5007）、`vision.ts` 應該有 fallback chain
- Llama 3.2 Vision 對 `prompt` 欄位的服從度低於 `messages`、用 messages 格式

---

## 開發規範

- commit 訊息：繁體中文
- TypeScript strict、`@cloudflare/workers-types` ambient
- 單一檔案 ≤ 500 行
- 所有 secrets 走 wrangler secret（Pages dashboard）、不進 git
- 不寫無謂註解、不過度抽象
- 期末報告版本拉 `release/class-demo-2026-05` 分支保存

---

## 與 LL 宇宙的關係

| 軸 | 對應 | EE 的角色 |
|---|---|---|
| **LL**（World、matrix-manager） | 治理 / 任務歸屬 / 會議紀錄 | EE 是 LL 旗下練手專案、不獨立成子品牌 |
| **II**（User、infinity-identity） | 統一身份 + 會員 context | EE 是 II 的彩蛋功能、終局收進 II dashboard；現階段獨立練手、Google OAuth / session / cookie pattern 之後拷貝給 II |
| **AA**（Agent、agent-avatar） | agent 人格基因序列 | EE 暫無對話 agent（純表單 UI）；未來若加客服、走 II 的小葉 / 小月、不自養角色 |

**entry_source**：EE 的所有 user 都是 `entry_source='google'`、EE 自己不算一個來源。

---

## 戰略原則

> **EE 是 II 的微縮先行者、不是獨立產品。**
>
> 所有設計決策遵循「能讓 II 直接複用就複用」、不為 EE 自身做特化。
> 期末報告 demo 是順手收割、不是核心目標。
