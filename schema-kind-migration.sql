-- expenses.kind migration
-- 加上 kind 欄位區分 expense / income、避免再多開一張表
-- income 不計入 today/month total（那是「開銷」總額）、另外有 income 統計
--
-- 跑：wrangler d1 execute expense-echo-db --remote --file=schema-kind-migration.sql

ALTER TABLE expenses ADD COLUMN kind TEXT NOT NULL DEFAULT 'expense';
CREATE INDEX IF NOT EXISTS idx_expenses_user_kind_ts ON expenses(user_id, kind, ts DESC);
