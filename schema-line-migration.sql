-- LINE OA bridge migration v1
-- 2026-05-27、首批 LINE OA 客戶展演前一晚
--
-- 跑：wrangler d1 execute expense-echo-db --remote --file=schema-line-migration.sql
--
-- 設計決策：
-- 1. users.email 仍維持 NOT NULL、LINE user 用合成 email：`line:<lineUserId>@line.local`
-- 2. 新加 line_user_id 欄位、UNIQUE、之後 LINE userId → LL user_id 的合併鍵
-- 3. expenses 加 source 欄位、區分 web / line 來源、未來分析用
-- 4. users.entry_source 允許 'line' 新值（TypeScript 端同步擴）

ALTER TABLE users ADD COLUMN line_user_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_line_user_id
  ON users(line_user_id) WHERE line_user_id IS NOT NULL;

ALTER TABLE expenses ADD COLUMN source TEXT NOT NULL DEFAULT 'web';
CREATE INDEX IF NOT EXISTS idx_expenses_source ON expenses(source);
