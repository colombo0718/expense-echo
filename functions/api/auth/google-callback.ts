import type { Env, GoogleUserInfo } from '../../../src/types';
import {
  getStateToken,
  clearStateCookie,
  sessionCookie,
  createSession,
} from '../../../src/auth';
import { upsertUserFromGoogle } from '../../../src/db';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const stateCookieVal = getStateToken(request);

  if (!code || !state || !stateCookieVal || state !== stateCookieVal) {
    return new Response('invalid oauth state', { status: 400 });
  }

  const redirectUri = `${url.origin}/api/auth/google-callback`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    return new Response(`google token exchange failed: ${body}`, { status: 502 });
  }

  const tokenJson = (await tokenRes.json()) as { access_token: string };

  const userRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  if (!userRes.ok) {
    return new Response('google userinfo failed', { status: 502 });
  }
  const info = (await userRes.json()) as GoogleUserInfo;

  if (!info.email) {
    return new Response('google account has no email', { status: 400 });
  }

  const user = await upsertUserFromGoogle(env.DB, info);
  const session = await createSession(env, user.id);

  const headers = new Headers({ Location: '/' });
  headers.append('Set-Cookie', sessionCookie(session.token, url));
  headers.append('Set-Cookie', clearStateCookie(url));

  return new Response(null, { status: 302, headers });
};
