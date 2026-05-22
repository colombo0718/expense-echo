/**
 * STT API：把錄音轉文字。
 *
 * Flow：前端 MediaRecorder → audio Blob → POST multipart →
 *   Workers AI Whisper-large-v3-turbo → 回 text。
 *
 * 不寫 DB（這層只負責 transcribe）、轉文字之後前端再決定要不要送 /api/chat。
 */

import type { Env } from '../../src/types';
import { getSessionToken, getUserBySession } from '../../src/auth';
import { logAiRun } from '../../src/db';

const STT_MODEL = '@cf/openai/whisper-large-v3-turbo';
const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25 MB 上限、夠錄 ~5 分鐘 webm

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
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
    return json({ error: 'audio too large', max_bytes: MAX_AUDIO_BYTES }, 413);
  }

  const buf = await audio.arrayBuffer();
  const audioArray = [...new Uint8Array(buf)];

  const t0 = Date.now();
  try {
    const res = await env.AI.run(STT_MODEL, { audio: audioArray } as any);
    const latency = Date.now() - t0;

    const text = String((res as any)?.text ?? '').trim();

    await logAiRun(env.DB, {
      user_id: user.id,
      model: STT_MODEL,
      task: 'text', // STT 暫掛 text、未來可以加 'stt' 類別
      latency_ms: latency,
      ok: text.length > 0,
      error: text.length === 0 ? 'empty transcript' : undefined,
    });

    if (!text) {
      return json({ error: 'empty transcript', hint: '奴家沒聽清楚、再說一次？' }, 422);
    }

    return json({
      text,
      model: STT_MODEL,
      latency_ms: latency,
      audio_bytes: audio.size,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logAiRun(env.DB, {
      user_id: user.id,
      model: STT_MODEL,
      task: 'text',
      latency_ms: Date.now() - t0,
      ok: false,
      error: msg,
    });
    return json({ error: 'transcription failed', detail: msg }, 502);
  }
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
