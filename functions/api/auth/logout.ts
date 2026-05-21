import type { Env } from '../../../src/types';
import {
  getSessionToken,
  deleteSession,
  clearSessionCookie,
} from '../../../src/auth';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const token = getSessionToken(request);
  if (token) await deleteSession(env, token);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': clearSessionCookie(url),
    },
  });
};
