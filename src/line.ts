/**
 * LINE Messaging API client + 事件處理
 */

import type { Env, LineEvent } from './types';
import { parseReceiptImage } from './vision';
import { parseTextExpense } from './text';
import { saveExpense } from './db';

const LINE_API = 'https://api.line.me/v2/bot';
const LINE_DATA_API = 'https://api-data.line.me/v2/bot';

export async function handleLineEvent(event: LineEvent, env: Env): Promise<void> {
  if (event.type !== 'message' || !event.message || !event.source?.userId) return;
  const userId = event.source.userId;
  const replyToken = event.replyToken;

  if (event.message.type === 'image' && replyToken) {
    await handleImage(event.message.id, userId, replyToken, env);
  } else if (event.message.type === 'text' && event.message.text && replyToken) {
    await handleText(event.message.text, userId, replyToken, env);
  }
}

async function handleImage(messageId: string, userId: string, replyToken: string, env: Env): Promise<void> {
  // 1. 從 LINE 下載圖片 binary
  const imgRes = await fetch(`${LINE_DATA_API}/message/${messageId}/content`, {
    headers: { Authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}` },
  });
  if (!imgRes.ok) {
    await replyText(replyToken, '圖片下載失敗、再試一次？', env);
    return;
  }
  const imgBuf = await imgRes.arrayBuffer();

  // 2. 存進 R2（之後可查、也給模型評測用）
  const imageKey = `${userId}/${messageId}.jpg`;
  await env.RECEIPTS.put(imageKey, imgBuf, { httpMetadata: { contentType: 'image/jpeg' } });

  // 3. 餵 Vision 模型
  const parsed = await parseReceiptImage(new Uint8Array(imgBuf), env);
  if (!parsed) {
    await replyText(replyToken, '看不懂這張、可以用文字告訴我嗎？例如「7-11 156」', env);
    return;
  }

  // 4. 寫 D1
  await saveExpense(env.DB, {
    user_id: userId,
    amount: parsed.amount,
    category: parsed.category,
    vendor: parsed.vendor,
    items: parsed.items ? JSON.stringify(parsed.items) : null,
    raw_text: parsed.raw ?? null,
    image_key: imageKey,
  });

  // 5. 回覆
  const summary = `記到了：${parsed.vendor ?? '未知店家'} ${parsed.amount} 元` +
    (parsed.items?.length ? `\n品項：${parsed.items.map(i => i.name).join('、')}` : '');
  await replyText(replyToken, summary, env);
}

async function handleText(text: string, userId: string, replyToken: string, env: Env): Promise<void> {
  // 簡單指令
  if (text === '查' || text === '看') {
    await replyText(replyToken, '（查詢功能還在做、敬請期待）', env);
    return;
  }

  const parsed = await parseTextExpense(text, env);
  if (!parsed) {
    await replyText(replyToken, '沒抓到金額、可以講清楚一點嗎？例如「便當 90」', env);
    return;
  }

  await saveExpense(env.DB, {
    user_id: userId,
    amount: parsed.amount,
    category: parsed.category,
    vendor: parsed.vendor,
    items: parsed.items ? JSON.stringify(parsed.items) : null,
    raw_text: text,
    image_key: null,
  });

  await replyText(replyToken, `記到了：${parsed.vendor ?? parsed.items?.[0]?.name ?? '消費'} ${parsed.amount} 元`, env);
}

async function replyText(replyToken: string, text: string, env: Env): Promise<void> {
  await fetch(`${LINE_API}/message/reply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: 'text', text: text.slice(0, 2000) }],
    }),
  });
}
