export interface Env {
  AI: Ai;
  DB: D1Database;
  RECEIPTS: R2Bucket;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  SESSION_COOKIE_SECRET: string;
  APP_NAME?: string;
  APP_URL?: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  tier: 'free' | 'pro' | 'admin';
  entry_source: 'google' | 'll' | 'jingen' | 'mosme';
  google_sub: string | null;
  created_at: string;
  last_seen_at: string;
}

export interface Session {
  token: string;
  user_id: string;
  created_at: string;
  expires_at: string;
}

export interface ParsedExpense {
  vendor?: string;
  amount: number;
  category?: string;
  items?: Array<{ name: string; price?: number }>;
  date?: string;
  raw?: string;
}

export interface AiRunLog {
  user_id: string | null;
  model: string;
  task: 'vision' | 'text';
  latency_ms: number;
  neurons?: number;
  ok: boolean;
  error?: string;
}

export interface GoogleUserInfo {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
}
