import { useRef, useState } from 'react';
import { AlertTriangle, CalendarDays, Check, FileText, Lightbulb, Sparkles, Users } from 'lucide-react';
import { analyzeDocument, type DocumentAnalysis } from '../lib/gemini';
import { humanSize, kindForFile } from '../data/clientRequests';
import type { CaseRecord } from '../types/caseRecord';

/** Document analyzer for the lawyer workspace. */
export function DocumentAnalyzerView({
  cases,
  flash,
}: {
  cases: CaseRecord[];
  flash: (s: string) => void;
}) {
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [inline, setInline] = useState<{ mimeType: string; data: string } | undefined>();
  const [pendingFile, setPendingFile] = useState<{ name: string; size: number; kind: string } | undefined>();
  const [caseId, setCaseId] = useState('');
  const [focus, setFocus] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<DocumentAnalysis | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const reset = () => {
    setText(''); setFileName(''); setInline(undefined); setPendingFile(undefined);
    setResult(null); setError('');
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    const kind = kindForFile(file.name, file.type);
    setPendingFile({ name: file.name, size: file.size, kind });
    setFileName(file.name);
    setInline(undefined);
    setText('');

    const INLINE_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
    if (INLINE_TYPES.includes(file.type) && file.size <= 15_000_000) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result);
        setInline({ mimeType: file.type, data: dataUrl.split(',')[1] ?? '' });
        setPendingFile(undefined);
      };
      reader.onerror = () => setError('Could not read the file. Try pasting the text instead.');
      reader.readAsDataURL(file);
      return;
    }
    if (kind === 'document' && /\.txt$/i.test(file.name)) {
      const reader = new FileReader();
      reader.onload = () => { setText(String(reader.result)); setPendingFile(undefined); };
      reader.onerror = () => setError('Could not read the file. Try pasting the text instead.');
      reader.readAsText(file);
      return;
    }
    setError('This file type is best pasted as text. Images, PDFs and .txt files can be analyzed directly.');
  };

  const run = async () => {
    if (busy) return;
    if (!text.trim() && !inline) { setError('Add a document first — pick a file or paste the text.'); return; }
    setBusy(true); setError('');
    try {
      const activeCase = cases.find(c => c.id === caseId);
      const caseContext = activeCase
        ? `${activeCase.title} (${activeCase.ipc}, ${activeCase.court}). Facts: ${activeCase.description}`
        : focus.trim() || undefined;
      const out = await analyzeDocument({
        fileName: fileName || 'pasted-text',
        text: text.trim() || undefined,
        inline,
        caseContext,
      });
      setResult(out);
      flash('Document analyzed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const activeCase = cases.find(c => c.id === caseId);
  const canRun = !busy && (!!text.trim() || !!inline);

  return (
    <>
      <div className="heading">
        <div>
          <em>DOCUMENT INTELLIGENCE</em>
          <h1>Document analyzer</h1>
          <p>Upload a document — PDF, photo of a notice, agreement — or paste its text. The analyzer reads it from the perspective of your case: main points, parties, dates, risks, and what to ask next.</p>
        </div>
      </div>

      <div className="da-grid">
        <section className="panel da-form">
          <h3><FileText /> The document</h3>

          <div
            className={'da-drop' + (pendingFile ? ' busy' : '')}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
            onClick={() => fileRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
          >
            <FileText />
            {pendingFile
              ? <span>Reading {pendingFile.name} ({humanSize(pendingFile.size)})…</span>
              : fileName
                ? <span><b>{fileName}</b> — ready. Click to replace.</span>
                : <span>Click to choose a file or drop it here<br /><small>PDF, photo (JPG/PNG) or .txt up to 15 MB</small></span>}
          </div>
          <input ref={fileRef} type="file" hidden accept=".pdf,.png,.jpg,.jpeg,.webp,.txt" onChange={e => { handleFile(e.target.files?.[0]); e.target.value = ''; }} />

          <label>…or paste the document text<textarea
            value={text}
            onChange={e => { setText(e.target.value); if (e.target.value) { setFileName(''); setInline(undefined); setPendingFile(undefined); } }}
            rows={7}
            placeholder="Paste agreements, notices, FIR copies, statements…"
          /></label>

          <label>Focus case (optional)
            <select value={caseId} onChange={e => setCaseId(e.target.value)}>
              <option value="">General review — no specific case</option>
              {cases.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </label>
          {activeCase && <p className="da-case-note">The analysis will relate findings to <b>{activeCase.title}</b> — {activeCase.ipc}.</p>}

          {!caseId && (
            <label>Or describe what matters<textarea
              value={focus}
              onChange={e => setFocus(e.target.value)}
              rows={2}
              placeholder="e.g. Limitation risk, alibi verification, possession timeline…"
            /></label>
          )}

          <div className="da-actions">
            <button className="primary" disabled={!canRun} onClick={run}><Sparkles /> {busy ? 'Analyzing…' : 'Analyze document'}</button>
            <button className="da-clear" onClick={reset} disabled={busy}>Clear</button>
          </div>
          {error && <p className="ai-error">{error}</p>}
          <p className="da-disclaimer"><AlertTriangle width={12} /> AI assistance for review — verify every point against the original document before relying on it.</p>
        </section>

        <section className="da-result">
          {!result && !busy && (
            <div className="da-empty">
              <FileText />
              <b>No analysis yet</b>
              <p>The structured summary appears here: document type, key points from the case perspective, parties, important dates, risks to verify, and questions to ask.</p>
            </div>
          )}
          {busy && (
            <div className="da-empty da-busy">
              <Sparkles className="da-spin" />
              <b>Reading the document…</b>
              <p>Extracting parties, dates, obligations and risk points.</p>
            </div>
          )}
          {result && (
            <div className="da-report">
              <header>
                <span>ANALYSIS READY</span>
                <h2>{result.title}</h2>
                <small>{result.docType}</small>
              </header>
              <p className="da-summary">{result.summary}</p>

              <div className="da-block">
                <h4><Check /> Main points</h4>
                <ul>{result.keyPoints.map((k, i) => <li key={i}>{k}</li>)}</ul>
              </div>

              <div className="da-two">
                <div className="da-block">
                  <h4><Users /> Parties</h4>
                  {result.parties.length ? <ul className="da-plain">{result.parties.map((p, i) => <li key={i}>{p}</li>)}</ul> : <p className="da-miss">None identified in the text.</p>}
                </div>
                <div className="da-block">
                  <h4><CalendarDays /> Dates that matter</h4>
                  {result.dates.length ? (
                    <ul className="da-dates">
                      {result.dates.map((d, i) => <li key={i}><b>{d.date}</b><span>{d.significance}</span></li>)}
                    </ul>
                  ) : <p className="da-miss">No dates found.</p>}
                </div>
              </div>

              <div className="da-block da-risks">
                <h4><AlertTriangle /> Risks &amp; verify</h4>
                {result.risks.length ? <ul>{result.risks.map((r, i) => <li key={i}>{r}</li>)}</ul> : <p className="da-miss">No obvious risk clauses detected — still verify signatures and annexures.</p>}
              </div>

              <div className="da-block da-ask">
                <h4><Lightbulb /> Ask the client</h4>
                {result.questions.length ? <ul>{result.questions.map((q, i) => <li key={i}>{q}</li>)}</ul> : <p className="da-miss">Nothing outstanding.</p>}
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
