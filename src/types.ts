export interface Env {
  AI: Ai;
  DB: D1Database;
  RECEIPTS: R2Bucket;
  LINE_CHANNEL_SECRET: string;
  LINE_CHANNEL_ACCESS_TOKEN: string;
  APP_NAME?: string;
}

export interface LineEvent {
  type: string;
  replyToken?: string;
  source?: { userId?: string; type?: string };
  message?: {
    id: string;
    type: 'text' | 'image' | 'sticker' | string;
    text?: string;
  };
  timestamp?: number;
}

export interface ParsedExpense {
  vendor?: string;
  amount: number;
  category?: string;
  items?: Array<{ name: string; price?: number }>;
  date?: string;
  raw?: string;
}
