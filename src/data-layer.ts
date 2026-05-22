/**
 * 數據層：把事情做對。
 *
 * 職責：
 *   - LLM parse（呼叫 text.ts / vision.ts、得到結構化資料）
 *   - 讀 / 寫 D1（chats / expenses / ai_runs）
 *   - 算 user 的世界狀態（today/month total、recent expenses、recent chats）
 *   - 確保資料正確性（amount > 0、parser 嚴格、雙保險）
 *
 * 不做的事：
 *   - 不生成自然語言（那是人格層的事）
 *   - 不關心對話風格（依依愛怎麼說都行、跟我無關）
 */

import type { Env, User, ParsedExpense, ChatMessage } from './types';
import { parseTextExpense } from './text';
import { parseReceiptImage } from './vision';
import {
  saveExpense,
  logAiRun,
  insertChat,
  listRecentChats,
  listRecentExpenses,
  getTodayTotal,
  getMonthTotal,
} from './db';
import type { ExpenseHistoryItem } from './yiyi';

const TEXT_MODEL = '@cf/meta/llama-3.1-8b-instruct';

export interface UserInput {
  text?: string;
  imageBytes?: Uint8Array;
  imageKey?: string;
}

export interface LayerMetric {
  model: string;
  task: 'vision' | 'text' | 'persona';
  latency_ms: number;
  ok: boolean;
  error?: string;
}

export interface WorldState {
  /** 剛寫進去的 user 訊息 id */
  user_msg_id: number;
  /** parse 出的結果、null 表示非記帳輸入 */
  parsed: ParsedExpense | null;
  /** 若 parse 成功並寫了 expense、其 id */
  expense_id: number | null;
  /** 數據層的 LLM 指標 */
  data_layer_metric: LayerMetric;

  /** user 當前世界狀態 */
  today_total: number;
  month_total: number;
  recent_chats: ChatMessage[];
  recent_expenses: ExpenseHistoryItem[];
}

/**
 * 處理 user 輸入：跑 LLM parse、持久化、回傳完整世界狀態。
 * 這是數據層對外唯一入口。
 */
export async function processUserInput(env: Env, user: User, input: UserInput): Promise<WorldState> {
  // 1. 寫 user 訊息進 chats
  const userMsgId = await insertChat(env.DB, {
    user_id: user.id,
    role: 'user',
    msg_type: input.imageBytes ? 'image' : 'text',
    content: input.imageBytes ? input.imageKey ?? null : input.text ?? null,
  });

  // 2. LLM parse
  let parsed: ParsedExpense | null = null;
  let metric: LayerMetric;

  if (input.imageBytes) {
    const t0 = Date.now();
    const result = await parseReceiptImage(input.imageBytes, env);
    metric = {
      model: result.model,
      task: 'vision',
      latency_ms: Date.now() - t0,
      ok: result.ok,
      error: result.error,
    };
    parsed = result.parsed;
  } else if (input.text) {
    const t0 = Date.now();
    parsed = await parseTextExpense(input.text, env);
    metric = {
      model: TEXT_MODEL,
      task: 'text',
      latency_ms: Date.now() - t0,
      ok: parsed !== null,
    };
  } else {
    metric = { model: '', task: 'text', latency_ms: 0, ok: false, error: 'empty input' };
  }

  await logAiRun(env.DB, {
    user_id: user.id,
    model: metric.model,
    task: metric.task,
    latency_ms: metric.latency_ms,
    ok: metric.ok,
    error: metric.error,
  });

  // 3. 雙保險：amount <= 0 一律視為非記帳
  if (parsed && (typeof parsed.amount !== 'number' || parsed.amount <= 0)) {
    parsed = null;
  }

  // 4. 寫 expense + result chat
  let expenseId: number | null = null;
  if (parsed) {
    expenseId = await saveExpense(env.DB, {
      user_id: user.id,
      amount: parsed.amount,
      category: parsed.category,
      vendor: parsed.vendor,
      items: parsed.items ? JSON.stringify(parsed.items) : null,
      raw_text: parsed.raw ?? input.text ?? null,
      image_key: input.imageKey ?? null,
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
        model: metric.model,
        latency_ms: metric.latency_ms,
      }),
      expense_id: expenseId,
    });
  }

  // 5. 算當前世界狀態
  const todayTotal = await getTodayTotal(env.DB, user.id);
  const monthTotal = await getMonthTotal(env.DB, user.id);
  const recentChats = (await listRecentChats(env.DB, user.id, 16)) as ChatMessage[];
  const recentExpensesRaw = await listRecentExpenses(env.DB, user.id, 8);
  const recentExpenses: ExpenseHistoryItem[] = (recentExpensesRaw as any[]).map((r) => ({
    amount: r.amount,
    vendor: r.vendor ?? null,
    category: r.category ?? null,
    items: r.items ?? null,
    ts: r.ts,
  }));

  return {
    user_msg_id: userMsgId,
    parsed,
    expense_id: expenseId,
    data_layer_metric: metric,
    today_total: todayTotal,
    month_total: monthTotal,
    recent_chats: recentChats,
    recent_expenses: recentExpenses,
  };
}

/**
 * 人格層生成 reply 之後、由數據層負責持久化（讓人格層保持純）。
 */
export async function persistYiyiReply(env: Env, user: User, replyText: string, metric: LayerMetric): Promise<number> {
  await logAiRun(env.DB, {
    user_id: user.id,
    model: metric.model,
    task: 'persona',
    latency_ms: metric.latency_ms,
    ok: metric.ok,
    error: metric.error,
  });

  return await insertChat(env.DB, {
    user_id: user.id,
    role: 'yiyi',
    msg_type: 'text',
    content: replyText,
  });
}
