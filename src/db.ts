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
  kind?: 'expense' | 'income';
}

export interface ExpensePatch {
  amount?: number;
  category?: string | null;
  vendor?: string | null;
  items?: string | null;
  kind?: 'expense' | 'income';
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
      `INSERT INTO expenses (user_id, amount, currency, category, vendor, items, raw_text, image_key, kind)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      row.user_id,
      row.amount,
      row.currency ?? 'TWD',
      row.category ?? null,
      row.vendor ?? null,
      row.items ?? null,
      row.raw_text ?? null,
      row.image_key ?? null,
      row.kind ?? 'expense'
    )
    .run();
  return result.meta.last_row_id as number;
}

export async function listRecentExpenses(db: D1Database, userId: string, limit = 20) {
  const { results } = await db
    .prepare(
      `SELECT id, amount, currency, category, vendor, items, kind, ts
         FROM expenses
        WHERE user_id = ?
        ORDER BY ts DESC
        LIMIT ?`
    )
    .bind(userId, limit)
    .all();
  return results;
}

export async function updateExpense(
  db: D1Database,
  id: number,
  userId: string,
  patch: ExpensePatch
): Promise<boolean> {
  const sets: string[] = [];
  const vals: unknown[] = [];
  if (patch.amount !== undefined) { sets.push('amount = ?'); vals.push(patch.amount); }
  if (patch.category !== undefined) { sets.push('category = ?'); vals.push(patch.category); }
  if (patch.vendor !== undefined) { sets.push('vendor = ?'); vals.push(patch.vendor); }
  if (patch.items !== undefined) { sets.push('items = ?'); vals.push(patch.items); }
  if (patch.kind !== undefined) { sets.push('kind = ?'); vals.push(patch.kind); }
  if (sets.length === 0) return false;
  vals.push(id, userId);
  const result = await db
    .prepare(`UPDATE expenses SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`)
    .bind(...vals)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

export async function deleteExpense(
  db: D1Database,
  id: number,
  userId: string
): Promise<boolean> {
  const result = await db
    .prepare(`DELETE FROM expenses WHERE id = ? AND user_id = ?`)
    .bind(id, userId)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

// 找最近 N 秒內、同金額（同 kind）的紀錄 → 重複偵測用
export async function findRecentSimilar(
  db: D1Database,
  userId: string,
  amount: number,
  kind: 'expense' | 'income',
  withinSeconds = 300
) {
  const { results } = await db
    .prepare(
      `SELECT id, amount, vendor, items, kind, ts
         FROM expenses
        WHERE user_id = ?
          AND amount = ?
          AND kind = ?
          AND ts >= unixepoch() - ?
        ORDER BY ts DESC
        LIMIT 5`
    )
    .bind(userId, amount, kind, withinSeconds)
    .all();
  return results as any[];
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

/** 跨裝置增量同步用：拿比 sinceId 新的訊息、ASC 排序 */
export async function listChatsSince(db: D1Database, userId: string, sinceId: number, limit = 200) {
  const { results } = await db
    .prepare(
      `SELECT id, role, msg_type, content, payload, expense_id, ts
         FROM chats
        WHERE user_id = ? AND id > ?
        ORDER BY id
        LIMIT ?`
    )
    .bind(userId, sinceId, limit)
    .all();
  return results as any[];
}

// 時區處理：用戶在台灣（UTC+8）、SQLite 'now' 預設 UTC。
// 'now', '+8 hours' = 把 UTC 時間平移到台灣本地時間（仍以 UTC 字串表示）。
// 'start of day' = 取該日 00:00（台灣的 00:00）。
// 最後 unixepoch() 結果是「台灣午夜」對應的 UTC 秒數 - 但因為前面加了 8 小時、需要再扣回去。
// 公式：unixepoch('now', '+8 hours', 'start of day') - 28800  (28800 = 8 * 3600)
// 之後若要支援其他時區、把 +8 / 28800 抽成參數即可。
const TZ_OFFSET_SECONDS = 8 * 3600;

export async function getTodayTotal(db: D1Database, userId: string): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) AS total
         FROM expenses
        WHERE user_id = ?
          AND kind = 'expense'
          AND ts >= unixepoch('now', '+8 hours', 'start of day') - ?`
    )
    .bind(userId, TZ_OFFSET_SECONDS)
    .first<{ total: number }>();
  return row?.total ?? 0;
}

export async function getMonthTotal(db: D1Database, userId: string): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) AS total
         FROM expenses
        WHERE user_id = ?
          AND kind = 'expense'
          AND ts >= unixepoch('now', '+8 hours', 'start of month') - ?`
    )
    .bind(userId, TZ_OFFSET_SECONDS)
    .first<{ total: number }>();
  return row?.total ?? 0;
}

export async function getMonthIncome(db: D1Database, userId: string): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) AS total
         FROM expenses
        WHERE user_id = ?
          AND kind = 'income'
          AND ts >= unixepoch('now', '+8 hours', 'start of month') - ?`
    )
    .bind(userId, TZ_OFFSET_SECONDS)
    .first<{ total: number }>();
  return row?.total ?? 0;
}
