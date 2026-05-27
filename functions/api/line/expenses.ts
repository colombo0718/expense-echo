import type { Env } from '../../../src/types';
import { listRecentExpenses, getTodayTotal, getMonthTotal } from '../../../src/db';

/**
 * GET /api/line/expenses?line_user_id=...&limit=20
 *
 * 給 home yiyi bridge 用、查指定 LINE user 最近的消費紀錄。
 * Bearer auth、token 同 LINE_BRIDGE_TOKEN。
 */
export const onRequestGet: PagesFunction<Env & { LINE_BRIDGE_TOKEN: string }> = async ({
  request,
  env,
}) => {
  const auth = request.headers.get('Authorization') || '';
  const expected = `Bearer ${env.LINE_BRIDGE_TOKEN || ''}`;
  if (!env.LINE_BRIDGE_TOKEN || auth !== expected) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const lineUserId = url.searchParams.get('line_user_id');
  if (!lineUserId) {
    return new Response(JSON.stringify({ error: 'missing line_user_id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20', 10) || 20, 100);

  // 找 user
  const user = await env.DB.prepare(`SELECT id FROM users WHERE line_user_id = ?`)
    .bind(lineUserId)
    .first<{ id: string }>();
  if (!user) {
    return new Response(
      JSON.stringify({ expenses: [], today_total: 0, month_total: 0, user_exists: false }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  const [expenses, today_total, month_total] = await Promise.all([
    listRecentExpenses(env.DB, user.id, limit),
    getTodayTotal(env.DB, user.id),
    getMonthTotal(env.DB, user.id),
  ]);

  return new Response(
    JSON.stringify({
      user_exists: true,
      expenses,
      today_total,
      month_total,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
};
