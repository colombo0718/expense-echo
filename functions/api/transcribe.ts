/**
 * STT API：把錄音轉文字。
 *
 * Flow：前端 MediaRecorder → audio Blob → POST multipart →
 *   Workers AI Whisper → 回 text。
 *
 * 加 fallback chain（turbo → 標準 whisper）+ 詳細錯誤路徑、避免 CF 自動 502。
 */

import type { Env } from '../../src/types';
import { getSessionToken, getUserBySession } from '../../src/auth';
import { logAiRun } from '../../src/db';

const STT_MODELS = [
  '@cf/openai/whisper-large-v3-turbo',
  '@cf/openai/whisper',
];
const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25 MB

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // 包整段、確保任何 throw 都回 JSON 不會變 502 HTML
  try {
    const user = await getUserBySession(env, getSessionToken(request));
    if (!user) return json({ error: 'unauthorized' }, 401);

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return json({ error: 'expected multipart/form-data' }, 400);
    }

    const form = await request.formData().catch(() => null);
    if (!form) return json({ error: 'bad form' }, 400);

    const audio = form.get('audio');
    if (!(audio instanceof File) || audio.size === 0) {
      return json({ error: 'audio field missing or empty' }, 400);
    }
    if (audio.size > MAX_AUDIO_BYTES) {
      return json({ error: 'audio too large', max_bytes: MAX_AUDIO_BYTES, got: audio.size }, 413);
    }

    const buf = await audio.arrayBuffer();
    const audioArray = [...new Uint8Array(buf)];

    let lastError: string | undefined;
    let usedModel = STT_MODELS[0];

    for (const model of STT_MODELS) {
      usedModel = model;
      const t0 = Date.now();
      try {
        const res = await env.AI.run(model, { audio: audioArray } as any);
        const latency = Date.now() - t0;
        const text = String((res as any)?.text ?? '').trim();

        await logAiRun(env.DB, {
          user_id: user.id,
          model,
          task: 'text',
          latency_ms: latency,
          ok: text.length > 0,
          error: text.length === 0 ? 'empty transcript' : undefined,
        });

        if (!text) {
          lastError = 'empty transcript';
          continue;
        }

        return json({
          text,
          model,
          latency_ms: latency,
          audio_bytes: audio.size,
          audio_mime: audio.type,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        lastError = msg;
        await logAiRun(env.DB, {
          user_id: user.id,
          model,
          task: 'text',
          latency_ms: Date.now() - t0,
          ok: false,
          error: msg,
        });
        continue;
      }
    }

    return json({
      error: 'transcription failed',
      detail: lastError ?? 'unknown',
      tried_models: STT_MODELS,
      last_model: usedModel,
      audio_bytes: audio.size,
      audio_mime: audio.type,
    }, 502);
  } catch (outer) {
    // 最外層保險、絕對不讓 502 HTML 跑出去
    const msg = outer instanceof Error ? outer.message : String(outer);
    const stack = outer instanceof Error ? outer.stack : undefined;
    return new Response(JSON.stringify({ error: 'outer exception', detail: msg, stack }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
