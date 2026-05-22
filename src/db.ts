import type { User, AiRunLog, GoogleUserInfo, ChatMessage } from './types';

export interface ExpenseRow {
  user_id: string;
  amount: number;
  currency?: string;
  category?: string | null;
  vendor?: string | null;
  items?: string | null;
  raw_text?: string | null;
  image_key?: string | null;
}

export async function upsertUserFromGoogle(db: D1Database, info: GoogleUserInfo): Promise<User> {
  const existing = await db
    .prepare(`SELECT * FROM users WHERE google_sub = ? OR email = ?`)
    .bind(info.sub, info.email)
    .first<User>();

  if (existing) {
    await db
      .prepare(
        `UPDATE users
            SET google_sub = COALESCE(google_sub, ?),
                name = COALESCE(?, name),
                last_seen_at = datetime('now')
          WHERE id = ?`
      )
      .bind(info.sub, info.name ?? null, existing.id)
      .run();
    return { ...existing, google_sub: existing.google_sub ?? info.sub, name: existing.name ?? info.name ?? null };
  }

  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO users (id, email, name, tier, entry_source, google_sub)
       VALUES (?, ?, ?, 'free', 'google', ?)`
    )
    .bind(id, info.email, info.name ?? null, info.sub)
    .run();

  return {
    id,
    email: info.email,
    name: info.name ?? null,
    tier: 'free',
    entry_source: 'google',
    google_sub: info.sub,
    created_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
  };
}

export async function saveExpense(db: D1Database, row: ExpenseRow): Promise<number> {
  const result = await db
    .prepare(
      `INSERT INTO expenses (user_id, amount, currency, category, vendor, items, raw_text, image_key)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      row.user_id,
      row.amount,
      row.currency ?? 'TWD',
      row.category ?? null,
      row.vendor ?? null,
      row.items ?? null,
      row.raw_text ?? null,
      row.image_key ?? null
    )
    .run();
  return result.meta.last_row_id as number;
}

export async function listRecentExpenses(db: D1Database, userId: string, limit = 20) {
  const { results } = await db
    .prepare(
      `SELECT id, amount, currency, category, vendor, items, ts
         FROM expenses
        WHERE user_id = ?
        ORDER BY ts DESC
        LIMIT ?`
    )
    .bind(userId, limit)
    .all();
  return results;
}

export async function sumByCategory(db: D1Database, userId: string, sinceTs: number) {
  const { results } = await db
    .prepare(
      `SELECT category, SUM(amount) AS total
         FROM expenses
        WHERE user_id = ? AND ts >= ?
        GROUP BY category`
    )
    .bind(userId, sinceTs)
    .all();
  return results;
}

export async function logAiRun(db: D1Database, run: AiRunLog): Promise<void> {
  await db
    .prepare(
      `INSERT INTO ai_runs (user_id, model, task, latency_ms, neurons, ok, error)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      run.user_id,
      run.model,
      run.task,
      run.latency_ms,
      run.neurons ?? null,
      run.ok ? 1 : 0,
      run.error ?? null
    )
    .run();
}

export async function insertChat(db: D1Database, msg: ChatMessage): Promise<number> {
  const result = await db
    .prepare(
      `INSERT INTO chats (user_id, role, msg_type, content, payload, expense_id)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(
      msg.user_id,
      msg.role,
      msg.msg_type,
      msg.content ?? null,
      msg.payload ?? null,
      msg.expense_id ?? null
    )
    .run();
  return result.meta.last_row_id as number;
}

export async function listRecentChats(db: D1Database, userId: string, limit = 50) {
  const { results } = await db
    .prepare(
      `SELECT id, role, msg_type, content, payload, expense_id, ts
         FROM chats
        WHERE user_id = ?
        ORDER BY ts DESC, id DESC
        LIMIT ?`
    )
    .bind(userId, limit)
    .all();
  return (results as any[]).reverse();
}

export async function getTodayTotal(db: D1Database, userId: string): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) AS total
         FROM expenses
        WHERE user_id = ?
          AND ts >= unixepoch('now', 'start of day', 'utc')`
    )
    .bind(userId)
    .first<{ total: number }>();
  return row?.total ?? 0;
}

export async function getMonthTotal(db: D1Database, userId: string): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) AS total
         FROM expenses
        WHERE user_id = ?
          AND ts >= unixepoch('now', 'start of month', 'utc')`
    )
    .bind(userId)
    .first<{ total: number }>();
  return row?.total ?? 0;
}
