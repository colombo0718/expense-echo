import type { Env } from '../../src/types';
import { getSessionToken, getUserBySession } from '../../src/auth';
import { parseTextExpense } from '../../src/text';
import { saveExpense, logAiRun } from '../../src/db';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getUserBySession(env, getSessionToken(request));
  if (!user) return json({ error: 'unauthorized' }, 401);

  const body = await request.json<{ text?: string }>().catch(() => ({}));
  const text = body.text?.trim();
  if (!text) return json({ error: 'empty text' }, 400);

  const t0 = Date.now();
  let parsed = null;
  let ok = false;
  let errMsg: string | undefined;
  try {
    parsed = await parseTextExpense(text, env);
    ok = parsed !== null;
  } catch (err) {
    errMsg = err instanceof Error ? err.message : String(err);
  }
  const latency = Date.now() - t0;

  await logAiRun(env.DB, {
    user_id: user.id,
    model: '@cf/meta/llama-3.1-8b-instruct',
    task: 'text',
    latency_ms: latency,
    ok,
    error: errMsg,
  });

  if (!parsed) {
    return json({ error: 'no_amount', hint: '沒抓到金額、可以講清楚一點嗎？例如「便當 90」' }, 422);
  }

  const expenseId = await saveExpense(env.DB, {
    user_id: user.id,
    amount: parsed.amount,
    category: parsed.category,
    vendor: parsed.vendor,
    items: parsed.items ? JSON.stringify(parsed.items) : null,
    raw_text: text,
  });

  return json({
    id: expenseId,
    vendor: parsed.vendor,
    amount: parsed.amount,
    category: parsed.category,
    items: parsed.items,
    latency_ms: latency,
  });
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
