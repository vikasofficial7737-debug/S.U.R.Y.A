import { useState } from 'react';
import { ArrowRight, Bot, ChevronDown, FileText, Film, Image as ImageIcon, Paperclip, Plus, Trash2, Users, X } from 'lucide-react';
import { CaseGraph } from './CaseGraph';
import type { CaseRecord } from '../types/caseRecord';
import type { CaseExtra, CaseFileItem, DetailedTimelineEntry } from '../data/clientRequests';
import { buildStarterExtras, CASE_EXTRAS } from '../data/caseExtras';
import { uid } from '../data/clientRequests';

const FILE_ICON = { image: ImageIcon, video: Film, document: FileText, audio: Paperclip } as const;

function CaseGraphView({ caseData }: { caseData: CaseRecord }) {
  return <CaseGraph key={caseData.id} caseData={{
    id: caseData.id,
    title: caseData.title,
    description: caseData.description,
    nodes: caseData.nodes,
    edges: caseData.edges,
    timeline: caseData.graphTimeline,
  }} />;
}

/** Deep-dive timeline: each stage expands to show what happened. */
function StageTimeline({ stages }: { stages: DetailedTimelineEntry[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(() => {
    const i = stages.findIndex(s => s.active);
    return i >= 0 ? i : null;
  });
  return (
    <div className="cd-stages">
      {stages.map((s, i) => {
        const open = openIdx === i;
        return (
          <div key={s.label + s.date} className={'cd-stage' + (s.done ? ' done' : '') + (s.active ? ' active' : '') + (open ? ' open' : '')}>
            <button className="cd-stage-head" onClick={() => setOpenIdx(open ? null : i)} aria-expanded={open}>
              <span className="cd-stage-dot" />
              <span className="cd-stage-titles">
                <b>{s.label}</b>
                <small>{s.date}</small>
              </span>
              <span className="cd-stage-state">{s.active ? 'Current stage' : s.done ? 'Completed' : 'Upcoming'}</span>
              <ChevronDown className="cd-stage-chev" />
            </button>
            {open && (
              <div className="cd-stage-body">
                {s.summary && <p>{s.summary}</p>}
                {!!s.participants?.length && (
                  <div className="cd-stage-people">
                    <Users width={12} /> {s.participants.join(' · ')}
                  </div>
                )}
                {s.outcome && <p className="cd-stage-outcome"><b>Outcome:</b> {s.outcome}</p>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Case data room: every document, image, video and statement on the record. */
function CaseDataRoom({ items, onRemove }: { items: CaseExtra['caseFile']; onRemove?: (docId: string) => void }) {
  const [filter, setFilter] = useState<'all' | 'document' | 'image' | 'video'>('all');
  const visible = items.filter(i => filter === 'all' || i.kind === filter);
  const kinds = ['all', 'document', 'image', 'video'] as const;
  return (
    <div className="cd-room">
      <div className="cd-room-filters">
        {kinds.map(k => (
          <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>
            {k === 'all' ? 'All items' : k === 'document' ? 'Documents' : k === 'image' ? 'Photos' : 'Videos'} ({k === 'all' ? items.length : items.filter(i => i.kind === k).length})
          </button>
        ))}
      </div>
      <div className="cd-room-grid">
        {visible.length === 0 && <p className="cd-room-empty">Nothing here yet — use “Add document” to build the case file.</p>}
        {visible.map(item => {
          const Icon = FILE_ICON[item.kind] ?? FileText;
          return (
            <article key={item.id} className="cd-room-item">
              <span className={'cd-room-ico ' + item.kind}><Icon /></span>
              <div>
                <b>{item.name}</b>
                <small>{item.source} · added {item.added}</small>
                {item.note && <p>{item.note}</p>}
              </div>
              {onRemove && (
                <button className="cd-room-del" title="Remove from case file" onClick={() => onRemove(item.id)}><Trash2 /></button>
              )}
            </article>
          );
        })}
        {visible.length === 0 && <p className="cd-room-empty">Nothing in this category yet.</p>}
      </div>
    </div>
  );
}

/** Lawyer-added document entry: describe the item (optionally attach a local preview). */
function AddDocumentModal({ onClose, onAdd }: { onClose: () => void; onAdd: (item: CaseFileItem) => void }) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<CaseFileItem['kind']>('document');
  const [source, setSource] = useState('');
  const [note, setNote] = useState('');
  const [dataUrl, setDataUrl] = useState<string | undefined>();

  const pick = (file: File | undefined) => {
    if (!file) return;
    if (!name.trim()) setName(file.name.replace(/\.[^.]+$/, ''));
    if (file.type.startsWith('image/') && file.size < 1_500_000) {
      const reader = new FileReader();
      reader.onload = () => setDataUrl(String(reader.result));
      reader.readAsDataURL(file);
    } else {
      setDataUrl(undefined);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({
      id: uid(),
      name: name.trim(),
      kind,
      source: source.trim() || 'Added by advocate',
      added: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      note: note.trim() || undefined,
    });
  };

  return (
    <div className="modal-veil" onClick={onClose}>
      <form className="modal-card" onClick={e => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-head"><h3><Plus /> Add to case file</h3><button type="button" className="modal-x" onClick={onClose}><X /></button></div>
        <p className="modal-sub">Record a document, photo, video or statement in this case's data room. Attach a file to keep a local preview with the entry.</p>
        <label>Name *<input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Reply letter from IO dated 2 Sep" required /></label>
        <div className="modal-row">
          <label>Type
            <select value={kind} onChange={e => setKind(e.target.value as CaseFileItem['kind'])}>
              <option value="document">Document</option>
              <option value="image">Photo</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
            </select>
          </label>
          <label>Source
            <input value={source} onChange={e => setSource(e.target.value)} placeholder="e.g. Police, client, court registry" />
          </label>
        </div>
        <label>Note (optional)<input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. 65B certificate pending" /></label>
        <label>Attach file (stays in this browser)
          <input type="file" onChange={e => { pick(e.target.files?.[0]); }} />
        </label>
        {dataUrl && kind === 'image' && <img className="cd-add-preview" src={dataUrl} alt="preview" />}
        <div className="modal-actions">
          <button type="button" className="ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary"><Plus /> Add document</button>
        </div>
      </form>
    </div>
  );
}

/** The restructured case detail view. */
export function CaseDossier({
  caseData,
  onBack,
  onAskAI,
  docs,
  onAddDoc,
  onRemoveDoc,
}: {
  caseData: CaseRecord;
  onBack: () => void;
  onAskAI?: (caseId: string) => void;
  docs?: CaseFileItem[];
  onAddDoc?: (caseId: string, item: CaseFileItem) => void;
  onRemoveDoc?: (caseId: string, docId: string) => void;
}) {
  const extra = CASE_EXTRAS[caseData.id] ?? buildStarterExtras(caseData.title, caseData.description, caseData.date, caseData.priority);
  const [tab, setTab] = useState<'overview' | 'timeline' | 'data'>('overview');
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="cd-view">
      <button className="back-btn" onClick={onBack}>← Back to Dashboard</button>

      <div className="cdv-header">
        <div>
          <span className={'cdv-badge priority-' + caseData.priority.toLowerCase()}>{caseData.priority}</span>
          <h2>{caseData.title}</h2>
          <p>{caseData.ipc} · {caseData.court} · {caseData.judge}</p>
        </div>
        <div className="cdv-meta">
          <span>📅 Next hearing: <b>{caseData.date}</b></span>
          <span>📌 Status: <b>{caseData.status}</b></span>
        </div>
      </div>

      <section className="cd-graph-panel">
        <div className="cd-graph-head">
          <h3>Case network</h3>
          <p>Built automatically from the case record — click a node for details, drag to rearrange.</p>
        </div>
        <CaseGraphView caseData={caseData} />
      </section>

      <div className="cd-tabs">
        <button className={tab === 'overview' ? 'on' : ''} onClick={() => setTab('overview')}>Overview</button>
        <button className={tab === 'timeline' ? 'on' : ''} onClick={() => setTab('timeline')}>Detailed timeline</button>
        <button className={tab === 'data' ? 'on' : ''} onClick={() => setTab('data')}>Case file &amp; data</button>
      </div>

      {tab === 'overview' && (
        <div className="cd-overview">
          <section className="panel">
            <h3>Description</h3>
            <p className="cd-desc">{caseData.description}</p>
            <h3 className="cd-sub">Facts of the matter</h3>
            <ul className="cd-facts">
              {extra.facts.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
            <h3 className="cd-sub">Statute notes</h3>
            {extra.statuteNotes.length ? (
              <div className="cd-statutes">
                {extra.statuteNotes.map(s => (
                  <span key={s.section}><b>{s.section}</b><small>{s.note}</small></span>
                ))}
              </div>
            ) : <p className="cd-none">No statute notes yet.</p>}
          </section>

          <div className="cd-side">
            <section className="panel">
              <h3>Victims / affected parties</h3>
              {extra.victims.map(v => (
                <div key={v.name} className="cd-person">
                  <b>{v.name}</b>
                  <p>{v.detail}</p>
                </div>
              ))}
            </section>
            <section className="panel">
              <h3>Witnesses</h3>
              {extra.witnesses.length ? extra.witnesses.map(w => (
                <div key={w.name} className="cd-person">
                  <b>{w.name}</b>
                  <small>{w.role} · {w.status}</small>
                </div>
              )) : <p className="cd-none">No witnesses recorded yet.</p>}
            </section>
            <section className="panel cd-ai-card">
              <Bot />
              <h3>Ask about this case</h3>
              <p>Hearing briefs, precedent pointers, or a summary of the evidence on record.</p>
              <button className="ask" onClick={() => onAskAI?.(caseData.id)}><FileText />Ask S.U.R.Y.A.<ArrowRight /></button>
            </section>
          </div>
        </div>
      )}

      {tab === 'timeline' && (
        <section className="panel">
          <h3>Every stage, from FIR to next hearing</h3>
          <p className="cd-stage-sub">Click a stage to read what happened, who was involved, and the outcome.</p>
          <StageTimeline stages={extra.detailedTimeline} />
        </section>
      )}

      {tab === 'data' && (
        <section className="panel">
          <div className="cd-room-head">
            <div>
              <h3>Case file &amp; data</h3>
              <p className="cd-stage-sub">Everything on the record for this case: documents, photographs, footage and statements.</p>
            </div>
            {onAddDoc && <button className="primary" onClick={() => setShowAdd(true)}><Plus /> Add document</button>}
          </div>
          <CaseDataRoom items={docs ?? extra.caseFile} onRemove={onRemoveDoc ? (docId) => onRemoveDoc(caseData.id, docId) : undefined} />
          <h3 className="cd-sub">Registered evidence list</h3>
          <ul className="cd-evidence-list">
            {caseData.evidence.map((e, i) => <li key={i}><FileText width={13} />{e}</li>)}
          </ul>
        </section>
      )}

      {showAdd && onAddDoc && (
        <AddDocumentModal
          onClose={() => setShowAdd(false)}
          onAdd={(item) => { onAddDoc(caseData.id, item); setShowAdd(false); }}
        />
      )}
    </div>
  );
}
