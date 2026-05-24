# CHANGELOG

## [0.3.0] - 2026-05-24 開規劃（待施工、待綠界憑證 + 貼圖定稿）

### 戰略決策
- 走**打賞制、不走訂閱**（依依「對工資計較」character beat 商業 mechanism 化）
- 「**付費 = 功能升級**」為主、貼圖是情緒附加（colombo 拍板）
- 5 檔層位 + 自訂金額：☕飲料 / 🛍️搓手指 / 🎁禮物 / ✈️飛機 / 🚢郵輪
- 永久 pro 門檻：單筆 NT$ 10000+ 或累積 NT$ 5000
- 法律：走標準商品交易 + 自動電子發票（綠界模組）、商品名「依依の紀念禮 - X 款」
- 金流：綠界 ECPay（葉與月工作室統編）、未來 LL 全宇宙共用
- 貼圖：colombo 親手用 Gemini Nano Banana sweep + Imagen 4 定稿
- PLG 觸發：靜態套路（寬鬆期 7 天 + 感恩冷卻 7 天 + LTV 稱呼）、v0.6+ RL 接管

### 戰略文件（已完）
- `docs/payment-strategy.md` 金流戰略憲法
- `docs/v0.3.0-donation-and-payment.md` 施工計畫 PLAN
- `docs/yiyi-sticker-prompt-templates.md` Gemini 生圖 prompt 模板
- `docs/strategy.md` §十二 Roadmap 更新

