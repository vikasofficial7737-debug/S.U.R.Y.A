import { useState } from 'react';
import { Archive, ChevronRight, Clock3, History, Plus, Share2, ShieldAlert, ShieldCheck, Fingerprint, ArrowLeft } from 'lucide-react';
import type { EvidenceItem } from './DMSWorkspace';
import type { DmsSession } from './DmsLogin';

export function EvidenceModule({ goBack, session, evidence, onRegister, onTransfer, openLedger }: {
  goBack: () => void;
  session?: DmsSession | null;
  evidence: EvidenceItem[];
  onRegister: (e: Omit<EvidenceItem, 'id' | 'custody' | 'hash' | 'integrity'>) => Promise<void>;
  onTransfer: (id: string, to: string, reason: string) => Promise<void>;
  openLedger: () => void;
}) {
  const [showReg, setShowReg] = useState(false);
  const [openEv, setOpenEv] = useState<string | null>(null);
  const [showTx, setShowTx] = useState<string | null>(null);
  const [to, setTo] = useState('Forensic Lab');
  const [reason, setReason] = useState('');
  const canTransfer = session?.role === 'Investigating Officer' || session?.role === 'Forensic Officer';
  const pending = evidence.filter(e => e.integrity === 'Pending').length;

  return <>
    <div className="dms-page-head with-button"><div>
      <button className="dms-back" onClick={goBack}><ArrowLeft />Back to Dashboard</button>
      <span>EVIDENCE REGISTRY · CHAIN-OF-CUSTODY ON THE INTEGRITY LEDGER</span>
      <h1>Evidence &amp; Custody</h1>
      <p>Every registration and custody transfer is anchored as a blockchain block — the chain of custody is mathematically verifiable, not just recorded.</p>
    </div><button className="primary" onClick={() => setShowReg(true)}><Plus />Register evidence</button></div>

    <section className="ev-stats">
      <article><Archive /><div><b>{evidence.length}</b><span>Registered exhibits</span></div></article>
      <article><ShieldCheck /><div><b>{evidence.filter(e => e.integrity === 'Verified').length}</b><span>Hash verified</span></div></article>
      <article><Clock3 /><div><b>{evidence.filter(e => e.status === 'Under examination').length}</b><span>Under examination</span></div></article>
      <article><ShieldAlert /><div><b>{pending}</b><span>Integrity pending</span></div></article>
    </section>

    <section className="ev-list">
      {evidence.map(e => <article className="dms-panel ev-card" key={e.id}>
        <div className="ev-top" onClick={() => setOpenEv(openEv === e.id ? null : e.id)}>
          <div className="ev-id"><b>{e.evId}</b><small>{e.type}</small></div>
          <div className="ev-desc"><b>{e.description}</b><small>{e.caseId} · Collected by {e.collectedBy} · {e.collectedAt}</small></div>
          <span className={'doc-status ' + (e.status === 'Under examination' ? 'pending-verification' : 'verified')}>{e.status}</span>
          <ChevronRight />
        </div>
        {openEv === e.id && <div className="ev-body">
          <div className="ev-meta">
            <p><b>Current custodian:</b> {e.custodian}</p>
            <p><b>Storage location:</b> {e.location}</p>
            <p><b>Integrity:</b> <span className={e.integrity === 'Verified' ? 'hash-ok' : 'doc-status pending-verification'}><Fingerprint />{e.integrity} · anchored {e.hash}</span></p>
          </div>
          <div className="ev-custody"><h4><History />Chain of custody</h4>
            {e.custody.map((c, i) => <div className="custody-link" key={c.id}>
              <span className="custody-dot">{i + 1}</span>
              <div><b>{c.from === '—' ? 'Collected' : c.from} → {c.to}</b>
                <small>{c.reason} · {c.at} · <button className="custody-block" onClick={() => openLedger()} title={'View block #' + c.blockIndex + ' in the Integrity Ledger'}>⛓ block #{c.blockIndex}</button></small>
              </div>
            </div>)}
          </div>
          {canTransfer && (showTx === e.id
            ? <div className="ev-transfer">
                <label>Transfer custody to
                  <select value={to} onChange={ev2 => setTo(ev2.target.value)}>
                    {['Forensic Lab', 'Evidence Room, Jaipur Police', 'Registrar A. Kapoor', 'Public Prosecutor', 'FSL Regional Lab'].map(x => <option key={x}>{x}</option>)}
                  </select>
                </label>
                <label>Reason<input value={reason} onChange={ev2 => setReason(ev2.target.value)} placeholder="e.g. Forensic examination / court production" /></label>
                <div className="ev-transfer-actions">
                  <button className="primary" disabled={!reason.trim()} onClick={async () => { await onTransfer(e.id, to, reason); setReason(''); setShowTx(null); }}><Share2 />Record transfer on ledger</button>
                  <button onClick={() => setShowTx(null)}>Cancel</button>
                </div>
              </div>
            : <button className="ev-transfer-btn" onClick={() => setShowTx(e.id)}><Share2 />Transfer custody</button>)}
        </div>}
      </article>)}
    </section>

    {showReg && <div className="modal-scrim" onClick={() => setShowReg(false)}>
      <div className="ev-modal" onClick={e => e.stopPropagation()}>
        <h3><Plus />Register new evidence</h3>
        <RegForm onRegister={async e => { await onRegister(e); setShowReg(false); }} onCancel={() => setShowReg(false)} />
      </div>
    </div>}
  </>;
}

