-- 2026-05-27 evening — users 加 salutation 欄
-- 每個 user 自選稱呼（少俠 / 娘娘 / 先生 / 公子 / 老爺 / 等）
-- yiyi 對話開場若 salutation IS NULL 觸發「奴家該怎麼稱呼您」
-- 跑：wrangler d1 execute expense-echo-db --remote --file=schema-salutation-migration.sql

ALTER TABLE users ADD COLUMN salutation TEXT;
CREATE INDEX IF NOT EXISTS idx_users_salutation ON users(salutation);
