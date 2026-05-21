import type { Env } from '../../src/types';
import { getSessionToken, getUserBySession } from '../../src/auth';
import { parseReceiptImage } from '../../src/vision';
import { saveExpense, logAiRun } from '../../src/db';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getUserBySession(env, getSessionToken(request));
  if (!user) return json({ error: 'unauthorized' }, 401);

  const form = await request.formData().catch(() => null);
  const file = form?.get('image');
  if (!(file instanceof File)) return json({ error: 'image field missing' }, 400);

  const buf = await file.arrayBuffer();
  if (buf.byteLength === 0) return json({ error: 'empty file' }, 400);

  const imageKey = `${user.id}/${Date.now()}-${crypto.randomUUID()}.jpg`;
  await env.RECEIPTS.put(imageKey, buf, {
    httpMetadata: { contentType: file.type || 'image/jpeg' },
  });

  const t0 = Date.now();
  const result = await parseReceiptImage(new Uint8Array(buf), env);
  const latency = Date.now() - t0;

  await logAiRun(env.DB, {
    user_id: user.id,
    model: result.model,
    task: 'vision',
    latency_ms: latency,
    ok: result.ok,
    error: result.error,
  });

  if (!result.parsed) {
    return json(
      {
        error: result.error ?? 'parse_failed',
        hint: '看不懂這張、可以用文字告訴我嗎？例如「7-11 156」',
        image_key: imageKey,
      },
      422
    );
  }

  const parsed = result.parsed;
  const expenseId = await saveExpense(env.DB, {
    user_id: user.id,
    amount: parsed.amount,
    category: parsed.category,
    vendor: parsed.vendor,
    items: parsed.items ? JSON.stringify(parsed.items) : null,
    raw_text: parsed.raw,
    image_key: imageKey,
  });

  return json({
    id: expenseId,
    vendor: parsed.vendor,
    amount: parsed.amount,
    category: parsed.category,
    items: parsed.items,
    date: parsed.date,
    model: result.model,
    latency_ms: latency,
  });
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
