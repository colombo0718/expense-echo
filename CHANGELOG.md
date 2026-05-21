# CHANGELOG

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
