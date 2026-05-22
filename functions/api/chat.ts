import type { Env, ParsedExpense } from '../../src/types';
import { getSessionToken, getUserBySession } from '../../src/auth';
import { parseTextExpense } from '../../src/text';
import { parseReceiptImage } from '../../src/vision';
import {
  saveExpense,
  logAiRun,
  insertChat,
  listRecentChats,
  listRecentExpenses,
  getTodayTotal,
  getMonthTotal,
} from '../../src/db';
import { generateYiyiReply } from '../../src/yiyi';

const TEXT_MODEL = '@cf/meta/llama-3.1-8b-instruct';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getUserBySession(env, getSessionToken(request));
  if (!user) return json({ error: 'unauthorized' }, 401);

  const contentType = request.headers.get('content-type') || '';
  let userText: string | undefined;
  let userImage: Uint8Array | undefined;
  let imageKey: string | undefined;

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData().catch(() => null);
    if (!form) return json({ error: 'bad form' }, 400);
    const file = form.get('image');
    if (file instanceof File && file.size > 0) {
      const buf = await file.arrayBuffer();
      userImage = new Uint8Array(buf);
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

  if (!userText && !userImage) {
    return json({ error: 'empty message' }, 400);
  }

  const userMsgId = await insertChat(env.DB, {
    user_id: user.id,
    role: 'user',
    msg_type: userImage ? 'image' : 'text',
    content: userImage ? imageKey ?? null : userText ?? null,
  });

  // Step 1 數據層 LLM
  let parsed: ParsedExpense | null = null;
  let expenseId: number | null = null;
  let dataLayerModel = '';
  let dataLayerLatency = 0;
  let dataLayerOk = false;
  let dataLayerError: string | undefined;

  if (userImage) {
    const t0 = Date.now();
    const result = await parseReceiptImage(userImage, env);
    dataLayerLatency = Date.now() - t0;
    dataLayerModel = result.model;
    dataLayerOk = result.ok;
    dataLayerError = result.error;
    parsed = result.parsed;
    await logAiRun(env.DB, {
      user_id: user.id,
      model: result.model,
      task: 'vision',
      latency_ms: dataLayerLatency,
      ok: result.ok,
      error: result.error,
    });
  } else if (userText) {
    const t0 = Date.now();
    parsed = await parseTextExpense(userText, env);
    dataLayerLatency = Date.now() - t0;
    dataLayerModel = TEXT_MODEL;
    dataLayerOk = parsed !== null;
    await logAiRun(env.DB, {
      user_id: user.id,
      model: TEXT_MODEL,
      task: 'text',
      latency_ms: dataLayerLatency,
      ok: dataLayerOk,
    });
  }

  // 雙保險：parser 已過濾 amount<=0、這邊再擋一次
  if (parsed && (typeof parsed.amount !== 'number' || parsed.amount <= 0)) {
    parsed = null;
  }

  if (parsed) {
    expenseId = await saveExpense(env.DB, {
      user_id: user.id,
      amount: parsed.amount,
      category: parsed.category,
      vendor: parsed.vendor,
      items: parsed.items ? JSON.stringify(parsed.items) : null,
      raw_text: parsed.raw ?? userText ?? null,
      image_key: imageKey ?? null,
    });
    await insertChat(env.DB, {
      user_id: user.id,
      role: 'system',
      msg_type: 'result',
      payload: JSON.stringify({
        vendor: parsed.vendor,
        amount: parsed.amount,
        category: parsed.category,
        items: parsed.items,
        date: parsed.date,
        model: dataLayerModel,
        latency_ms: dataLayerLatency,
      }),
      expense_id: expenseId,
    });
  }

  // Step 2 人格層 LLM
  const todayTotal = await getTodayTotal(env.DB, user.id);
  const monthTotal = await getMonthTotal(env.DB, user.id);
  const recentChats = await listRecentChats(env.DB, user.id, 16);
  const recentExpensesRaw = await listRecentExpenses(env.DB, user.id, 8);
  const recentExpenses = (recentExpensesRaw as any[]).map((r) => ({
    amount: r.amount,
    vendor: r.vendor ?? null,
    category: r.category ?? null,
    items: r.items ?? null,
    ts: r.ts,
  }));

  const yiyi = await generateYiyiReply(
    {
      user_name: user.name || user.email.split('@')[0],
      user_tier: user.tier,
      today_total: todayTotal,
      month_total: monthTotal,
      recent_chats: recentChats as any,
      recent_expenses: recentExpenses,
      parsed_result: parsed,
      user_text: userText,
      user_image: !!userImage,
    },
    env
  );

  await logAiRun(env.DB, {
    user_id: user.id,
    model: yiyi.model,
    task: 'persona',
    latency_ms: yiyi.latency_ms,
    ok: yiyi.ok,
    error: yiyi.error,
  });

  const yiyiMsgId = await insertChat(env.DB, {
    user_id: user.id,
    role: 'yiyi',
    msg_type: 'text',
    content: yiyi.text,
  });

  return json({
    user_msg: { id: userMsgId, role: 'user', msg_type: userImage ? 'image' : 'text', content: userImage ? imageKey : userText },
    yiyi_msg: { id: yiyiMsgId, role: 'yiyi', msg_type: 'text', content: yiyi.text },
    parsed,
    expense_id: expenseId,
    metrics: {
      data_layer: { model: dataLayerModel, latency_ms: dataLayerLatency, ok: dataLayerOk, error: dataLayerError },
      persona_layer: { model: yiyi.model, latency_ms: yiyi.latency_ms, ok: yiyi.ok, error: yiyi.error },
    },
    totals: { today: todayTotal, month: monthTotal },
  });
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
