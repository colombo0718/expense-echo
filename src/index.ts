/**
 * Expense Echo — LINE 記帳 chatbot Worker 入口
 *
 * 路由：
 *   POST /callback  — LINE webhook
 *   GET  /health    — 健康檢查
 */

import { handleLineEvent } from './line';
import type { Env } from './types';

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === '/health') {
      return new Response('ok', { status: 200 });
    }

    if (url.pathname === '/callback' && req.method === 'POST') {
      // LINE webhook：必須在 30 秒內回 200、實際工作放 ctx.waitUntil 背景跑
      const body = await req.text();

      // TODO: 驗證 X-Line-Signature 簽章
      // const signature = req.headers.get('x-line-signature');
      // if (!verifySignature(body, signature, env.LINE_CHANNEL_SECRET)) {
      //   return new Response('invalid signature', { status: 401 });
      // }

      let payload: any;
      try {
        payload = JSON.parse(body);
      } catch {
        return new Response('bad json', { status: 400 });
      }

      const events = payload.events ?? [];
      for (const event of events) {
        // 每個 event 背景處理、不卡 webhook 回應
        ctx.waitUntil(handleLineEvent(event, env));
      }

      return new Response('ok', { status: 200 });
    }

    return new Response('not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
