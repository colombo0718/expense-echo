/**
 * D1 query 封裝
 */

export interface ExpenseRow {
  user_id: string;
  amount: number;
  category?: string | null;
  vendor?: string | null;
  items?: string | null;
  raw_text?: string | null;
  image_key?: string | null;
}

export async function saveExpense(db: D1Database, row: ExpenseRow): Promise<void> {
  await db
    .prepare(
      `INSERT INTO expenses (user_id, amount, category, vendor, items, raw_text, image_key)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      row.user_id,
      row.amount,
      row.category ?? null,
      row.vendor ?? null,
      row.items ?? null,
      row.raw_text ?? null,
      row.image_key ?? null
    )
    .run();
}

export async function listRecentExpenses(db: D1Database, userId: string, limit = 10) {
  const { results } = await db
    .prepare(
      `SELECT id, amount, category, vendor, items, ts
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
      `SELECT category, SUM(amount) as total
       FROM expenses
       WHERE user_id = ? AND ts >= ?
       GROUP BY category`
    )
    .bind(userId, sinceTs)
    .all();
  return results;
}
