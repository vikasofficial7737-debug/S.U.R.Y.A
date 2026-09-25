import { useState } from 'react';
import { FileText, GitCompare, X, Check } from 'lucide-react';

export type VersionEntry = {
  version: number;
  at: string;
  by: string;
  reason: string;
  fields: Record<string, string>;
};

/** Demo field-level history. In production this comes from DocumentVersion rows. */
const SEED_VERSIONS: Record<string, VersionEntry[]> = {
  'FIR_124_2026.pdf': [
    { version: 3, at: '19 Sep 2026 · 10:18', by: 'SI R. Sharma', reason: 'Corrected place of occurrence per supplementary statement.', fields: { 'Place of occurrence': 'Johari Bazar, Jaipur', 'Sections invoked': '302, 34 IPC', 'Witness names': 'Rajesh Meena', 'Investigating Officer': 'SI R. Sharma' } },
    { version: 2, at: '18 Sep 2026 · 17:44', by: 'Inspector A. Verma', reason: 'OCR correction: witness name spelling fixed after review.', fields: { 'Place of occurrence': 'Johari Bazaar, Jaipur', 'Sections invoked': '302 IPC', 'Witness names': 'Rajesh Meena', 'Investigating Officer': 'SI R. Sharma' } },
    { version: 1, at: '12 Jan 2026 · 11:05', by: 'SI R. Sharma', reason: 'Original upload (digitized from physical FIR).', fields: { 'Place of occurrence': 'Johari Bazaar', 'Sections invoked': '302 IPC', 'Witness names': 'R. Meena', 'Investigating Officer': 'SI R. Sharma' } },
  ],
};

export function VersionHistoryPanel({ docName, currentVersion, onCreateVersion, canEdit }: {
  docName: string;
  currentVersion: number;
  onCreateVersion?: (reason: string) => Promise<void>;
  canEdit?: boolean;
}) {
  const seed = SEED_VERSIONS[docName];
  const [versions, setVersions] = useState<VersionEntry[]>(seed ?? []);
  const [comparing, setComparing] = useState<[number, number] | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  // For docs without seed history, synthesize the v1 entry from what we know.
  const list: VersionEntry[] = versions.length ? versions : (seed ? seed : [{
    version: 1, at: '—', by: '—', reason: 'Original upload.',
    fields: { 'Record status': 'Registered', Integrity: 'Ledger-anchored' },
  }]);
  const display = list.map(v => v.version === list[0].version ? { ...v, version: currentVersion } : v);

  const fieldNames = Array.from(new Set(display.flatMap(v => Object.keys(v.fields))));

  const create = async () => {
    if (!onCreateVersion || !reason.trim()) return;
    setBusy(true);
    await onCreateVersion(reason.trim());
    const next: VersionEntry = {
      version: display[0].version + 1,
      at: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
      by: 'You (this session)',
      reason: reason.trim(),
      fields: { ...display[0].fields },
    };
    setVersions([next, ...list]);
    setReason(''); setShowNew(false); setBusy(false);
  };

  return <section className="dms-panel version-panel">
    <div className="version-head">
      <h3><FileText />Version history <small>{docName}</small></h3>
      {canEdit && onCreateVersion && <button onClick={() => setShowNew(!showNew)}><GitCompare />New version</button>}
    </div>

    {showNew && <div className="version-new">
      <label>Reason for change (mandatory — becomes a permanent, ledger-anchored record)
        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} placeholder="e.g. Corrected occurrence location based on supplementary statement." />
      </label>
      <div className="version-new-actions">
        <button disabled={!reason.trim() || busy} onClick={create}><Check />Create version</button>
        <button onClick={() => setShowNew(false)}>Cancel</button>
      </div>
    </div>}

    <div className="vlist">
      {display.map((v, i) => <div className={'vrow' + (i === 0 ? ' current' : '')} key={v.version}>
        <span className="vbadge">V{v.version}</span>
        <div className="vmeta"><b>{v.reason}</b><small>{v.by} · {v.at}</small></div>
        {i > 0 && <button className="vcompare" onClick={() => setComparing([display[0].version, v.version])}><GitCompare />Compare with V{display[0].version}</button>}
        {i === 0 && <span className="vcurrent-tag">current</span>}
      </div>)}
    </div>

    {comparing && <DiffModal
      versions={display}
      pair={comparing}
      fields={fieldNames}
      onClose={() => setComparing(null)} />}
  </section>;
}

function DiffModal({ versions, pair, fields, onClose }: {
  versions: VersionEntry[]; pair: [number, number]; fields: string[]; onClose: () => void;
}) {
  const a = versions.find(v => v.version === pair[1])!;
  const b = versions.find(v => v.version === pair[0])!;
  return <div className="modal-scrim" onClick={onClose}>
    <div className="diff-modal" onClick={e => e.stopPropagation()}>
      <div className="diff-head">
        <h3><GitCompare />Version comparison</h3>
        <button onClick={onClose}><X /></button>
      </div>
      <p className="diff-sub">Changed fields are highlighted. V{a.version} ("{a.reason}") → V{b.version} ("{b.reason}")</p>
      <div className="diff-grid">
        <div className="diff-col"><h5>V{a.version} · {a.at}</h5>
          {fields.map(f => <div className="diff-field" key={f}><small>{f}</small><p>{a.fields[f] ?? '—'}</p></div>)}
        </div>
        <div className="diff-col"><h5>V{b.version} · {b.at}</h5>
          {fields.map(f => {
            const changed = (a.fields[f] ?? '—') !== (b.fields[f] ?? '—');
            return <div className={'diff-field' + (changed ? ' changed' : '')} key={f}>
              <small>{f} {changed && <span className="diff-flag">changed</span>}</small><p>{b.fields[f] ?? '—'}</p>
            </div>;
          })}
        </div>
      </div>
      <p className="diff-note">Every version creation event is anchored to the integrity ledger — version history is tamper-evident.</p>
    </div>
  </div>;
}
