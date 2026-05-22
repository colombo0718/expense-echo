/**
 * 文字訊息解析：「便當 90」「今天 7-11 買飲料 30」之類
 */

import type { Env, ParsedExpense } from './types';

const TEXT_MODEL = '@cf/meta/llama-3.1-8b-instruct';

const SYSTEM_PROMPT = `你是記帳資料抽取器。判斷使用者訊息是「記帳」還是「查詢/聊天」、再決定如何回應。

✅ 是記帳（包含明確的「動作 + 金額」）：抽成 JSON
  {
    "vendor": "店家或 null",
    "amount": 90,                ← 必須 > 0 的整數、台幣
    "category": "餐飲 / 日用 / 交通 / 娛樂 / 其他",
    "items": [{"name": "便當", "price": 90}]
  }

❌ 不是記帳（查詢、聊天、提問、感想、含糊語句）：回 {"error": "not_record"}
  範例：「我最近買了什麼」「幫我看一下」「你好」「在嗎」「為什麼？」

規則：
- 看不到明確金額 → {"error": "not_record"}
- 金額為 0 或負數 → {"error": "not_record"}
- 一句話沒有「我買了 X」「X 元」這種結構 → {"error": "not_record"}
- 只回 JSON、不要其他文字`;

export async function parseTextExpense(text: string, env: Env): Promise<ParsedExpense | null> {
  try {
    const res = await env.AI.run(TEXT_MODEL, {
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
      temperature: 0,
      max_tokens: 256,
    } as any);

    const out = typeof res === 'string' ? res : (res as any).response ?? '';
    const jsonMatch = out.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.error) return null;
    if (typeof parsed.amount !== 'number' || parsed.amount <= 0) return null;

    return {
      vendor: parsed.vendor,
      amount: parsed.amount,
      category: parsed.category,
      items: parsed.items,
      raw: out,
    };
  } catch (err) {
    console.error('text parse error', err);
    return null;
  }
}
