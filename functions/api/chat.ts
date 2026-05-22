/**
 * Chat orchestrator —— 最薄的協調者、串「數據層 → 人格層 → 數據層持久化」。
 *
 * 職責：
 *   - auth
 *   - 解析 request（text vs multipart image）
 *   - 跑 src/data-layer.ts processUserInput
 *   - 跑 src/yiyi.ts generateYiyiReply
 *   - 把 reply 交回數據層持久化
 *   - 回 JSON
 *
 * 不做的事：
 *   - 不直接寫 DB（那是 data-layer 的事）
 *   - 不組 system prompt（那是 yiyi 的事）
 */

import type { Env } from '../../src/types';
import { getSessionToken, getUserBySession } from '../../src/auth';
import { processUserInput, persistYiyiReply } from '../../src/data-layer';
import { generateYiyiReply } from '../../src/yiyi';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getUserBySession(env, getSessionToken(request));
  if (!user) return json({ error: 'unauthorized' }, 401);

  // 解析 request
  const contentType = request.headers.get('content-type') || '';
  let userText: string | undefined;
  let imageBytes: Uint8Array | undefined;
  let imageKey: string | undefined;

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData().catch(() => null);
    if (!form) return json({ error: 'bad form' }, 400);
    const file = form.get('image');
    if (file instanceof File && file.size > 0) {
      const buf = await file.arrayBuffer();
      imageBytes = new Uint8Array(buf);
      imageKey = `${user.id}/${Date.now()}-${crypto.randomUUID()}.jpg`;
      await env.RECEIPTS.put(imageKey, buf, {
        httpMetadata: { contentType: file.type || 'image/jpeg' },
      });
    }
    const t = form.get('text');
    if (typeof t === 'string' && t.trim()) userText = t.trim();
  } else {
    const body = await request.json<{ text?: string }>().catch(() => ({}));
    if (body.text?.trim()) userText = body.text.trim();
  }

  if (!userText && !imageBytes) {
    return json({ error: 'empty message' }, 400);
  }

  // 1. 數據層：parse + persist + 算 state
  const world = await processUserInput(env, user, {
    text: userText,
    imageBytes,
    imageKey,
  });

  // 2. 人格層：純包裝、無 DB
  const yiyi = await generateYiyiReply(
    {
      user_name: user.name || user.email.split('@')[0],
      user_tier: user.tier,
      today_total: world.today_total,
      month_total: world.month_total,
      recent_chats: world.recent_chats,
      recent_expenses: world.recent_expenses,
      parsed_result: world.parsed,
      user_text: userText,
      user_image: !!imageBytes,
    },
    env
  );

  // 3. 數據層持久化人格層的 reply
  const yiyiMsgId = await persistYiyiReply(env, user, yiyi.text, {
    model: yiyi.model,
    task: 'persona',
    latency_ms: yiyi.latency_ms,
    ok: yiyi.ok,
    error: yiyi.error,
  });

  return json({
    user_msg: {
      id: world.user_msg_id,
      role: 'user',
      msg_type: imageBytes ? 'image' : 'text',
      content: imageBytes ? imageKey : userText,
    },
    yiyi_msg: { id: yiyiMsgId, role: 'yiyi', msg_type: 'text', content: yiyi.text },
    parsed: world.parsed,
    expense_id: world.expense_id,
    metrics: {
      data_layer: world.data_layer_metric,
      persona_layer: { model: yiyi.model, latency_ms: yiyi.latency_ms, ok: yiyi.ok, error: yiyi.error },
    },
    totals: { today: world.today_total, month: world.month_total },
  });
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
