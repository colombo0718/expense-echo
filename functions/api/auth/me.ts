import type { Env } from '../../../src/types';
import { getSessionToken, getUserBySession } from '../../../src/auth';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const token = getSessionToken(request);
  const user = await getUserBySession(env, token);
  if (!user) {
    return new Response(JSON.stringify({ user: null }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(
    JSON.stringify({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        entry_source: user.entry_source,
      },
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
};
