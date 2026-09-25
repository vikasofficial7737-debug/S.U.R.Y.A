/* ============================================================================
   Secure env config — the ONLY module that touches import.meta.env.
   Tolerant by design: when Supabase keys are absent the app falls back to
   the in-browser demo store so the presentation never dies mid-demo.
   ========================================================================== */

const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env || {};

export const SUPABASE_URL = env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || '';
export const GEMINI_API_KEY = env.VITE_GEMINI_API_KEY || '';
export const GEMINI_MODEL = env.VITE_GEMINI_MODEL || 'gemini-flash-latest';
export const TESTNET_RPC = env.VITE_TESTNET_RPC || ''; // Tier-3 anchor (optional)

/** True when a reachable Supabase project is configured. */
export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** App can talk to Gemini for the AI assistants. */
export const hasGemini = Boolean(GEMINI_API_KEY);

/** Single console hint (no secrets) so misconfig is visible in devtools. */
if (!hasSupabase) {
  console.info('[config] Supabase env vars not set — running in demo-store fallback mode.');
}
