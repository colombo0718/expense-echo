import type { Env } from '../../src/types';
import { getSessionToken, getUserBySession } from '../../src/auth';
import { listRecentExpenses } from '../../src/db';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getUserBySession(env, getSessionToken(request));
  if (!user) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20', 10) || 20, 100);
  const rows = await listRecentExpenses(env.DB, user.id, limit);

  return new Response(JSON.stringify({ expenses: rows }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
