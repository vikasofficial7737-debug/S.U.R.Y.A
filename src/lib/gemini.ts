import { JUDGMENTS } from '../data/judgments';

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
const MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-flash-latest';

/* Presentation-grade reliability.
   Google retires models (404) and rate-limits them (503/429) without notice, which would
   look like a broken assistant in front of an evaluator. So every call walks an ordered
   chain of equivalent models: transient failures are retried once on the same model, then
   the next model is tried. Configure with VITE_GEMINI_FALLBACK_MODELS if you want your own. */
const FALLBACK_MODELS = (import.meta.env.VITE_GEMINI_FALLBACK_MODELS
  || 'gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemini-3-flash-preview')
  .split(',').map((m: string) => m.trim()).filter(Boolean);
const MODEL_CHAIN: string[] = [MODEL, ...FALLBACK_MODELS.filter((m: string) => m !== MODEL)];
const TRANSIENT_STATUS = new Set([408, 429, 500, 502, 503, 504]);
export let lastModelUsed = MODEL;

async function requestModel(body: Record<string, unknown>): Promise<Record<string, any>> {
  let lastMessage = '';
  for (const model of MODEL_CHAIN) {
    for (let attempt = 0; attempt < 2; attempt++) {
      let response: Response;
      try {
        response = await fetch(`${API_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey())}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } catch {
        lastMessage = 'The chatbot could not reach the AI service. Check the internet connection and try again.';
        break;
      }
      const payload = await response.json().catch(() => ({}));
      if (response.ok) { lastModelUsed = model; return payload; }
      lastMessage = payload?.error?.message || `The chatbot request failed (${response.status}).`;
      if (TRANSIENT_STATUS.has(response.status) && attempt === 0) {
        await new Promise(r => setTimeout(r, 900));
        continue;
      }
      break;
    }
  }
  throw new Error(lastMessage || 'The chatbot is unavailable right now. Please try again.');
}

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
  const payload = await requestModel({
      systemInstruction: { parts: [{ text: 'You are S.U.R.Y.A., an Indian legal-information assistant for a student demonstration. Be clear, factual, and concise. Never claim to be a lawyer, never invent case facts or citations, and distinguish supplied case facts from general information. Add a short note that your answer is general information, not legal advice when giving legal guidance.' }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
  });
  const candidate = payload?.candidates?.[0];
  const text = candidate?.content?.parts?.map((part: { text?: string }) => part.text || '').join('').trim();
  if (!text) throw new Error('The chatbot returned an empty response. Please try again.');
  if (candidate?.finishReason === 'MAX_TOKENS') throw new Error('The chatbot response was cut off before it finished. Please try again with a shorter question.');
  return text;
}

async function generateParts(parts: Record<string, unknown>[], responseSchema?: Record<string, unknown>): Promise<string> {
  const generationConfig: Record<string, unknown> = { temperature: responseSchema ? 0.2 : 0.25, maxOutputTokens: responseSchema ? 4096 : 8192 };
  if (responseSchema) {
    generationConfig.responseMimeType = 'application/json';
    generationConfig.responseSchema = responseSchema;
  }
  const payload = await requestModel({
      systemInstruction: { parts: [{ text: 'You are S.U.R.Y.A., an Indian legal-information assistant. Be precise and factual, never invent content not present in the supplied material, and note when something needs verification by a qualified professional.' }] },
      contents: [{ role: 'user', parts }],
      generationConfig,
  });
  const candidate = payload?.candidates?.[0];
  const text = candidate?.content?.parts?.map((part: { text?: string }) => part.text || '').join('').trim();
  if (!text) throw new Error('The analyzer returned an empty response. Please try again.');
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

const judgmentCatalog = () =>
  JUDGMENTS.map(j => `- ${j.title} | ${j.citation} | ${j.court} | ${j.year} | domain: ${j.domain} | tags: ${j.tags.join(', ')} | ${j.summary}`).join('\n');

export async function askGemini(question: string, role: string, cases: CaseContext[], selectedCaseId?: string) {
  const context = role === 'lawyer'
    ? `\nThe following are the user's private demo case records. Answer using only these supplied records for questions about their cases. If the question says “this case”, use the selected case.\n${caseContextText(cases, selectedCaseId)}`
    : role === 'student'
      ? `\nThe user is a law student studying with this app. Below is the COMPLETE catalog of landmark judgments available in the app's Case Library.\n\nJUDGMENT CATALOG:\n${judgmentCatalog()}\n\nRules for you:\n- When the student asks to study or find cases (for example: “top murder cases”, “cases from 2010”, “Delhi cases”, “cyber law cases”), pick the most relevant entries FROM THIS CATALOG ONLY. For each, give the case name, citation, court, year, and 1–2 lines on why it matters. Order them by relevance.\n- If the catalog has nothing on the topic, say so plainly and explain what such cases generally deal with. NEVER invent case names, citations, or years.\n- End by telling the student they can open each case from the Case Library (search the case name, or filter by domain/year/court).\n- Keep the tone friendly and explanatory, suitable for a student.`
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

const stripFence = (raw: string) => raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

export type DocumentAnalysis = {
  title: string;
  docType: string;
  summary: string;
  keyPoints: string[];
  parties: string[];
  dates: { date: string; significance: string }[];
  risks: string[];
  questions: string[];
};

const docSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    docType: { type: 'string' },
    summary: { type: 'string' },
    keyPoints: { type: 'array', items: { type: 'string' } },
    parties: { type: 'array', items: { type: 'string' } },
    dates: { type: 'array', items: { type: 'object', properties: { date: { type: 'string' }, significance: { type: 'string' } }, required: ['date', 'significance'] } },
    risks: { type: 'array', items: { type: 'string' } },
    questions: { type: 'array', items: { type: 'string' } },
  },
  required: ['title', 'docType', 'summary', 'keyPoints', 'parties', 'dates', 'risks', 'questions'],
} as const;

/** Analyze a pasted document (or an inline image/PDF part) from a legal-case perspective. */
export async function analyzeDocument(opts: {
  fileName: string;
  text?: string;
  inline?: { mimeType: string; data: string }; // base64, no data: prefix
  caseContext?: string;
}): Promise<DocumentAnalysis> {
  const caseLine = opts.caseContext
    ? `Focus on what matters for THIS case: ${opts.caseContext}\n`
    : '';
  const prompt = `${caseLine}You are assisting an Indian advocate reviewing a document for litigation or advisory use. Analyze ONLY what is in the document; if a field cannot be filled from the document, return an empty list and a summary that says what is missing. Identify the document type, its main points from the perspective of the case, every party, every date and why it matters, clauses or facts that carry risk or need verification, and clarifying questions the advocate should put to the client. Be precise and concise. Plain strings only, no Markdown formatting inside fields.`;

  const parts: Record<string, unknown>[] = [{ text: prompt }];
  if (opts.text?.trim()) parts.push({ text: `DOCUMENT (${opts.fileName}):\n${opts.text.slice(0, 60000)}` });
  if (opts.inline) parts.push({ inline_data: { mime_type: opts.inline.mimeType, data: opts.inline.data } });

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const raw = await generateParts(parts, docSchema);
      const json = stripFence(raw);
      const parsed = JSON.parse(json) as DocumentAnalysis;
      if (!parsed.summary) throw new Error('empty');
      return parsed;
    } catch (error) {
      console.error(`Document analysis attempt ${attempt + 1} failed:`, error);
    }
  }
  throw new Error('The analyzer could not read this document. If it is a scanned copy, paste the text instead; otherwise try again.');
}

export type QuizQuestion = {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

export type GeneratedQuiz = {
  title: string;
  questions: QuizQuestion[];
};

const quizSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    questions: {
      type: 'array', minItems: 5, maxItems: 7,
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' }, minItems: 4, maxItems: 4 },
          answerIndex: { type: 'integer', minimum: 0, maximum: 3 },
          explanation: { type: 'string' },
        },
        required: ['question', 'options', 'answerIndex', 'explanation'],
      },
    },
  },
  required: ['title', 'questions'],
} as const;

