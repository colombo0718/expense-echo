import type { Env, User, Session } from './types';

const SESSION_COOKIE_NAME = 'session';
const STATE_COOKIE_NAME = 'oauth_state';
const SESSION_TTL_DAYS = 30;

export function isProd(url: URL): boolean {
  return url.hostname.endsWith('.pages.dev') || url.hostname.endsWith('.leaflune.org');
}

export function buildCookie(name: string, value: string, opts: {
  maxAgeSec?: number;
  secure: boolean;
  domain?: string;
  httpOnly?: boolean;
  sameSite?: 'Lax' | 'Strict' | 'None';
  path?: string;
}): string {
  const parts = [`${name}=${value}`];
  parts.push(`Path=${opts.path ?? '/'}`);
  parts.push(`SameSite=${opts.sameSite ?? 'Lax'}`);
  if (opts.httpOnly ?? true) parts.push('HttpOnly');
  if (opts.secure) parts.push('Secure');
  if (opts.domain) parts.push(`Domain=${opts.domain}`);
  if (typeof opts.maxAgeSec === 'number') parts.push(`Max-Age=${opts.maxAgeSec}`);
  return parts.join('; ');
}

export function clearCookie(name: string, secure: boolean): string {
  return buildCookie(name, '', { maxAgeSec: 0, secure });
}

export function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const pair of header.split(';')) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

export function newToken(): string {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
}

export async function createSession(env: Env, userId: string): Promise<Session> {
  const token = newToken();
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_TTL_DAYS * 86400_000);
  await env.DB
    .prepare(`INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)`)
    .bind(token, userId, expires.toISOString())
    .run();
  return {
    token,
    user_id: userId,
    created_at: now.toISOString(),
    expires_at: expires.toISOString(),
  };
}

export async function deleteSession(env: Env, token: string): Promise<void> {
  await env.DB.prepare(`DELETE FROM sessions WHERE token = ?`).bind(token).run();
}

export async function getUserBySession(env: Env, token: string | undefined): Promise<User | null> {
  if (!token) return null;
  const row = await env.DB
    .prepare(
      `SELECT u.* FROM users u
         JOIN sessions s ON s.user_id = u.id
        WHERE s.token = ?
          AND s.expires_at > datetime('now')`
    )
    .bind(token)
    .first<User>();
  if (!row) return null;
  await env.DB
    .prepare(`UPDATE users SET last_seen_at = datetime('now') WHERE id = ?`)
    .bind(row.id)
    .run();
  return row;
}

export function sessionCookie(token: string, url: URL): string {
  return buildCookie(SESSION_COOKIE_NAME, token, {
    maxAgeSec: SESSION_TTL_DAYS * 86400,
    secure: isProd(url),
    httpOnly: true,
    sameSite: 'Lax',
  });
}

export function clearSessionCookie(url: URL): string {
  return clearCookie(SESSION_COOKIE_NAME, isProd(url));
}

export function stateCookie(state: string, url: URL): string {
  return buildCookie(STATE_COOKIE_NAME, state, {
    maxAgeSec: 600,
    secure: isProd(url),
    httpOnly: true,
    sameSite: 'Lax',
  });
}

export function clearStateCookie(url: URL): string {
  return clearCookie(STATE_COOKIE_NAME, isProd(url));
}

export function getSessionToken(req: Request): string | undefined {
  return parseCookies(req.headers.get('cookie')).session;
}

export function getStateToken(req: Request): string | undefined {
  return parseCookies(req.headers.get('cookie')).oauth_state;
}

export { SESSION_COOKIE_NAME, STATE_COOKIE_NAME };
