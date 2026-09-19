export type CaseContext = {
  id: string;
  title: string;
  ipc: string;
  court: string;
  date: string;
  priority: string;
  judge: string;
  status: string;
  description: string;
  evidence: string[];
  timeline: { label: string; date: string; done?: boolean; active?: boolean }[];
};

export type IntelligenceMap = {
  summary: string;
  caseType: string;
  priority: 'High' | 'Medium' | 'Low';
  evidence: string[];
  nodes: { id: string; label: string; detail: string; kind: 'case' | 'party' | 'event' | 'evidence' | 'court' | 'issue' }[];
  edges: { from: string; to: string; label: string }[];
};

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash';

function apiKey() {
  const key = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error('The chatbot is not configured. Add the API key to .env.local, then restart the Vite server.');
  }
  return key;
}

async function generate(prompt: string, responseSchema?: Record<string, unknown>) {
  const generationConfig: Record<string, unknown> = { temperature: responseSchema ? 0.2 : 0.25, maxOutputTokens: responseSchema ? 4096 : 8192 };
  if (responseSchema) {
    generationConfig.responseMimeType = 'application/json';
    generationConfig.responseSchema = responseSchema;
  }
  const response = await fetch(`${API_BASE}/${encodeURIComponent(MODEL)}:generateContent?key=${encodeURIComponent(apiKey())}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: 'You are S.U.R.Y.A., an Indian legal-information assistant for a student demonstration. Be clear, factual, and concise. Never claim to be a lawyer, never invent case facts or citations, and distinguish supplied case facts from general information. Add a short note that your answer is general information, not legal advice when giving legal guidance.' }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || `The chatbot request failed (${response.status}).`);
  }
  const candidate = payload?.candidates?.[0];
  const text = candidate?.content?.parts?.map((part: { text?: string }) => part.text || '').join('').trim();
  if (!text) throw new Error('The chatbot returned an empty response. Please try again.');
  if (candidate?.finishReason === 'MAX_TOKENS') throw new Error('The chatbot response was cut off before it finished. Please try again with a shorter question.');
  return text;
}

export function caseContextText(cases: CaseContext[], selectedCaseId?: string) {
  if (!cases.length) return 'No case records are available.';
  return cases.map(c => `
CASE ${c.id}${selectedCaseId === c.id ? ' (SELECTED CASE)' : ''}
Title: ${c.title}
Matter: ${c.ipc}; ${c.status}; ${c.priority} priority
Court: ${c.court}; next hearing: ${c.date}; judge: ${c.judge}
Description: ${c.description}
Evidence: ${c.evidence.join('; ')}
Timeline: ${c.timeline.map(t => `${t.label} (${t.date})`).join('; ')}`).join('\n---\n');
}

export async function askGemini(question: string, role: string, cases: CaseContext[], selectedCaseId?: string) {
  const context = role === 'lawyer'
    ? `\nThe following are the user's private demo case records. Answer using only these supplied records for questions about their cases. If the question says “this case”, use the selected case.\n${caseContextText(cases, selectedCaseId)}`
    : '';
  return generate(`User role: ${role}.\nUser question: ${question}${context}\n\nAnswer in readable Markdown with a direct answer first. Use headings or bullets only when helpful.`);
}

const mapSchema = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    caseType: { type: 'string' },
    priority: { type: 'string', enum: ['High', 'Medium', 'Low'] },
    evidence: { type: 'array', items: { type: 'string' } },
    nodes: {
      type: 'array', minItems: 3, maxItems: 5,
      items: { type: 'object', properties: { id: { type: 'string' }, label: { type: 'string' }, detail: { type: 'string' }, kind: { type: 'string', enum: ['case', 'party', 'event', 'evidence', 'court', 'issue'] } }, required: ['id', 'label', 'detail', 'kind'] },
    },
    edges: {
      type: 'array', maxItems: 6,
      items: { type: 'object', properties: { from: { type: 'string' }, to: { type: 'string' }, label: { type: 'string' } }, required: ['from', 'to', 'label'] },
    },
  },
  required: ['summary', 'caseType', 'priority', 'evidence', 'nodes', 'edges'],
} as const;

export async function explainCaseNetwork(
  title: string,
  nodes: { label: string; role: string; sub?: string }[],
  edges: { from: string; to: string; label?: string; suspected?: boolean }[],
): Promise<string> {
  const listing = nodes.map(n => `- ${n.label} (${n.role}${n.sub ? `: ${n.sub}` : ''})`).join('\n');
  const links = edges
    .map(e => `- ${e.from} → ${e.to}${e.label ? ` (${e.label})` : ''}${e.suspected ? ' [suspected / AI-suggested]' : ' [confirmed]'}`)
    .join('\n');
  const prompt = `You are looking at a relationship graph extracted from the case "${title}".\n\nNodes:\n${listing}\n\nLinks:\n${links || '(none)'}\n\nIn 2–3 sentences (max 60 words), state the key finding this network reveals: the chain that connects the core parties, the most probative evidence link, and any suspected link that needs verification. State only what the graph shows; do not invent facts. Plain text, no Markdown.`;
  return generate(prompt);
}

export async function analyzeCase(title: string, facts: string): Promise<IntelligenceMap> {
  const prompt = `Analyze this legal case only from the supplied text. Create a factual relationship map. Do not add parties, evidence, statutes, or events that are not present or directly inferable.\n\nTitle: ${title}\nFacts: ${facts}\n\nIMPORTANT: Keep all text VERY SHORT. Node labels: max 10 characters. Node details: max 12 characters. Edge labels: max 8 characters. Use simple terms like "Witness", "CCTV", "Report", "Hearing" instead of long descriptions.\n\nReturn exactly one complete JSON object that matches the requested schema: 3–5 uniquely-id'd nodes and at most 6 directed edges. No Markdown or explanation outside the JSON.`;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const retryNote = attempt ? '\nYour previous response was incomplete. Ensure every quote and bracket is closed and the JSON is valid.' : '';
      const raw = await generate(prompt + retryNote, mapSchema);
      const json = raw.replace(/^\`\`\`json\s*/i, '').replace(/^\`\`\`\s*/i, '').replace(/\s*\`\`\`$/, '').trim();
      const parsed = JSON.parse(json) as IntelligenceMap;
      if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges) || parsed.nodes.length < 3) throw new Error('Incomplete map');
      return parsed;
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      // A retry handles a rare truncated structured response from the provider.
    }
  }
  throw new Error('The chatbot returned an incomplete map. Please try again with simpler case facts or check your API key configuration.');
}
