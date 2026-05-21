-- Expense Echo D1 schema v1
-- 對應：docs/web-oauth-pivot.md §五
-- 變更：v0 全砍重來、users 升級 II 風、加 sessions、expenses.user_id FK、加 currency、加 ai_runs metrics
-- 跑：wrangler d1 execute expense-echo-db --file=schema.sql

-- 身份：對齊 II PROJECT.md 已定案的 users 結構
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,                          -- crypto.randomUUID()
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  tier TEXT NOT NULL DEFAULT 'free',            -- 'free' | 'pro' | 'admin'
  entry_source TEXT NOT NULL DEFAULT 'google',  -- EE 都是 google
  google_sub TEXT UNIQUE,                       -- Google id_token 的 sub claim
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Session：純 D1 token、可即時撤銷、可監控誰在線
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- 消費紀錄
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TWD',         -- future-proof 外幣 / 加油
  category TEXT,
  vendor TEXT,
  items TEXT,                                   -- JSON array
  raw_text TEXT,
  image_key TEXT,                               -- R2 object key
  ts INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_expenses_user_ts ON expenses(user_id, ts DESC);

-- AI 呼叫 metrics（期末報告壓測必備）
CREATE TABLE IF NOT EXISTS ai_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT REFERENCES users(id),
  model TEXT NOT NULL,                          -- '@cf/meta/llama-3.2-11b-vision-instruct' 等
  task TEXT NOT NULL,                           -- 'vision' | 'text'
  latency_ms INTEGER,
  neurons REAL,
  ok INTEGER NOT NULL,                          -- 1 / 0
  error TEXT,
  ts INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_ai_runs_ts ON ai_runs(ts DESC);
CREATE INDEX IF NOT EXISTS idx_ai_runs_model_task ON ai_runs(model, task);
