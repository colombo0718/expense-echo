import type { Env, ParsedExpense } from './types';

const VISION_MODELS = [
  '@cf/meta/llama-3.2-11b-vision-instruct',
  '@cf/llava-hf/llava-1.5-7b-hf',
];

const SYSTEM_PROMPT = `你是收據解析助手。看圖片、抽出消費資訊、回 JSON（不要其他文字）：

{
  "vendor": "店家名稱（例如 7-11、全聯）",
  "amount": 156,
  "date": "YYYY-MM-DD 或 null",
  "category": "餐飲 / 日用 / 交通 / 娛樂 / 其他",
  "items": [{"name": "便當", "price": 90}]
}

若圖片不像收據、回 {"error": "not_receipt"}。金額一律 integer、台幣。`;

export interface VisionResult {
  parsed: ParsedExpense | null;
  model: string;
  ok: boolean;
  error?: string;
}

export async function parseReceiptImage(imageBytes: Uint8Array, env: Env): Promise<VisionResult> {
  let lastError: string | undefined;

  for (const model of VISION_MODELS) {
    try {
      const res = await env.AI.run(model, {
        image: [...imageBytes],
        messages: [{ role: 'user', content: SYSTEM_PROMPT }],
        temperature: 0,
        max_tokens: 512,
      } as any);

      const text = typeof res === 'string' ? res : (res as any).response ?? '';
      if (!text) {
        lastError = 'empty response';
        continue;
      }

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        lastError = 'no json in output';
        continue;
      }

      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.error) {
        return { parsed: null, model, ok: false, error: parsed.error };
      }
      if (typeof parsed.amount !== 'number') {
        lastError = 'no numeric amount';
        continue;
      }

      return {
        parsed: {
          vendor: parsed.vendor,
          amount: parsed.amount,
          category: parsed.category,
          items: parsed.items,
          date: parsed.date,
          raw: text,
        },
        model,
        ok: true,
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      continue;
    }
  }

  return { parsed: null, model: VISION_MODELS[0], ok: false, error: lastError };
}
