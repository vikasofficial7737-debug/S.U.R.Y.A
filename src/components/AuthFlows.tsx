import { useState } from 'react';
import {
  ArrowRight, ArrowLeft, BadgeCheck, Briefcase, GraduationCap, Scale,
  ShieldCheck, UserRound, X, Landmark, Loader2,
} from 'lucide-react';
import {
  dmsResolveOfficer, verifyAdvocate,
} from '../lib/auth';
import type { DmsSessionV2, SuiteSession } from '../lib/session';
import { prettyPhone, type DigiIdentity, type SuiteRole } from '../data/identityBindings';
import './authflows.css';

/* ============================================================================
   AuthFlows — the second/third steps after DigiLocker verification.
   1. DmsUniqueIdStep  : officer types their Unique ID; role comes from the DB.
   2. SuiteRoleCards   : popup with Citizen / Lawyer / Student cards.
   3. LawyerBarIdStep  : Bar enrollment verification (lawyer's second layer).
   ========================================================================== */

/* ---------------------------------------------------------------- DMS step */

export function DmsUniqueIdStep({ identity, onBack, onDone }:
{ identity: DigiIdentity; onBack: () => void; onDone: (s: DmsSessionV2) => void }) {
  const [uniqueId, setUniqueId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setBusy(true); setError('');
    const r = await dmsResolveOfficer(identity.phone, uniqueId);
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    onDone({
      kind: 'dms',
      phone: identity.phone,
      digilockerRef: identity.digilockerRef,
      officerId: r.officer.uniqueId,
      role: r.officer.role,
      fullName: r.officer.fullName,
      department: r.officer.department,
      unit: r.officer.unit ?? null,
      policeStation: r.officer.policeStation ?? null,
      jurisdiction: r.officer.jurisdiction,
      clearance: r.officer.clearance,
      rank: r.officer.rank ?? null,
    });
  };

  return (
    <div className="af-wrap">
      <div className="af-card">
        <button className="af-back" onClick={onBack}><ArrowLeft size={14} /> Back to DigiLocker</button>
        <div className="af-head">
          <Landmark />
          <div>
            <h2>Officer Identification</h2>
            <p>DigiLocker verified: <b>{identity.fullName}</b> · +91 {prettyPhone(identity.phone)}</p>
          </div>
        </div>

        <label>Officer / Employee Unique ID
          <div className="af-id-row">
            <input
              autoFocus value={uniqueId}
              onChange={e => { setUniqueId(e.target.value.toUpperCase()); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && uniqueId.trim() && !busy && submit()}
              placeholder="e.g. IO-2026-0142"
            />
            <button className="af-enter" disabled={!uniqueId.trim() || busy} onClick={submit}>
              {busy ? <Loader2 size={15} className="af-spin" /> : <>Enter <ArrowRight size={14} /></>}
            </button>
          </div>
        </label>

        {error && <p className="af-error">{error}</p>}

        <p className="af-note">
          <ShieldCheck size={13} />
          Your role and department are derived from government records linked to
          this Unique ID — they cannot be self-selected.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------- Suite role cards */

const CARDS: { role: SuiteRole; name: string; icon: typeof Scale; color: string; promise: string }[] = [
  { role: 'citizen', name: 'Citizen', icon: UserRound, color: 'orange', promise: 'Clear legal guidance, when you need it.' },
  { role: 'lawyer', name: 'Lawyer', icon: Briefcase, color: 'blue', promise: 'Organize cases. Work with clarity.' },
  { role: 'student', name: 'Student', icon: GraduationCap, color: 'green', promise: 'Understand landmark cases, simply.' },
];

export function SuiteRoleCards({ onPick, onClose }:
{ onPick: (r: SuiteRole) => void; onClose: () => void }) {
  return (
    <div className="af-veil" onClick={onClose}>
      <div className="af-popup" onClick={e => e.stopPropagation()}>
        <div className="af-popup-head">
          <div>
            <h3>S.U.R.Y.A. for Judicial Assistance</h3>
            <p>Choose how you want to continue. Authentication follows on the next step.</p>
          </div>
          <button className="af-x" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="af-cards">
          {CARDS.map(c => {
            const Icon = c.icon;
            return (
              <button key={c.role} className={'af-card-btn ' + c.color} onClick={() => onPick(c.role)}>
                <div className="af-card-icon"><Icon /><span>⚖</span></div>
                <h4>I am a {c.name}</h4>
                <p>{c.promise}</p>
                <span className="af-card-go">Continue <ArrowRight size={13} /></span>
              </button>
            );
          })}
        </div>
        <p className="af-popup-note"><BadgeCheck size={13} /> Verified via DigiLocker · No data is shared without your consent</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------- Lawyer Bar layer */

export function LawyerBarIdStep({ identity, onBack, onDone }:
{ identity: DigiIdentity; onBack: () => void; onDone: (s: SuiteSession) => void }) {
  const [barId, setBarId] = useState('');
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<'input' | 'verifying'>('input');
  const [error, setError] = useState('');

  const submit = async () => {
    setBusy(true); setError('');
    setPhase('verifying'); // theatre: show the council check
    const r = await verifyAdvocate(identity.phone, barId);
    // Small pause so the "Bar Council verification" step is visible
    await new Promise(res => setTimeout(res, 900));
    setBusy(false);
    if (!r.ok) { setPhase('input'); setError(r.error); return; }
    onDone({
      kind: 'suite',
      phone: identity.phone,
      digilockerRef: identity.digilockerRef,
      suiteRole: 'lawyer',
      fullName: r.advocate.fullName,
      barEnrollmentId: r.advocate.barEnrollmentId,
      stateBarCouncil: r.advocate.stateBarCouncil,
    });
  };

  return (
    <div className="af-wrap">
      <div className="af-card">
        <button className="af-back" onClick={onBack}><ArrowLeft size={14} /> Back</button>
        <div className="af-head">
          <Scale />
          <div>
            <h2>Advocate Verification</h2>
            <p>DigiLocker verified: <b>{identity.fullName}</b> · +91 {prettyPhone(identity.phone)}</p>
          </div>
        </div>

        {phase === 'input' ? (
          <>
            <label>Bar Council Enrollment ID
              <div className="af-id-row">
                <input
                  autoFocus value={barId}
                  onChange={e => { setBarId(e.target.value.toUpperCase()); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && barId.trim() && !busy && submit()}
                  placeholder="e.g. RAJ/1823/2019"
                />
                <button className="af-enter" disabled={!barId.trim() || busy} onClick={submit}>
                  Verify <ArrowRight size={14} />
                </button>
              </div>
            </label>
            <p className="af-hint">Format: <b>STATE/NUMBER/YEAR</b> — issued by your State Bar Council at enrollment.</p>
            {error && <p className="af-error">{error}</p>}
            <p className="af-note">
              <ShieldCheck size={13} />
              We confirm this enrollment number is registered to <b>your</b> DigiLocker
              identity and holds a valid Certificate of Practice.
            </p>
          </>
        ) : (
          <div className="af-verifying">
            <Loader2 size={22} className="af-spin" />
            <b>Verifying with the State Bar Council…</b>
            <span>Checking enrollment status and Certificate of Practice</span>
          </div>
        )}
      </div>
    </div>
  );
}
