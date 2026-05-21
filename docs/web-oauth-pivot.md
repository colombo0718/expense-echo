# EE Web-only Pivot + Google OAuth 施工計畫

- 日期：2026-05-21
- 作者：LL 公關長（infinity-identity/bc20d23b）
- 對應會議：[2026-05-20 EE 啟動](C:/Users/USER/matrix-manager/meetings/2026-05-20-expense-echo-launch-and-cf-warmup.md)、[2026-05-21 EE 接手 + pivot review](C:/Users/USER/matrix-manager/meetings/2026-05-21-ee-takeover-and-web-only-pivot-review.md)

---

## 一、目標

把 EE 從「LINE webhook 骨架」轉成「Pages + Functions + Google OAuth 強制登入」的 web-only 應用。

雙層價值：
1. **EE 自身**：期末報告 demo 可用、零元上線
2. **II 的白老鼠**：CF Pages 部署、Google OAuth 流程、D1 session token、Cookie 策略——全部先在 EE 走通，原樣搬到 II Phase 1–3

---

## 二、範圍邊界

### in scope（本次做）

- 拔 LINE：刪 `src/line.ts` + `src/index.ts` + LINE env 變數
- 架構切換：`src/` → `functions/api/`（Pages Functions）+ `public/`（前端）
- 強制 Google OAuth 登入（未登入無法用任何 API）
- D1 session token + cookie（單域名模式、`*.pages.dev`）
- schema 重寫：users 升級 II 風 / 加 sessions / expenses.user_id FK / 加 currency / 加 ai_runs metrics
- 文字記帳 E2E（最簡路徑驗證 D1 / AI binding）
- 圖片記帳 E2E（保留 R2 暫存 + Vision 解析）

### out of scope（之後另開）

- PBKDF2 / email-password 註冊（II Phase 2 才驗）
- LINE 通道（永久 archived、不再做）
- 語音模式（Whisper STT + melotts TTS、期末壓測後再說）
- 條碼 / 電子發票補價（v0.1 後再做）
- 跨 user / 家庭共用 / 隱私邊界
- 跨域 cookie（要 `.leaflune.org` 父網域、EE 收進 II 時才做）
- 「echo 君」人格定義（按 5/19 AA 拆分原則、留 placeholder 連結 AA repo）

---

## 三、推進順序

| # | 步驟 | 觸碰檔案 | 完成判準 |
|---|------|---------|---------|
| 0 | PLAN + 文檔更新（本輪） | PROJECT / TODO / schema / CHANGELOG / README / wrangler / .dev.vars.example / 本 PLAN | colombo 點頭 |
| 1 | 拔 LINE | 刪 `src/line.ts` + `src/index.ts`、改 `wrangler.toml` Pages 模式 | `git diff` 乾淨、Pages 模式 |
| 2 | D1 真建 + schema 跑通 | `wrangler d1 create expense-echo-db`、`wrangler d1 execute --file schema.sql`、把 ID 填回 `wrangler.toml` | `SELECT * FROM users` 不報錯 |
| 3 | GCP OAuth 申請（LL 共用一張） | Google Cloud Console 開「LeafLune SSO」OAuth Client、redirect URIs 一次填 EE + II 共 5 條 | 拿到 CLIENT_ID + SECRET、寫進 Pages dashboard secrets |
| 4 | OAuth 三檔 | `functions/api/auth/google-start.ts` + `google-callback.ts` + `me.ts` + `logout.ts` | 從 `/login.html` 點 → Google → 回到首頁帶 session cookie |
| 5 | 前端骨架 | `public/index.html` + `public/login.html` + `public/app.js` | 未登入 → 自動轉 login；登入後看到「歡迎 {name}」 |
| 6 | 文字記帳 E2E | `functions/api/parse-text.ts`（複用 `src/text.ts`）+ `app.js` 文字框 | 輸入「便當 90」→ D1 多一筆、回頁顯示金額 |
| 7 | 圖片記帳 E2E | `functions/api/parse-image.ts`（複用 `src/vision.ts` + R2 寫入）+ `app.js` 拍/拖照片 | 上傳收據 → R2 落地 + D1 落地 + 頁面顯示解析結果 |
| 8 | metrics 接線 | parse-text / parse-image 每次呼叫寫 `ai_runs` | `SELECT COUNT(*) FROM ai_runs` 隨用量增加 |
| 9 | CF Pages 部署 | CF Dashboard → connect repo → push 觸發 build；Settings → Functions → Bindings 設 D1 / R2 / AI；Settings → Environment 設 OAuth secrets | `*.pages.dev` 開站可登入可記帳 |

每步完成 commit、push、繁體中文 commit message。

---

## 四、最終目錄結構

```
expense-echo/
├── docs/
│   └── web-oauth-pivot.md          # 本檔
├── public/
│   ├── index.html                  # 主頁（需登入）
│   ├── login.html                  # 登入頁
│   ├── app.js                      # 前端互動
│   └── styles.css
├── functions/
│   └── api/
│       ├── auth/
│       │   ├── google-start.ts     # 產 OAuth URL + state cookie
│       │   ├── google-callback.ts  # 換 token / upsert user / 發 session
│       │   ├── me.ts               # 回 { id, email, name, tier }
│       │   └── logout.ts           # 砍 D1 session + 清 cookie
│       ├── parse-text.ts           # 文字記帳
│       ├── parse-image.ts          # 圖片記帳
│       └── expenses.ts             # 列我的記帳（之後）
├── src/                            # 純 lib、不再是 Worker 入口
│   ├── vision.ts                   # 保留、complement fallback chain
│   ├── text.ts                     # 保留
│   ├── db.ts                       # 擴增 user upsert + session CRUD
│   ├── auth.ts                     # 新：cookie / session 工具
│   └── types.ts                    # 改：刪 LineEvent、加 User / Session
├── schema.sql                      # 重寫
├── wrangler.toml                   # Pages 模式
├── package.json
├── tsconfig.json
├── .dev.vars.example               # OAuth secrets 範本
├── README.md / PROJECT.md / CLAUDE.md / TODO.md / ROUTINE.md / CHANGELOG.md
```

