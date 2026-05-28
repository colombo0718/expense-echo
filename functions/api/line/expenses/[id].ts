import type { Env } from '../../../../src/types';
import { updateExpense, deleteExpense, getTodayTotal, getMonthTotal, getMonthIncome } from '../../../../src/db';

type AuthEnv = Env & { LINE_BRIDGE_TOKEN: string };

function unauthorized() {
  return new Response(JSON.stringify({ error: 'unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

function badRequest(msg: string) {
  return new Response(JSON.stringify({ error: msg }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function resolveUser(env: AuthEnv, lineUserId: string) {
  return await env.DB.prepare(`SELECT id FROM users WHERE line_user_id = ?`)
    .bind(lineUserId)
    .first<{ id: string }>();
}

function checkAuth(request: Request, env: AuthEnv): boolean {
  const auth = request.headers.get('Authorization') || '';
  const expected = `Bearer ${env.LINE_BRIDGE_TOKEN || ''}`;
  return !!env.LINE_BRIDGE_TOKEN && auth === expected;
}

interface PatchBody {
  line_user_id: string;
  amount?: number;
  category?: string | null;
  vendor?: string | null;
  items?: Array<{ name: string; price?: number | null }> | null;
  kind?: 'expense' | 'income';
}

/**
 * PUT /api/line/expenses/:id
 *
 * 部份更新一筆紀錄。body 必須帶 line_user_id（驗證所有權）+ 想更新的欄位。
 */
export const onRequestPut: PagesFunction<AuthEnv> = async ({ request, env, params }) => {
  if (!checkAuth(request, env)) return unauthorized();

  const id = parseInt(String(params.id), 10);
  if (!id || isNaN(id)) return badRequest('bad_id');

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return badRequest('bad_json');
  }
  if (!body.line_user_id) return badRequest('missing line_user_id');

  const user = await resolveUser(env, body.line_user_id);
  if (!user) return badRequest('user_not_found');

  const itemsField =
    body.items === undefined ? undefined : body.items === null ? null : JSON.stringify(body.items);

  const ok = await updateExpense(env.DB, id, user.id, {
    amount: body.amount,
    category: body.category,
    vendor: body.vendor,
    items: itemsField,
    kind: body.kind,
  });

  if (!ok) {
    return new Response(JSON.stringify({ error: 'not_found_or_no_change' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const [today_total, month_total, month_income] = await Promise.all([
    getTodayTotal(env.DB, user.id),
    getMonthTotal(env.DB, user.id),
    getMonthIncome(env.DB, user.id),
  ]);

  return new Response(
    JSON.stringify({
      ok: true,
      expense_id: id,
      today_total,
      month_total,
      month_income,
      month_balance: month_income - month_total,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
};

/**
 * DELETE /api/line/expenses/:id?line_user_id=...
 */
export const onRequestDelete: PagesFunction<AuthEnv> = async ({ request, env, params }) => {
  if (!checkAuth(request, env)) return unauthorized();

  const id = parseInt(String(params.id), 10);
  if (!id || isNaN(id)) return badRequest('bad_id');

  const url = new URL(request.url);
  const lineUserId = url.searchParams.get('line_user_id');
  if (!lineUserId) return badRequest('missing line_user_id');

  const user = await resolveUser(env, lineUserId);
  if (!user) return badRequest('user_not_found');

  const ok = await deleteExpense(env.DB, id, user.id);
  if (!ok) {
    return new Response(JSON.stringify({ error: 'not_found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const [today_total, month_total, month_income] = await Promise.all([
    getTodayTotal(env.DB, user.id),
    getMonthTotal(env.DB, user.id),
    getMonthIncome(env.DB, user.id),
  ]);

  return new Response(
    JSON.stringify({
      ok: true,
      deleted_id: id,
      today_total,
      month_total,
      month_income,
      month_balance: month_income - month_total,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
};
