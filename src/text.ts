/**
 * 文字訊息解析：「便當 90」「今天 7-11 買飲料 30」之類
 */

import type { Env, ParsedExpense } from './types';

const TEXT_MODEL = '@cf/meta/llama-3.1-8b-instruct';

const SYSTEM_PROMPT = `你是記帳助手。把使用者口語的消費訊息抽成 JSON：

{
  "vendor": "店家或 null",
  "amount": 90,
  "category": "餐飲 / 日用 / 交通 / 娛樂 / 其他",
  "items": [{"name": "便當", "price": 90}]
}

若沒看到金額、回 {"error": "no_amount"}。金額為 integer、台幣。只回 JSON、不要其他文字。`;

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
    if (typeof parsed.amount !== 'number') return null;

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
