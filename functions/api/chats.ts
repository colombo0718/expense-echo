import type { Env } from '../../src/types';
import { getSessionToken, getUserBySession } from '../../src/auth';
import { listRecentChats, listChatsSince } from '../../src/db';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getUserBySession(env, getSessionToken(request));
  if (!user) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const sinceIdRaw = url.searchParams.get('since_id');
  const sinceId = sinceIdRaw ? parseInt(sinceIdRaw, 10) || 0 : 0;
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10) || 50, 200);

  const rows = sinceId > 0
    ? await listChatsSince(env.DB, user.id, sinceId, limit)
    : await listRecentChats(env.DB, user.id, limit);

  return new Response(JSON.stringify({ chats: rows, since_id: sinceId }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
