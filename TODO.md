# TODO — Expense Echo

> 對應施工計畫：
> - v0.1 / v0.2 主線：[`docs/web-oauth-pivot.md`](docs/web-oauth-pivot.md)
> - v0.3 金流：[`docs/v0.3.0-donation-and-payment.md`](docs/v0.3.0-donation-and-payment.md)
> - v0.3 戰略：[`docs/payment-strategy.md`](docs/payment-strategy.md)
> - v0.3 貼圖：[`docs/yiyi-sticker-prompt-templates.md`](docs/yiyi-sticker-prompt-templates.md)

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
| v0.3 step 1：綠界商家申請 | active | 1 | l | 60 | | colombo 拿葉與月統編 + 身份證 + 銀行帳戶申請 | payment,colombo |
| v0.3 step 2：Gemini 生 5 張依依貼圖 | active | 1 | m | 30 | | colombo Nano Banana sweep + Imagen 4 定稿、見 sticker prompts | payment,assets,colombo |
| v0.3 step 3：schema v2（donations / unlock_grants / sticker_collection）| queued | 1 | l | 60 | | 三表 + users 擴欄 is_royal / pro_status / lifetime_donations | payment,db |
| v0.3 step 4：綠界 SDK src/payment/ecpay.ts | queued | 1 | h | 240 | | CheckMacValue 簽章 + createOrder + verifyCallback | payment,backend |
| v0.3 step 5：API endpoints | queued | 1 | h | 180 | | /api/donate/{create,ecpay-callback,return} + /api/me/{unlocks,stickers,pro-progress} | payment,backend |
| v0.3 step 6：依依 prompt 打賞段 | queued | 1 | m | 120 | | src/yiyi.ts + AA prompt-fragment.md 同步、5 檔台詞 + 寬鬆期 + 感恩冷卻 + LTV 稱呼 | payment,yiyi |
| v0.3 step 7：UI 打賞按鈕 + 5 檔 + 自訂金額 + 進度條 + paywall | queued | 1 | h | 240 | | 主畫面 🎁 入口 + 模態 + 進階功能 paywall | payment,ui |
| v0.3 step 8：進階功能解鎖 gate（後端 + 前端）| queued | 1 | m | 120 | | isFeatureUnlocked + free vs pro 行為分流 | payment,backend |
| v0.3 step 9：E2E + 真實付款測 + ship | queued | 1 | m | 90 | | 5 檔各測一次、Xuan is_royal bypass 測 | payment,ship |
| 付費會員自訂分類 | queued | 2 | m | 240 | v0.3 一部份 | D1 加 user_categories 表、LLM prompt 動態 inject、free → pro upsell hook | pro,plg |
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

### 期末報告 track（無 deadline 壓力、實驗員 0bc11ba1 主理）

- [ ] **派工已發**：EE 實驗員 session `0bc11ba1`、colombo 從 VS Code resume
- [ ] engine × harness 二維壓測（見 [`labs/experiment-engine-harness-matrix.md`](labs/experiment-engine-harness-matrix.md)）
- [ ] 6-8 個 CF Workers AI engine × L0/L2/L4 三級 harness
- [ ] 30-50 文字樣本 + 20-30 vision 樣本、colombo 標 ground truth
- [ ] 跑 ai_runs / evaluation_runs 統計
- [ ] slide deck：cell2sentence_slides 風格、13–15 張
- [ ] 結果回來、公關長接 v0.2.5 tier-aware routing 落地

### v0.3.0 金流軌（公關長主理、跟實驗員並行）

- [ ] **戰略文件**（已完）：[payment-strategy.md](docs/payment-strategy.md)
- [ ] **施工計畫**（已完）：[v0.3.0-donation-and-payment.md](docs/v0.3.0-donation-and-payment.md)
- [ ] **生圖 prompt**（已完）：[yiyi-sticker-prompt-templates.md](docs/yiyi-sticker-prompt-templates.md)
- [ ] colombo：綠界商家申請（葉與月工作室、3-7 天審）
- [ ] colombo：Gemini 生 5 張依依貼圖（半小時）
- [ ] 公關長：等綠界憑證、寫 code（schema / SDK / API / UI / 依依 prompt）
- [ ] ship：第一筆真實打賞 → 收第一筆營收

### 付費會員自訂分類（PLG hook）

**動機**：預設 7 類（餐飲/交通/購物/娛樂/居家/醫療/其他）cover 80% 日常、但有經驗 user 想要教育/旅遊/寵物/美容/保險等細分。「自訂分類」是天然的 free → pro 轉換點。

**Tier 設計**：
- Free：7 個預設、不可改
- Pro：完全自訂 + 子類別樹（餐飲 > 早餐/午餐/晚餐）
- Team：公司共用 schema + 報表科目對齊

**技術 sketch**：
- [ ] D1 加 `user_categories(user_id, name, parent_id, color, archived, created_at)`
- [ ] LLM parse-text / parse-image 時、system prompt 動態 inject 該 user 的分類清單
- [ ] free user 嘗試改類別 → 顯示「Pro 解鎖自訂」依依 nudge

**對位戰略憲法**：§八.3 B2B 擴張、§八.1 PLG 對話式轉換

---

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
