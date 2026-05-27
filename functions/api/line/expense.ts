import type { Env } from '../../../src/types';
import { upsertUserFromLine } from '../../../src/line';
import { saveExpense, insertChat, getTodayTotal, getMonthTotal } from '../../../src/db';

interface LineExpenseBody {
  line_user_id: string;
  display_name?: string | null;
  raw_text: string;
  reply?: string | null;
  parsed: {
    amount: number;
    vendor?: string | null;
    category?: string | null;
    items?: Array<{ name: string; price?: number | null }> | null;
  };
}

/**
 * POST /api/line/expense
 *
 * home 機器（yiyi bridge）解析完 LINE 訊息後、把結構化資料寫進 D1。
 * Bearer token auth、token 存 LINE_BRIDGE_TOKEN env var。
 */
export const onRequestPost: PagesFunction<Env & { LINE_BRIDGE_TOKEN: string }> = async ({
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

  let body: LineExpenseBody;
  try {
    body = (await request.json()) as LineExpenseBody;
  } catch {
    return new Response(JSON.stringify({ error: 'bad_json' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body.line_user_id || !body.parsed || typeof body.parsed.amount !== 'number') {
    return new Response(
      JSON.stringify({ error: 'missing_fields', need: ['line_user_id', 'parsed.amount'] }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const user = await upsertUserFromLine(env.DB, {
    line_user_id: body.line_user_id,
    display_name: body.display_name ?? null,
  });

  const itemsJson = body.parsed.items ? JSON.stringify(body.parsed.items) : null;
  const expenseId = await saveExpense(env.DB, {
    user_id: user.id,
    amount: body.parsed.amount,
    category: body.parsed.category ?? null,
    vendor: body.parsed.vendor ?? null,
    items: itemsJson,
    raw_text: body.raw_text,
  });

  // 寫 expenses 後手動把 source 標成 line（saveExpense 走預設值 'web'）
  await env.DB.prepare(`UPDATE expenses SET source = 'line' WHERE id = ?`)
    .bind(expenseId)
    .run();

  // 記對話歷史（user 訊息 + 依依回覆）
  await insertChat(env.DB, {
    user_id: user.id,
    role: 'user',
    msg_type: 'text',
    content: body.raw_text,
  });
  if (body.reply) {
    await insertChat(env.DB, {
      user_id: user.id,
      role: 'yiyi',
      msg_type: 'text',
      content: body.reply,
      expense_id: expenseId,
    });
  }

  const [todayTotal, monthTotal] = await Promise.all([
    getTodayTotal(env.DB, user.id),
    getMonthTotal(env.DB, user.id),
  ]);

  return new Response(
    JSON.stringify({
      ok: true,
      expense_id: expenseId,
      user_id: user.id,
      today_total: todayTotal,
      month_total: monthTotal,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
};
