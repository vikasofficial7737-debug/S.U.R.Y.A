import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, hasSupabase } from './config';

/**
 * Backend gateway.
 *  - `db`  : Supabase client, or null in demo-fallback mode.
 *  - `mode`: 'live' (Supabase reachable) | 'demo' (in-browser fallback).
 * Every data function checks `mode` and degrades gracefully, so the UI is
 * identical in both modes — only the storage differs.
 */
export const db: SupabaseClient | null = hasSupabase
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

export const backendMode: 'live' | 'demo' = hasSupabase ? 'live' : 'demo';

export function isLive(): boolean {
  return db !== null;
}

/** Uniform error shaping so callers can branch without knowing the backend. */
export function dbError(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === 'object') {
    const anyE = e as Record<string, unknown>;
    if (typeof anyE.message === 'string') return anyE.message;
    try { return JSON.stringify(e); } catch { return String(e); }
  }
  return String(e);
}
