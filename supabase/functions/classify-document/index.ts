// ============================================================================
// Edge Function: classify-document
// Server-side AI classification (document type + sensitivity suggestion).
// Provider switch: UPSTAGE SOLAR (default per project) or Gemini.
// The API key lives in Supabase Edge secrets — never in the browser.
//
// Deploy: supabase functions deploy classify-document
// Secrets: SOLAR_API_KEY (preferred) or GEMINI_API_KEY; SOLAR_MODEL optional
//          (default: solar-pro), GEMINI_MODEL optional (default: gemini-flash-latest)
// Body: { text: string }  (OCR text or description of the document)
// Returns: { type, confidence, reasoning, provider }
// ============================================================================
import { createClient } from 'jsr:@supabase/supabase-js@2';

const TYPES = [
  'fir', 'investigation_record', 'witness_statement', 'charge_sheet',
  'court_filing', 'evidence_record', 'forensic_report', 'legal_notice', 'judgment',
] as const;

const SYSTEM = `You classify Indian legal/investigation documents.
Reply with ONLY compact JSON: {"type": one of ${TYPES.join('|')}, "confidence": 0-1, "reasoning": "max 15 words"}`;

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

    const { text } = await req.json();
    if (!text || typeof text !== 'string') return json({ error: 'text required' }, 400);
    const excerpt = text.slice(0, 4000);

    const solarKey = Deno.env.get('SOLAR_API_KEY');
    const geminiKey = Deno.env.get('GEMINI_API_KEY');

    if (solarKey) {
      const r = await fetch('https://api.upstage.ai/v1/solar/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${solarKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: Deno.env.get('SOLAR_MODEL') ?? 'solar-pro',
          messages: [
            { role: 'system', content: SYSTEM },
            { role: 'user', content: excerpt },
          ],
          temperature: 0,
          max_tokens: 120,
        }),
      });
      if (!r.ok) return json({ error: `solar ${r.status}` }, 502);
      const data = await r.json();
      return json({ ...parse(data.choices?.[0]?.message?.content ?? ''), provider: 'solar' });
    }

    if (geminiKey) {
      const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-flash-latest';
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM }] },
            contents: [{ parts: [{ text: excerpt }] }],
            generationConfig: { temperature: 0, maxOutputTokens: 120 },
          }),
        },
      );
      if (!r.ok) return json({ error: `gemini ${r.status}` }, 502);
      const data = await r.json();
      const out = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? '';
      return json({ ...parse(out), provider: 'gemini' });
    }

    return json({ error: 'no AI provider configured (set SOLAR_API_KEY or GEMINI_API_KEY)' }, 500);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function parse(raw: string): { type: string; confidence: number; reasoning: string } {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return { type: 'investigation_record', confidence: 0.3, reasoning: 'unparseable — default' };
  try {
    const p = JSON.parse(m[0]);
    const type = TYPES.includes(p.type) ? p.type : 'investigation_record';
    return { type, confidence: Number(p.confidence) || 0.5, reasoning: p.reasoning ?? '' };
  } catch {
    return { type: 'investigation_record', confidence: 0.3, reasoning: 'unparseable — default' };
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}
