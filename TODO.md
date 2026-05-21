# TODO — Expense Echo

> 對應施工計畫：[`docs/web-oauth-pivot.md`](docs/web-oauth-pivot.md)

---

## ⬡ MM 同步

| title | status | importance | energy | effort | due | next_action | tags |
|-------|--------|------------|--------|--------|-----|-------------|------|
| Pivot Step 1：拔 LINE | active | 1 | l | 30 | | 刪 src/index.ts / src/line.ts、wrangler.toml 改 Pages | pivot |
| Pivot Step 2：D1 真建 + schema v1 | active | 1 | l | 30 | | wrangler d1 create、execute schema.sql、ID 填回 wrangler.toml | cf,db |
| Pivot Step 3：GCP OAuth Client 申請 | active | 1 | m | 60 | | colombo 親自申請「LeafLune SSO」、5 條 redirect 一次填齊 | oauth,colombo |
| Pivot Step 4：OAuth 四檔 | queued | 1 | h | 240 | | google-start / google-callback / me / logout | oauth,backend |
| Pivot Step 5：前端骨架 | queued | 1 | m | 180 | | login.html + index.html + app.js + styles.css | frontend |
| Pivot Step 6：文字記帳 E2E | queued | 1 | m | 120 | | functions/api/parse-text.ts + 前端文字框 | ai,text |
| Pivot Step 7：圖片記帳 E2E | queued | 1 | h | 180 | | functions/api/parse-image.ts + R2 + Vision + 前端上傳 | ai,vision |
| Pivot Step 8：metrics 接線 | queued | 1 | l | 60 | | 每次 AI 呼叫寫 ai_runs | metrics |
| Pivot Step 9：CF Pages 部署 | queued | 1 | m | 90 | | Dashboard 連 repo + Bindings + OAuth secrets | deploy |
| Vision model fallback chain | queued | 2 | m | 60 | | Step 7 後加、避免 5007 下架重演 | reliability |
| 期末報告壓測 + 結果分析 | queued | 1 | h | 240 | 2026-06-15 | 5 張收據樣本 × 模糊度 × 中英文混雜、跑 ai_runs 統計 | report |
| 期末報告 slide deck | queued | 1 | m | 180 | 2026-06-20 | cell2sentence_slides 風格、Problem-Method-Result | report |
| Hands-free 語音模式（Whisper + melotts） | idea | 2 | h | 240 | | 主流程穩了再做、目標：開車情境 | voice |
| 條碼補價（OpenFoodFacts） | idea | 3 | l | 60 | | 主流程穩了再做 | barcode |
| 電子發票補價（財政部 API） | idea | 3 | m | 120 | | 要先申請 | invoice |
| 收進 II dashboard | idea | 2 | h | 360 | | II Phase 5 後評估、cookie 改父網域 | ii,integration |
| LINE channel | archived | — | — | — | | 永久放棄、web-only 就夠 | line |

---

## 詳細

### Pivot 推進順序（對應 docs/web-oauth-pivot.md §三）

#### Step 1：拔 LINE

- [ ] 刪 `src/line.ts`
- [ ] 刪 `src/index.ts`（Pages Functions 不用統一入口）
- [ ] 改 `src/types.ts`：刪 `LineEvent`、刪 `Env.LINE_*`、加 `User` + `Session`
- [ ] 改 `wrangler.toml`：拿掉 `main = "src/index.ts"`、Pages 模式

#### Step 2：D1 真建

- [ ] `wrangler d1 create expense-echo-db` → 拿 ID
- [ ] 把 ID 寫回 `wrangler.toml` `database_id`
- [ ] `wrangler d1 execute expense-echo-db --file=schema.sql --local` 本機建表驗證
- [ ] `wrangler d1 execute expense-echo-db --file=schema.sql --remote` 雲端建表

#### Step 3：GCP OAuth Client 申請（colombo 經手）

- [ ] GCP project：`LeafLune`
- [ ] OAuth consent screen：App name = LeafLune、scopes = openid + email + profile
- [ ] OAuth Client ID：`LeafLune SSO`、Web application
- [ ] Authorized redirect URIs 一次填齊（EE 2 條 + II 3 條）
- [ ] 拿到 CLIENT_ID + SECRET、丟給公關長寫 wrangler secret

#### Step 4：OAuth 四檔

- [ ] `functions/api/auth/google-start.ts`
- [ ] `functions/api/auth/google-callback.ts`
- [ ] `functions/api/auth/me.ts`
- [ ] `functions/api/auth/logout.ts`
- [ ] `src/auth.ts`（cookie / session helper）
- [ ] `src/db.ts` 加 user / session CRUD

#### Step 5：前端骨架

- [ ] `public/login.html`（單一「用 Google 登入」按鈕）
- [ ] `public/index.html`（已登入主頁、未登入 redirect login）
- [ ] `public/app.js`（fetch /api/me、fetch /api/parse-* ）
- [ ] `public/styles.css`

#### Step 6：文字記帳 E2E

- [ ] `functions/api/parse-text.ts`（從 cookie 取 user、呼叫 src/text.ts、寫 D1）
- [ ] 改 `src/text.ts`：改用 `messages` 格式、加 `temperature: 0`
- [ ] 前端文字框 → POST 顯示結果

#### Step 7：圖片記帳 E2E

- [ ] `functions/api/parse-image.ts`（multipart、R2 寫入、Vision 解析、寫 D1）
- [ ] 改 `src/vision.ts`：改用 `messages` 格式、加 `temperature: 0`、加 fallback chain
- [ ] 前端拍 / 拖照片 → POST 顯示結果

#### Step 8：metrics

- [ ] `src/db.ts` 加 `logAiRun()`
- [ ] parse-text / parse-image 每次呼叫前後計時 + 寫 ai_runs

#### Step 9：CF Pages 部署

- [ ] CF Dashboard → Workers & Pages → Create → Connect to Git → 選 expense-echo repo
- [ ] Settings → Functions → Bindings：D1（DB）/ R2（RECEIPTS）/ AI
- [ ] Settings → Environment → Secrets：GOOGLE_CLIENT_ID、GOOGLE_CLIENT_SECRET、SESSION_COOKIE_SECRET
- [ ] git push → 自動部署
- [ ] 開 `https://expense-echo.leaflune.org` → 點登入 → 跑通

---

### 期末報告 track（無 deadline 壓力）

- [ ] 壓測 config：店家 × 收據品質 × 模糊度 × 中英文混雜
- [ ] 跑 50–100 張、收 ai_runs 統計
- [ ] 量化：欄位正確率、JSON 格式合法率、推理時間
- [ ] slide deck：cell2sentence_slides 風格、13–15 張

### 未來（收進 II 時做）

- [ ] cookie domain 改 `.leaflune.org` 父網域
- [ ] EE D1 user 資料併入 II users 表
- [ ] EE UI 改成 II dashboard 內的一個 tab / widget
- [ ] entry_source 邏輯統一走 II

---

## 擱置

- **LINE channel**：永久放棄、web-only 就夠
- **自有網域**：`*.pages.dev` 夠用、未來收進 II 時直接掛 leaflune 子網域
- **付費 LLM API**：堅持 Workers AI 跑 Llama、$0 是賣點
- **PBKDF2 / email-password 註冊**：EE 純 OAuth、留給 II Phase 2 驗
