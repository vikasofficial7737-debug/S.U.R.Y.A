// ============================================================================
// Edge Function: semantic-search
// AI-ranked search over the caller's visible documents. Visibility is
// pre-filtered by RLS in Postgres; the model only RANKS what the user may see.
// Provider: Upstage SOLAR (default) or Gemini. Key stays server-side.
//
// Deploy: supabase functions deploy semantic-search
// Secrets: SOLAR_API_KEY or GEMINI_API_KEY
// Body: { query: string }
// Returns: { results: [{ id, title, type, score, why }] }
// ============================================================================
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: 'unauthorized' }, 401);

    const { query } = await req.json();
    if (!query || typeof query !== 'string') return json({ error: 'query required' }, 400);

    // RLS filters this to what the caller is allowed to see.
    const { data: docs, error } = await supabase
      .from('documents')
      .select('id, title, type, status, tags, created_at')
      .limit(100);
    if (error) return json({ error: error.message }, 500);
    if (!docs?.length) return json({ results: [] });

    const corpus = docs.map(d => ({
      id: d.id, title: d.title, type: d.type, status: d.status, tags: d.tags ?? [],
    }));

    const prompt =
      `Rank these documents for the query. Return ONLY JSON array (max 8 items), ` +
      `items: {"i": <index into documents>, "score": 0-1, "why": "<=8 words"}\n` +
      `QUERY: ${query}\nDOCUMENTS: ${JSON.stringify(corpus)}`;

    const solarKey = Deno.env.get('SOLAR_API_KEY');
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    let raw = '';

    if (solarKey) {
      const r = await fetch('https://api.upstage.ai/v1/solar/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${solarKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: Deno.env.get('SOLAR_MODEL') ?? 'solar-pro',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0, max_tokens: 500,
        }),
      });
      if (!r.ok) return json({ error: `solar ${r.status}` }, 502);
      raw = (await r.json()).choices?.[0]?.message?.content ?? '';
    } else if (geminiKey) {
      const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-flash-latest';
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0, maxOutputTokens: 500 } }),
        },
      );
      if (!r.ok) return json({ error: `gemini ${r.status}` }, 502);
      raw = (await r.json()).candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? '';
    } else {
      return json({ error: 'no AI provider configured' }, 500);
    }

    const m = raw.match(/\[[\s\S]*\]/);
    const ranked = m ? JSON.parse(m[0]) : [];
    const results = ranked
      .filter((x: any) => Number.isInteger(x.i) && docs[x.i])
      .map((x: any) => ({ ...docs[x.i], score: Number(x.score) || 0, why: x.why ?? '' }))
      .sort((a: any, b: any) => b.score - a.score);

    return json({ results });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}
