import type { Env } from '../../../src/types';

/**
 * GET /api/line/user-profile?line_user_id=...
 * 回傳 user 的 salutation + display_name + tier。yiyi 開場用、判斷要不要問稱呼。
 *
 * POST /api/line/user-profile
 * body: { line_user_id, salutation }
 * 寫入 user.salutation（用戶說「叫我少俠」之後 yiyi 來存）。
 *
 * 兩端都用 LINE_BRIDGE_TOKEN Bearer auth。
 */

function authed(request: Request, env: Env & { LINE_BRIDGE_TOKEN: string }): boolean {
  const auth = request.headers.get('Authorization') || '';
  return !!env.LINE_BRIDGE_TOKEN && auth === `Bearer ${env.LINE_BRIDGE_TOKEN}`;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const onRequestGet: PagesFunction<Env & { LINE_BRIDGE_TOKEN: string }> = async ({
  request,
  env,
}) => {
  if (!authed(request, env)) return json({ error: 'unauthorized' }, 401);

  const url = new URL(request.url);
  const lineUserId = url.searchParams.get('line_user_id');
  if (!lineUserId) return json({ error: 'missing line_user_id' }, 400);

  const user = await env.DB.prepare(
    `SELECT id, name, salutation, tier, created_at FROM users WHERE line_user_id = ?`
  )
    .bind(lineUserId)
    .first<{ id: string; name: string | null; salutation: string | null; tier: string; created_at: string }>();

  if (!user) {
    return json({ user_exists: false, salutation: null, name: null, tier: null });
  }
  return json({
    user_exists: true,
    salutation: user.salutation,
    name: user.name,
    tier: user.tier,
    created_at: user.created_at,
  });
};

export const onRequestPost: PagesFunction<Env & { LINE_BRIDGE_TOKEN: string }> = async ({
  request,
  env,
}) => {
  if (!authed(request, env)) return json({ error: 'unauthorized' }, 401);

  let body: { line_user_id?: string; salutation?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: 'bad_json' }, 400);
  }

  if (!body.line_user_id) return json({ error: 'missing line_user_id' }, 400);
  // salutation 可為空字串（代表清掉、用戶不想設）
  const salutation = (body.salutation ?? '').trim() || null;

  // 找 user（必須已存在、line OA bridge 進來都會先 upsert）
  const user = await env.DB.prepare(`SELECT id FROM users WHERE line_user_id = ?`)
    .bind(body.line_user_id)
    .first<{ id: string }>();

  if (!user) return json({ error: 'user_not_found' }, 404);

  await env.DB.prepare(`UPDATE users SET salutation = ? WHERE id = ?`)
    .bind(salutation, user.id)
    .run();

  return json({ ok: true, salutation });
};
