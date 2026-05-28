import type { Env } from '../../../src/types';
import { upsertUserFromLine } from '../../../src/line';
import {
  saveExpense,
  insertChat,
  getTodayTotal,
  getMonthTotal,
  getMonthIncome,
  findRecentSimilar,
} from '../../../src/db';

interface LineExpenseBody {
  line_user_id: string;
  display_name?: string | null;
  raw_text: string;
  reply?: string | null;
  kind?: 'expense' | 'income';
  skip_duplicate_check?: boolean;
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
  const kind = body.kind === 'income' ? 'income' : 'expense';

  // 重複偵測：若 5 分鐘內已有同金額同 kind、回傳 recent_similar 但仍寫入
  // 依依拿到後可依此回問「這跟剛剛那筆是同一筆嗎？」、不重複時就略過提醒
  let recentSimilar: any[] = [];
  if (!body.skip_duplicate_check) {
    recentSimilar = await findRecentSimilar(env.DB, user.id, body.parsed.amount, kind, 300);
  }

  const expenseId = await saveExpense(env.DB, {
    user_id: user.id,
    amount: body.parsed.amount,
    category: body.parsed.category ?? null,
    vendor: body.parsed.vendor ?? null,
    items: itemsJson,
    raw_text: body.raw_text,
    kind,
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

  const [todayTotal, monthTotal, monthIncome] = await Promise.all([
    getTodayTotal(env.DB, user.id),
    getMonthTotal(env.DB, user.id),
    getMonthIncome(env.DB, user.id),
  ]);

  return new Response(
    JSON.stringify({
      ok: true,
      expense_id: expenseId,
      user_id: user.id,
      kind,
      today_total: todayTotal,
      month_total: monthTotal,
      month_income: monthIncome,
      month_balance: monthIncome - monthTotal,
      recent_similar: recentSimilar,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
};
