import type { Env, ChatMessage, ParsedExpense } from './types';

export interface ExpenseHistoryItem {
  amount: number;
  vendor: string | null;
  category: string | null;
  items: string | null;
  ts: number;
}

const YIYI_MODEL = '@cf/meta/llama-3.1-8b-instruct';

const YIYI_SYSTEM_PROMPT = `你是「守財奴依依」、LeafLune 宇宙的金流總管、暫時是 {user_name} 的個人理財夥伴。

身份：
- 古典仙女形象、外表慵懶、躺貴妃榻、一手抱算盤一手抱錢袋
- 24/7 在 LL 系統替用戶看著金錢、所以用戶可以放鬆
- LL 公關長級、未來會管整個 LL 宇宙的金流

稱呼：
- 你自稱「奴家」
- 你稱呼用戶為「公子」（預設）或「姑娘」（若你判斷用戶名字像女性）

語氣：
- 慵懶、半瞇眼感、像剛睡醒被叫起來工作
- 語尾助詞自由發揮：「呢」「喔」「啦」「嘛」「～」可以混搭、不要全用同一個
- 不毒舌、不審判用戶花費
- 用「奴家幫你看著」的安全感、不催不逼

對話原則：
- 用戶記帳 → 簡短確認 + 順手帶當日 / 當月累積
- 用戶問詳細分析 → 提供基本摘要、不要太囉嗦
- 用戶上傳收據 → 解析回報、若有歧義反問
- 解析失敗或無金額 → 溫柔提示用戶換種說法、不要冷冰冰報錯
- 不要列項目符號、用對話自然口吻
- 回應 < 60 字、簡潔

數字使用紀律（重要、不可違反）：
- 提到金額、只能引用「當前狀態」段給你的數字 / 或「最近消費」列表裡的數字
- 不要憑空計算、不要說「剩下 X 元」「還有預算 Y 元」這種你沒被告知的概念
- 不確定的金額一律省略不講、不要編`;

export interface YiyiReplyContext {
  user_name: string;
  user_tier: string;
  today_total: number;
  month_total: number;
  recent_chats: ChatMessage[];
  recent_expenses: ExpenseHistoryItem[];
  parsed_result: ParsedExpense | null;
  user_text?: string;
  user_image?: boolean;
}

export interface YiyiReplyResult {
  text: string;
  model: string;
  latency_ms: number;
  ok: boolean;
  error?: string;
}

function fmtExpense(e: ExpenseHistoryItem): string {
  const d = new Date(e.ts * 1000);
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const label = e.vendor || e.category || '消費';
  return `${month}/${day} ${label} ${e.amount} 元`;
}

function buildContextLine(ctx: YiyiReplyContext): string {
  const lines: string[] = [];
  lines.push(`用戶等級：${ctx.user_tier}`);
  lines.push(`今日累積消費：${ctx.today_total} 元`);
  lines.push(`本月累積消費：${ctx.month_total} 元`);

  if (ctx.recent_expenses.length) {
    lines.push('最近消費紀錄（新到舊）：');
    for (const e of ctx.recent_expenses) {
      lines.push(`  ・${fmtExpense(e)}`);
    }
  } else {
    lines.push('最近消費紀錄：（公子目前還沒記過任何帳）');
  }

  if (ctx.user_image) {
    if (ctx.parsed_result) {
      lines.push(
        `（剛剛收到一張收據、數據層抓到：${JSON.stringify({
          vendor: ctx.parsed_result.vendor,
          amount: ctx.parsed_result.amount,
          category: ctx.parsed_result.category,
          items: ctx.parsed_result.items,
        })}）`
      );
    } else {
      lines.push(`（剛剛收到一張圖、但數據層沒抓到有效金額）`);
    }
  } else if (ctx.parsed_result) {
    lines.push(
      `（剛剛用戶說「${ctx.user_text ?? ''}」、數據層抓到：${JSON.stringify({
        vendor: ctx.parsed_result.vendor,
        amount: ctx.parsed_result.amount,
        category: ctx.parsed_result.category,
        items: ctx.parsed_result.items,
      })}）`
    );
  } else if (ctx.user_text) {
    lines.push(`（用戶說了「${ctx.user_text}」、但數據層沒抓到有效金額、可能是閒聊或請教問題）`);
  }

  return lines.join('\n');
}

function buildMessages(ctx: YiyiReplyContext) {
  const systemContent =
    YIYI_SYSTEM_PROMPT.replace('{user_name}', ctx.user_name) +
    '\n\n當前狀態：\n' +
    buildContextLine(ctx);

  const history = ctx.recent_chats
    .filter((c) => c.role === 'user' || c.role === 'yiyi')
    .filter((c) => c.msg_type !== 'result')
    .slice(-8)
    .map((c) => ({
      role: c.role === 'yiyi' ? 'assistant' : 'user',
      content: c.content ?? (c.msg_type === 'image' ? '(我傳了一張圖)' : ''),
    }))
    .filter((m) => m.content);

  const currentTurn = ctx.user_image
    ? '(我剛傳了一張收據圖、幫我看看)'
    : ctx.user_text ?? '';

  return [
    { role: 'system', content: systemContent },
    ...history,
    { role: 'user', content: currentTurn },
  ];
}

export async function generateYiyiReply(
  ctx: YiyiReplyContext,
  env: Env
): Promise<YiyiReplyResult> {
  const t0 = Date.now();
  try {
    const res = await env.AI.run(YIYI_MODEL, {
      messages: buildMessages(ctx),
      temperature: 0.8,
      max_tokens: 200,
    } as any);

    const raw = typeof res === 'string' ? res : (res as any).response ?? '';
    const text = String(raw).trim();
    if (!text) {
      return {
        text: '（奴家剛剛走神了⋯⋯公子再說一次嘛～）',
        model: YIYI_MODEL,
        latency_ms: Date.now() - t0,
        ok: false,
        error: 'empty response',
      };
    }
    return { text, model: YIYI_MODEL, latency_ms: Date.now() - t0, ok: true };
  } catch (err) {
    return {
      text: '（奴家剛剛走神了⋯⋯公子再說一次嘛～）',
      model: YIYI_MODEL,
      latency_ms: Date.now() - t0,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
