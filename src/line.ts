import type { User } from './types';

export interface LineUpsertInput {
  line_user_id: string;
  display_name?: string | null;
}

/**
 * 用 LINE userId 找或建 LL user。
 * Email 用合成格式 `line:<lineUserId>@line.local`、保留 schema NOT NULL 約束。
 * entry_source = 'line'。
 */
export async function upsertUserFromLine(
  db: D1Database,
  input: LineUpsertInput
): Promise<User> {
  const existing = await db
    .prepare(`SELECT * FROM users WHERE line_user_id = ?`)
    .bind(input.line_user_id)
    .first<User>();

  if (existing) {
    await db
      .prepare(
        `UPDATE users
            SET name = COALESCE(?, name),
                last_seen_at = datetime('now')
          WHERE id = ?`
      )
      .bind(input.display_name ?? null, existing.id)
      .run();
    return {
      ...existing,
      name: existing.name ?? input.display_name ?? null,
    };
  }

  const id = crypto.randomUUID();
  const syntheticEmail = `line:${input.line_user_id}@line.local`;
  await db
    .prepare(
      `INSERT INTO users (id, email, name, tier, entry_source, line_user_id)
       VALUES (?, ?, ?, 'free', 'line', ?)`
    )
    .bind(id, syntheticEmail, input.display_name ?? null, input.line_user_id)
    .run();

  return {
    id,
    email: syntheticEmail,
    name: input.display_name ?? null,
    tier: 'free',
    entry_source: 'line' as any,
    google_sub: null,
    created_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
  };
}
