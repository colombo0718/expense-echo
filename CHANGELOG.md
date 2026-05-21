# CHANGELOG

## [0.1.0] - 2026-05-21（規劃中、待施工）

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

### 待施工（依 docs/web-oauth-pivot.md §三 順序）
1. 拔 LINE 程式碼
2. D1 真建 + schema v1 上線
3. GCP OAuth Client 申請（colombo 經手）
4. OAuth 四檔（google-start / callback / me / logout）
5. 前端骨架（login.html + index.html + app.js）
6. 文字記帳 E2E
7. 圖片記帳 E2E
8. ai_runs metrics 接線
9. CF Pages 部署

---

## [0.0.1] - 2026-05-20

### 專案啟動
- 定名 Expense Echo（EE）、消費回響
- 確立初版架構：Cloudflare Workers + D1 + R2 + Workers AI (Llama 3.2 Vision) + LINE Messaging API
- 寫好 README / PROJECT / CLAUDE / TODO / ROUTINE 核心文件
- GitHub repo 建立：https://github.com/colombo0718/expense-echo
- 雙軌定位：對外個人記帳 chatbot、對內 LL CF 全家桶熱身原型