/** Build a short MCQ quiz from the selected judgments' core content. */
export async function generateQuiz(judgments: { title: string; citation: string; year: number; court: string; facts: string; issues: string[]; holding: string; ratio: string; significance: string; statutes: string[] }[]): Promise<GeneratedQuiz> {
  const material = judgments.map(j =>
    `CASE: ${j.title} (${j.citation}, ${j.court}, ${j.year})\nFacts: ${j.facts}\nIssues: ${j.issues.join(' ')}\nHolding: ${j.holding}\nRatio: ${j.ratio}\nSignificance: ${j.significance}\nStatutes: ${j.statutes.join('; ')}`
  ).join('\n\n---\n\n');
  const prompt = `You are setting a law-school comprehension quiz for a student who has just studied these Indian landmark judgment(s).\n\n${material}\n\nCreate exactly 5 multiple-choice questions (4 options each) on the MOST IMPORTANT examinable points: the ratio decidendi, key doctrines, facts that decide the outcome, the statute sections involved, and wrong-answer traps that test common misconceptions. Exactly one option must be correct (answerIndex 0-3). Explanations: 1-2 sentences on why the answer is right, suitable for revision. Keep questions under 40 words and options under 18 words. Do not test trivia like bench composition. Plain text only, no Markdown inside fields.`;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const raw = await generate(prompt, quizSchema);
      const json = stripFence(raw);
      const parsed = JSON.parse(json) as GeneratedQuiz;
      if (!Array.isArray(parsed.questions) || parsed.questions.length < 3) throw new Error('thin quiz');
      // Guard against malformed indices from the model.
      parsed.questions = parsed.questions.filter(q =>
        Array.isArray(q.options) && q.options.length === 4
        && Number.isInteger(q.answerIndex) && q.answerIndex >= 0 && q.answerIndex <= 3);
      if (parsed.questions.length < 3) throw new Error('thin quiz');
      return parsed;
    } catch (error) {
      console.error(`Quiz generation attempt ${attempt + 1} failed:`, error);
    }
  }
  throw new Error('Could not generate the quiz. Please try again in a moment.');
}

export async function analyzeCase(title: string, facts: string): Promise<IntelligenceMap> {
  const prompt = `Analyze this legal case only from the supplied text. Create a factual relationship map. Do not add parties, evidence, statutes, or events that are not present or directly inferable.\n\nTitle: ${title}\nFacts: ${facts}\n\nIMPORTANT: Keep all text VERY SHORT. Node labels: max 10 characters. Node details: max 12 characters. Edge labels: max 8 characters. Use simple terms like "Witness", "CCTV", "Report", "Hearing" instead of long descriptions.\n\nReturn exactly one complete JSON object that matches the requested schema: 3–5 uniquely-id'd nodes and at most 6 directed edges. No Markdown or explanation outside the JSON.`;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const retryNote = attempt ? '\nYour previous response was incomplete. Ensure every quote and bracket is closed and the JSON is valid.' : '';
      const raw = await generate(prompt + retryNote, mapSchema);
      const json = stripFence(raw);
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
