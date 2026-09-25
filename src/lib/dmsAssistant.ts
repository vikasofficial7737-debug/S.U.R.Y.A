/* Role-scoped AI assistant for the DMS dashboards.
   Security rules baked into every prompt:
   • The assistant sees ONLY summary/metadata context (counts, statuses, IDs) — never document contents.
   • It answers operational questions ("what should I do next", "what's pending") grounded in the live data.
   • It never makes legal decisions; it flags and summarizes. */

export type DmsContext = {
  role: string;
  officer: string;
  jurisdiction: string;
  documents: { name: string; type: string; caseId: string; status: string; version: number; signed: boolean; legalHold: boolean; department: string }[];
  auditCount: number;
  ledgerBlocks: number;
  evidence: { evId: string; type: string; custodian: string; status: string; integrity: string }[];
  recentAudit: { action: string; target: string; actor: string; at: string }[];
};

const ROLE_CHARTER: Record<string, string> = {
  'Investigating Officer': 'You assist an Investigating Officer. Focus on: FIR workflow status, evidence registration and custody transfers, pending document verifications, and investigation next steps. Never suggest altering a verified record — corrections require a new version with reason.',
  'Forensic Officer': 'You assist a Forensic Officer. Focus on: evidence hash verification on receipt, examination workflow, report signing, and custody return. Remind about integrity checks when relevant.',
  'Court / Registrar Staff': 'You assist Court/Registrar staff with READ-ONLY review duties. Focus on: what can be verified (hash, signature, version chain, custody), what is missing or pending before acceptance. You must never suggest edits to records.',
  'Legal Department Officer': 'You assist a Legal Officer/Prosecutor. Focus on: case readiness, missing documents, charge-sheet status, what needs legal review or signature before court submission.',
  'Records / Compliance Officer': 'You assist a Records/Compliance Officer. Focus on: retention schedules, legal holds, audit completeness, integrity events, and compliance risks.',
  'System Admin': 'You assist the System Administrator. Focus on: user/role/permission posture, security events, ledger health, and operational housekeeping. Never reveal credentials or suggest weakening access controls.',
};

export function buildAssistantPrompt(question: string, ctx: DmsContext): string {
  const charter = ROLE_CHARTER[ctx.role] ?? ROLE_CHARTER['System Admin'];
  const docs = ctx.documents.map(d => `- ${d.name} (${d.type}, ${d.caseId}, v${d.version}, ${d.status}${d.signed ? ', signed' : ', unsigned'}${d.legalHold ? ', LEGAL HOLD' : ''}, dept: ${d.department})`).join('\n') || '- (none visible)';
  const ev = ctx.evidence.map(e => `- ${e.evId} (${e.type}, custodian: ${e.custodian}, ${e.status}, integrity: ${e.integrity})`).join('\n') || '- (none)';
  const audit = ctx.recentAudit.map(a => `- ${a.at}: ${a.action} — ${a.target} (by ${a.actor})`).join('\n') || '- (none)';
  return `You are the embedded assistant of NyayaVault, a Secure Legal & Investigation Document Management System for Indian agencies.

YOUR ROLE CHARTER: ${charter}

Signed-in officer: ${ctx.officer} (${ctx.role}, ${ctx.jurisdiction} jurisdiction).

LIVE WORKSPACE CONTEXT (metadata only — you cannot see document contents):
Documents:
${docs}
Evidence:
${ev}
Recent audit events:
${audit}
Totals: ${ctx.documents.length} documents, ${ctx.evidence.length} evidence exhibits, ${ctx.auditCount} audit events, ${ctx.ledgerBlocks} blockchain ledger blocks.

SECURITY RULES (absolute):
1. Ground every answer in the context above. If something isn't in the workspace, say so instead of inventing it.
2. Never claim to make legal decisions. You organize and inform; qualified officers decide.
3. Never suggest bypassing verification, editing verified records in place, or weakening access controls. Corrections = new version with a recorded reason.
4. Be concise and operational — short paragraphs or tight bullet lists.

OFFICER'S QUESTION: ${question}`;
}

const MODELS = ['gemini-flash-latest', import.meta.env.VITE_GEMINI_MODEL?.trim(), 'gemini-2.5-flash'].filter(Boolean) as string[];

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function askDmsAssistant(question: string, ctx: DmsContext): Promise<string> {
  const key = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (!key) throw new Error('Gemini key not configured (.env.local: VITE_GEMINI_API_KEY).');
  let lastError: Error | null = null;
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: buildAssistantPrompt(question, ctx) }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
          }),
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          const message: string = payload?.error?.message || `Assistant request failed (${res.status}).`;
          lastError = new Error(message);
          // 503/429 = transient — retry same model with backoff; 404/400 = model gone — next model
          if ((res.status === 503 || res.status === 429) && attempt < 2) { await wait(1200 * (attempt + 1)); continue; }
          break;
        }
        const text = payload?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('').trim();
        if (!text) { lastError = new Error('Assistant returned an empty response.'); continue; }
        return text;
      } catch (e) {
        lastError = e instanceof Error ? e : new Error('Assistant failed.');
        if (attempt < 2) await wait(1000 * (attempt + 1));
      }
    }
  }
  throw lastError ?? new Error('Assistant failed.');
}
