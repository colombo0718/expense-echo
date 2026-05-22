import type { Env } from '../../src/types';
import { getSessionToken, getUserBySession } from '../../src/auth';
import { listRecentChats } from '../../src/db';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getUserBySession(env, getSessionToken(request));
  if (!user) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10) || 50, 200);
  const rows = await listRecentChats(env.DB, user.id, limit);

  return new Response(JSON.stringify({ chats: rows }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