function RegForm({ onRegister, onCancel }: { onRegister: (e: Omit<EvidenceItem, 'id' | 'custody' | 'hash' | 'integrity'>) => Promise<void>; onCancel: () => void }) {
  const [f, setF] = useState({
    evId: 'EV-2026-0' + (315 + Math.floor(Math.random() * 80)),
    caseId: 'CR/124/2026', type: 'Mobile phone', description: '',
    collectedBy: 'SI R. Sharma', collectedAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    location: 'Evidence Room, Jaipur Police', custodian: 'SI R. Sharma',
    status: 'In custody' as EvidenceItem['status'],
  });
  const set = (k: keyof typeof f, v: string) => setF(x => ({ ...x, [k]: v }));
  const valid = f.description.trim().length > 3 && f.evId.trim().length > 4;
  return <div className="reg-form">
    <div className="reg-grid">
      <label>Evidence ID<input value={f.evId} onChange={e => set('evId', e.target.value)} /></label>
      <label>Case ID<select value={f.caseId} onChange={e => set('caseId', e.target.value)}>{['CR/124/2026', 'CV/081/2026', 'CY/042/2026'].map(x => <option key={x}>{x}</option>)}</select></label>
      <label>Type<select value={f.type} onChange={e => set('type', e.target.value)}>{['Mobile phone', 'CCTV hard drive', 'Document set', 'Weapon', 'Narcotic sample', 'Digital storage', 'Other'].map(x => <option key={x}>{x}</option>)}</select></label>
      <label>Collected by<input value={f.collectedBy} onChange={e => set('collectedBy', e.target.value)} /></label>
      <label>Collected at<input value={f.collectedAt} onChange={e => set('collectedAt', e.target.value)} /></label>
      <label>Storage location<input value={f.location} onChange={e => set('location', e.target.value)} /></label>
      <label>Initial custodian<input value={f.custodian} onChange={e => set('custodian', e.target.value)} /></label>
      <label>Status<select value={f.status} onChange={e => set('status', e.target.value as EvidenceItem['status'])}>{['In custody', 'Under examination', 'With court', 'Returned'].map(x => <option key={x}>{x}</option>)}</select></label>
    </div>
    <label>Description<textarea value={f.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="What is the exhibit? identifiers, condition, seals…" /></label>
    <div className="modal-actions">
      <button className="ghost" onClick={onCancel}>Cancel</button>
      <button className="primary" disabled={!valid} onClick={() => onRegister(f)}>Register &amp; anchor to ledger</button>
    </div>
  </div>;
}