### 待施工（9 步）
1. 綠界商家申請（colombo 經手、3-7 天審）
2. Gemini 生圖 5 張（colombo 親審、半小時）
3. schema v2（donations / unlock_grants / sticker_collection + users 擴欄）
4. 綠界 SDK（src/payment/ecpay.ts、CheckMacValue 簽章）
5. API endpoints（/api/donate/* + /api/me/{unlocks,stickers,pro-progress}）
6. 依依 system prompt 加打賞段（5 檔台詞 + PLG 邏輯）
7. UI：打賞按鈕 + 5 檔 + 自訂金額 + 進度條 + paywall
8. 進階功能解鎖 gate（前後端）
9. E2E + 真實付款測 + ship

### Out of scope（v0.3.0 不做）
- 訂閱月費（永不做）
- LINE OA / LinePay native（v0.4+）
- Stripe 國際支付（v0.4+ 評估）
- 寵物 mechanic（v0.5+、lore 留種）
- RL policy 學習（v0.6+）

---

## [0.2.0-alpha] - 2026-05-22（chat-first MVP、雙層 LLM 上線）

### 新增
- 🧮 favicon（依依算盤）+ 兩頁 title 改「Expense Echo · 依依」
- `docs/strategy.md` EE 戰略憲法（13 段）
- `docs/v0.2.0-chat-first-yiyi.md` 施工計畫
- D1 `chats` 表（跨 session 對話歷史、local + remote 上線）
- `src/yiyi.ts` 人格層 LLM、寫死「守財奴依依」system prompt（奴家 / 公子姑娘 / 慵懶語氣）
- `functions/api/chat.ts` 雙層 LLM orchestrator
  - Step 1：數據層 LLM（text/vision parser）→ JSON
  - Step 2：人格層 LLM（依依）→ 自然語言
  - 每層 latency + ok / error 寫 `ai_runs`
- `functions/api/chats.ts` 列對話歷史
- `ai_runs.task` 新增 `'persona'` 類別
- 前端 chat-first 改版：
  - `public/index.html` 改為 chat thread layout（header / thread / input bar）
  - `public/app.js` 重寫為 message renderer + send loop（text + image）
  - `public/styles.css` chat bubble + 草綠/淡金配色 + dark mode + RWD
- 訊息類型：`user_text` / `user_image` / `yiyi_text` / `result`（依依的「結果卡」）

### 設計原則釐清
- 依依態度走「**default 人格鎖定**」、不做動態：
  - 動態態度需 RL 三件套（reward × state × action）
  - 當前缺 reward（付費通道）+ state（tier 維度殘缺）
  - 等 v0.3.0+ 補齊再做 dynamic policy

### 待補 / 待測
- ⏳ E2E 實測（登入 → 文字記帳 → 依依回應 → 拍照 → 依依解析 → 重整保留歷史）
- ⏳ 期末實驗 track：vision 壓測 + controlled prompt perturbation + slide
- ⏳ 補 GCP 剩 5 條 redirect URI
- ⏳ CF Pages Preview 環境 secrets

---


## [0.1.0] - 2026-05-21（文字路徑 E2E 通、圖片路徑待驗）

### 破壞性變更
- **架構從 Cloudflare Workers + LINE webhook 轉為 Cloudflare Pages + Functions + Google OAuth**
- 拔掉 LINE Messaging API 整條通路、永久放棄
- D1 schema v0 全砍重來、不做 migration（v0 沒有真正部署過、無資料保留需求）

### 新增定位
- EE 終局收進 II dashboard 當會員彩蛋功能、不獨立成子品牌
- EE = LL 第一個全 CF 全家桶 + 會員制練手場、所有 pattern 之後搬到 II Phase 1
- GCP OAuth Client 走 LL 共用一張「LeafLune SSO」、EE / II / 未來 RR / DD 都接同一張

### 新增
- `docs/web-oauth-pivot.md` 施工計畫
- schema v1：users（含 google_sub）/ sessions / expenses（含 currency）/ ai_runs（壓測 metrics）
- Google OAuth 強制登入：未登入 access /api/* 直接 401
- 目錄結構：`public/` 前端 + `functions/api/` Pages Functions + `src/` 純 lib

### 已完成（依 docs/web-oauth-pivot.md §三 順序）
1. ✅ 拔 LINE 程式碼（dfd39bf）
2. ✅ D1 真建 + schema v1 上線（6661ac8、4 表 local + remote）
3. ✅ GCP OAuth Client 申請（colombo 經手、`LeafLune SSO`、1 條 redirect URI）
4. ✅ OAuth 四檔（google-start / callback / me / logout、driver 走通）
5. ✅ 前端骨架（login.html + index.html + app.js + styles.css）
6. ✅ 文字記帳 E2E（Llama 3.1 8B、餐飲分類、885ms）
7. ⏳ 圖片記帳 E2E（架構通、實際拍收據未測）
8. ✅ ai_runs metrics 接線
9. ✅ CF Pages 部署（`expense-echo.leaflune.org` CNAME → `expense-echo.pages.dev`）

### infra 上線（2026-05-21）
- CF Pages 專案：`expense-echo`、自有子網域 `expense-echo.leaflune.org`
- D1：`expense-echo-db`、id `2c3d0e37-c6aa-4007-905f-2075dd1c40ea`
- R2：`expense-echo-receipts`、Standard class
- CF Pages production secrets：`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `SESSION_COOKIE_SECRET`（皆 Encrypted）
- GCP OAuth Client：`LeafLune SSO`（共用、之後 II / RR / DD 都接這張）

### 待補
- ⏳ 圖片記帳 E2E 實測（拍 7-11 收據）
- ⏳ 補 GCP redirect URI 剩 5 條（localhost / pages.dev / II 預留 3 條）
- ⏳ CF Pages Preview 環境 secrets 重設（feature branch 開預覽時用）
- ⏳ Vision 模型 fallback chain 實戰驗證（5007 下架時自動切第二個）

---

## [0.0.1] - 2026-05-20

### 專案啟動
- 定名 Expense Echo（EE）、消費回響
- 確立初版架構：Cloudflare Workers + D1 + R2 + Workers AI (Llama 3.2 Vision) + LINE Messaging API
- 寫好 README / PROJECT / CLAUDE / TODO / ROUTINE 核心文件
- GitHub repo 建立：https://github.com/colombo0718/expense-echo
- 雙軌定位：對外個人記帳 chatbot、對內 LL CF 全家桶熱身原型
