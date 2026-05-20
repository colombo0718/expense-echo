/**
 * Workers AI 視覺解析：拍收據 → 結構化 JSON
 */

import type { Env, ParsedExpense } from './types';

const VISION_MODEL = '@cf/meta/llama-3.2-11b-vision-instruct';

const SYSTEM_PROMPT = `你是收據解析助手。看圖片、抽出消費資訊、用以下 JSON 格式回答（不要其他文字）：

{
  "vendor": "店家名稱（例如 7-11、全聯）",
  "amount": 156,
  "date": "YYYY-MM-DD 或 null",
  "category": "餐飲 / 日用 / 交通 / 其他",
  "items": [{"name": "便當", "price": 90}]
}

若圖片不像收據、回 {"error": "not_receipt"}。
金額一律 integer、台幣。`;

export async function parseReceiptImage(imageBytes: Uint8Array, env: Env): Promise<ParsedExpense | null> {
  try {
    const res = await env.AI.run(VISION_MODEL, {
      image: [...imageBytes],
      prompt: SYSTEM_PROMPT,
      max_tokens: 512,
    } as any);

    const text = typeof res === 'string' ? res : (res as any).response ?? '';
    if (!text) return null;

    // 抽 JSON（模型可能包在 ```json fence 裡）
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.error) return null;
    if (typeof parsed.amount !== 'number') return null;

    return {
      vendor: parsed.vendor,
      amount: parsed.amount,
      category: parsed.category,
      items: parsed.items,
      date: parsed.date,
      raw: text,
    };
  } catch (err) {
    console.error('vision parse error', err);
    return null;
  }
}
