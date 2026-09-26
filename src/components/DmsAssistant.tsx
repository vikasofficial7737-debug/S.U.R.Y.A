import { useState } from 'react';
import { Bot, Send, X, Sparkles } from 'lucide-react';
import { askDmsAssistant, type DmsContext } from '../lib/dmsAssistant';

export function DmsAssistant({ ctx, onOpenCase }: { ctx: DmsContext; onOpenCase?: (caseId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [chat, setChat] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const suggestions: Record<string, string[]> = {
    'Investigating Officer': ['What is pending on my case?', 'Which evidence needs custody action?', 'Summarize my document verification status'],
    'Forensic Officer': ['What evidence is in my custody?', 'Which reports are unsigned?', 'What should I verify on receipt?'],
    'Court / Registrar Staff': ['What can I verify before acceptance?', 'Any pending verifications in the record?', 'Which documents are signed?'],
    'Legal Department Officer': ['Is the case ready for submission?', 'What documents are missing?', 'What needs my signature?'],
    'Records / Compliance Officer': ['Any compliance risks right now?', 'Which records are on legal hold?', 'Summarize recent audit activity'],
    'System Admin': ['Any security concerns in the recent activity?', 'Summarize system posture', 'Which documents are flagged?'],
  };

  const send = async (text?: string) => {
    const question = (text ?? q).trim();
    if (!question || busy) return;
    setChat(c => [...c, { role: 'user', text: question }]);
    setQ(''); setBusy(true); setError('');
    try {
      /* Case-ID shortcut: "open docs of CR/124/2026" jumps straight to that case workspace. */
      const caseMatch = question.toUpperCase().match(/\b((?:CR|CV|CY|MC|SC)\/\d{3,4}\/\d{4})\b/);
      const wantsOpen = /open|show|pull|fetch|access/i.test(question) && /doc|case|file|record/i.test(question);
      if (caseMatch && wantsOpen && onOpenCase) {
        const caseId = caseMatch[1];
        const known = ctx.caseIds.includes(caseId);
        setChat(c => [...c, { role: 'ai', text: known
          ? `Opening case ${caseId} — pulling up its document workspace now.`
          : `Case ${caseId} is outside your assigned caseload, so I cannot open its documents. I have noted the ID — send an access request from the Active Cases page and the System Admin can approve it.` }]);
        setBusy(false);
        if (known) onOpenCase(caseId);
        return;
      }
      const answer = await askDmsAssistant(question, ctx);
      setChat(c => [...c, { role: 'ai', text: answer }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Assistant failed.');
    } finally { setBusy(false); }
  };

  return <>
    {!open && <button className="dms-assist-fab" onClick={() => setOpen(true)} title="AI workspace assistant">
      <Bot /><span className="dms-assist-fab-label">AI Assistant</span>
    </button>}
    {open && <div className="dms-assist-panel">
      <div className="dms-assist-head">
        <div><Bot /><div><b>S.U.R.Y.A. DMS Assistant</b><small>{ctx.role} · sees metadata only, never document contents</small></div></div>
        <button onClick={() => setOpen(false)}><X /></button>
      </div>
      <div className="dms-assist-body">
        {chat.length === 0 && <>
          <p className="dms-assist-hello"><Sparkles /> Ask about your pending work, verification status, custody, or what needs your action. You can also say <b>“open docs of CR/124/2026”</b> and I will take you straight to that case file.</p>
          <div className="dms-assist-chips">
            {(suggestions[ctx.role] ?? suggestions['System Admin']).map(s =>
              <button key={s} onClick={() => send(s)}>{s}</button>)}
          </div>
        </>}
        {chat.map((m, i) => <div key={i} className={'dms-assist-msg ' + m.role}>
          {m.role === 'ai'
            ? m.text.split('\n').filter(Boolean).map((line, j) => <p key={j}>{line.replace(/^\*\*|\*\*$/g, '').replace(/^[-•] /, '• ')}</p>)
            : <p>{m.text}</p>}
        </div>)}
        {busy && <div className="dms-assist-msg ai"><p className="dms-assist-typing">Analyzing workspace…</p></div>}
        {error && <p className="dms-assist-error">{error}</p>}
      </div>
      <div className="dms-assist-input">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask about your workspace…"
        />
        <button onClick={() => send()} disabled={busy || !q.trim()}><Send /></button>
      </div>
      <small className="dms-assist-disclaim">AI assists, it never decides — not legal advice.</small>
    </div>}
  </>;
}