---

## 五、Schema v1（重寫、不做 migration）

```sql
-- 借 II PROJECT.md 已定案的 users 結構
CREATE TABLE users (
  id TEXT PRIMARY KEY,                       -- UUID
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  tier TEXT NOT NULL DEFAULT 'free',         -- 'free' | 'pro' | 'admin'
  entry_source TEXT NOT NULL DEFAULT 'google', -- EE 都是 google
  google_sub TEXT UNIQUE,                    -- Google 帳號 sub claim
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);
CREATE INDEX idx_sessions_user ON sessions(user_id);

CREATE TABLE expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TWD',      -- future-proof
  category TEXT,
  vendor TEXT,
  items TEXT,
  raw_text TEXT,
  image_key TEXT,
  ts INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX idx_expenses_user_ts ON expenses(user_id, ts DESC);

-- 期末報告壓測用
CREATE TABLE ai_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT REFERENCES users(id),
  model TEXT NOT NULL,                       -- '@cf/meta/llama-3.2-11b-vision-instruct' 等
  task TEXT NOT NULL,                        -- 'vision' | 'text'
  latency_ms INTEGER,
  neurons REAL,
  ok INTEGER NOT NULL,                       -- 1/0
  error TEXT,
  ts INTEGER NOT NULL DEFAULT (unixepoch())
);
```

舊 schema 全砍、CHANGELOG 標 v0.1.0 break。

---

## 六、Cookie 策略

| 模式 | 條件 | 設定 |
|------|------|------|
| 開發 | `wrangler pages dev` | `Secure=false`、`SameSite=Lax`、無 Domain |
| 生產 | `*.pages.dev` | `Secure=true`、`SameSite=Lax`、`HttpOnly`、無 Domain（單域名）|
| 未來 | `ee.leaflune.org`（收進 II 時）| 加 `Domain=.leaflune.org`、跟 II SSO 共享 |

Session token = `crypto.randomUUID()` × 2 拼接、30 天有效、寫 D1 sessions 表。

---

## 七、Definition of Done

- [ ] `*.pages.dev` 可開站
- [ ] 未登入訪問任何 API → 401
- [ ] 點「用 Google 登入」→ 回來頁面看到自己名字
- [ ] 文字記帳 + 圖片記帳都跑得通、D1 寫得進去
- [ ] `ai_runs` 表有資料
- [ ] LINE 相關程式碼 0 殘留
- [ ] PROJECT.md / TODO.md / schema.sql / CHANGELOG.md 都同步到本 PLAN
- [ ] git log 看得到 pivot 里程碑 commit

---

## 八、已拍板事項（2026-05-21）

1. **CF Pages 專案名 = `expenseecho`**（無 dash、對齊 leaflune / reinroom / datadojo / cubiccraft 慣例）→ URL = `expenseecho.pages.dev`
2. **GCP OAuth Client 走 LL 共用一張**：
   - GCP project 名：`LeafLune`、OAuth Client 名：`LeafLune SSO`
   - Consent screen App name = `LeafLune`、Authorized domains = `leaflune.org` + `pages.dev`
   - Scopes 只勾 `openid` + `email` + `profile`（避免送審）
   - Authorized redirect URIs（一次填齊、II / 未來 RR / DD 接 SSO 直接複用）：
     ```
     http://localhost:8788/api/auth/google-callback        # EE 開發
     https://expenseecho.pages.dev/api/auth/google-callback # EE 上線
     http://localhost:8788/auth/google-callback             # II 開發
     https://id.leaflune.org/auth/google-callback           # II 上線
     https://dev-id.leaflune.org/auth/google-callback       # II tunnel
     ```
   - colombo 親自申請、CLIENT_ID + SECRET 經閘門協定交付
3. **II 暫不動**：EE 衝完一輪、把可複用部分（OAuth flow / cookie helper / session schema）文件化、II 起跑時拷貝
4. **無 deadline 壓力**：期末 6/15 還很遠、優先把流程踩乾淨、不為 demo 走捷徑

---

## 九、風險 & fallback

| 風險 | 機率 | fallback |
|------|------|---------|
| GCP OAuth 申請卡住 / redirect URL 錯 | 中 | 先做匿名版本（localStorage UUID）跑 E2E、OAuth 平行處理 |
| Llama Vision 模型 5007 已下架 | 中 | vision.ts 加 fallback chain（試 Llama 3.2 vision → llava → 問 user） |
| `wrangler pages dev` 本機跑不起來 | 低 | 直接 push 到 Pages preview 環境測 |
| D1 寫入 eventually consistent 觸發 demo 撞牆 | 低 | 寫完立刻讀同一筆有保證 read-your-writes、demo 不會撞 |
| CF Workers AI Neurons 用爆 | 低 | 10K Neurons/day = 約 33 場壓測；ai_runs metrics 監控 |

---

## 十、一句話

> 拔 LINE、上 Google、走完一遍 CF Pages + OAuth + D1 + R2 + Workers AI 五件套——期末報告交一個 demo、II Phase 1 拿一份 template、會員制走完一個試點。
