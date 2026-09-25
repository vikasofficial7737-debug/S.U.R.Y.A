import { Activity, ArrowRight, BadgeCheck, BrainCircuit, Briefcase, CalendarClock, CheckCircle2, ClipboardList, Download, FileText, Fingerprint, FlaskConical, FolderClosed, Gavel, History, KeyRound, Landmark, LockKeyhole, PenLine, Scale, Search, Share2, ShieldAlert, ShieldCheck, Upload, UserCheck, Users } from 'lucide-react';
import type { DmsDocument, Audit, DmsPage, DmsRole } from './DMSWorkspace';
import { getBridgeAccessEvents } from '../data/bridgeAudit';

/* ---------- shared bits ---------- */
type DashProps = { docs: DmsDocument[]; audit: Audit[]; setPage: (p: DmsPage) => void; role: DmsRole; sessionName?: string };

const Kpis = ({ items }: { items: { icon: any; n: any; label: string; tone?: string }[] }) =>
  <section className="dms-kpis">{items.map((k, i) => <Kpi key={i} {...k} />)}</section>;

function Kpi({ icon: Icon, n, label, tone = 'blue' }: { icon: any; n: any; label: string; tone?: string }) {
  return <article className={'dms-kpi ' + tone}><Icon /><div><b>{n}</b><span>{label}</span></div></article>;
}

const PanelHead = ({ icon: Icon, title, sub, action }: { icon?: any; title: string; sub?: string; action?: { label: string; go: () => void } }) =>
  <div className="dms-title"><div><h3>{Icon && <Icon />}{title}</h3>{sub && <p>{sub}</p>}</div>
    {action && <button onClick={action.go}>{action.label}<ArrowRight /></button>}</div>;

const StatusPill = ({ s }: { s: string }) => <span className={'doc-status ' + s.replaceAll(' ', '-').toLowerCase()}>{s}</span>;

const Rows = ({ items }: { items: { id: string; main: React.ReactNode; sub: string; right?: React.ReactNode }[] }) =>
  <div>{items.length === 0 ? <p className="dash-empty">Nothing here right now — all clear.</p> :
    items.map(x => <div className="dash-row" key={x.id}><div><b>{x.main}</b><small>{x.sub}</small></div>{x.right}</div>)}</div>;

/* ---------- 1. Super Admin ---------- */
function SuperAdminDash({ docs, audit, setPage }: DashProps) {
  const failedLogins = audit.filter(a => a.action.toLowerCase().includes('failed')).length;
  const bridgeRows = getBridgeAccessEvents().slice(0, 2);
  const securityEvents = [
    { id: 's1', main: <>Suspicious login pattern detected</>, sub: '3 failed attempts · IP 10.42.x.x · auto-locked', right: <ShieldAlert /> },
    { id: 's2', main: <>MFA enforced for all new sessions</>, sub: 'Policy updated · Platform Administration', right: <KeyRound /> },
    { id: 's3', main: <>Rate limiter triggered on /api/search</>, sub: 'Burst blocked · no data exposure', right: <ShieldCheck /> },
  ];
  return <>
    <section className="dms-welcome"><div>
      <span><Landmark /> SUPER ADMINISTRATOR · PLATFORM-WIDE OVERSIGHT</span>
      <h1>System control center</h1>
      <p>Organizations, users, permissions, and security across the entire platform.</p>
      <button onClick={() => setPage('admin')}><Users />User &amp; department management</button>
    </div><div className="vault-illustration"><LockKeyhole /><UserCheck /><ShieldCheck /></div></section>
    <Kpis items={[
      { icon: Users, n: '5', label: 'Active users (5 departments)' },
      { icon: FolderClosed, n: '3', label: 'Active cases' },
      { icon: FileText, n: docs.length, label: 'Total documents' },
      { icon: ClipboardList, n: docs.filter(d => d.status === 'Pending verification').length, label: 'Pending approvals', tone: 'amber' },
      { icon: ShieldAlert, n: docs.filter(d => d.status === 'Flagged').length, label: 'Integrity flags', tone: 'red' },
    ]} />
    <section className="dms-grid">
      <article className="dms-panel">
        <PanelHead icon={Activity} title="System activity timeline" sub="Append-only across all departments" action={{ label: 'Full audit', go: () => setPage('audit') }} />
        <Rows items={[...audit.slice(0, 5).map(a => ({ id: a.id, main: <>{a.action}</>, sub: `${a.actor} · ${a.department}`, right: <small>{a.at}</small> })), ...bridgeRows.map((e, i) => ({ id: 'b' + i, main: <span>S.U.R.Y.A. cross-system read</span>, sub: `${e.lawyer} · ${e.document}`, right: <small>{e.at}</small> }))]} />
      </article>
      <article className="dms-panel">
        <PanelHead icon={ShieldAlert} title="Security center" sub={`${failedLogins} failed logins this session · all events retained`} />
        <Rows items={securityEvents} />
        <div className="dash-mini-actions"><button onClick={() => setPage('access')}><KeyRound />Permission matrix</button><button onClick={() => setPage('integrity')}><Fingerprint />Integrity center</button></div>
      </article>
    </section>
  </>;
}

/* ---------- 2. Investigating Officer ---------- */
function IODash({ docs, audit, setPage }: DashProps) {
  const mine = audit.filter(a => a.department === 'Jaipur Police');
  const tasks = [
    { id: 't1', main: <>Verify digitized FIR fields — FIR_124_2026.pdf</>, sub: 'OCR complete · field verification pending', right: <StatusPill s="Pending verification" /> },
    { id: 't2', main: <>Sign charge sheet draft v4</>, sub: 'Digital signature required before submission', right: <PenLine /> },
    { id: 't3', main: <>Witness statement RM — review before next hearing</>, sub: 'Cross-examination 20 Sep 2026', right: <CalendarClock /> },
  ];
  return <>
    <section className="dms-welcome"><div>
      <span><Briefcase /> INVESTIGATING OFFICER · CASE WORKSPACE</span>
      <h1>Your cases, documents and evidence — one desk.</h1>
      <p>Upload FIRs, register evidence, and keep every investigation record verifiable.</p>
      <button onClick={() => setPage('upload')}><Upload />Upload &amp; digitize a document</button>
    </div><div className="vault-illustration"><FileText /><Fingerprint /><ShieldCheck /></div></section>
    <Kpis items={[
      { icon: FolderClosed, n: '1', label: 'My active cases' },
      { icon: ClipboardList, n: tasks.length, label: 'Pending tasks', tone: 'amber' },
      { icon: Upload, n: docs.filter(d => d.department === 'Jaipur Police').length, label: 'My uploads' },
      { icon: Fingerprint, n: docs.filter(d => d.status === 'Verified').length, label: 'Verified documents', tone: 'green' },
    ]} />
    <section className="dms-grid">
      <article className="dms-panel">
        <PanelHead icon={ClipboardList} title="Pending tasks" sub="Deadlines and actions waiting on you" action={{ label: 'Repository', go: () => setPage('repository') }} />
        <Rows items={tasks} />
      </article>
      <article className="dms-panel">
        <PanelHead icon={History} title="Recent case activity" sub={mine.length ? 'Your department · Jaipur Police' : 'Case-linked activity · most recent first'} action={{ label: 'Audit', go: () => setPage('audit') }} />
        <Rows items={(mine.length ? mine : audit).slice(0, 4).map(a => ({ id: a.id, main: <>{a.action}</>, sub: `${a.target} · ${a.actor}`, right: <small>{a.at}</small> }))} />
      </article>
    </section>
  </>;
}

/* ---------- 3. Forensic Officer ---------- */
function ForensicDash({ docs, setPage }: DashProps) {
  const evidence = [
    { id: 'e1', main: <>Mobile phone (exhibit EV-2026-00312)</>, sub: 'Custody: Forensic Lab · hash verified · examination in progress', right: <StatusPill s="Verified" /> },
    { id: 'e2', main: <>CCTV hard drive (exhibit EV-2026-00313)</>, sub: 'Awaiting hash verification on receipt', right: <StatusPill s="Pending verification" /> },
  ];
  const reports = docs.filter(d => d.type === 'Forensic report' || d.type === 'Electronic evidence');
  return <>
    <section className="dms-welcome"><div>
      <span><FlaskConical /> FORENSIC OFFICER · EVIDENCE &amp; EXAMINATION</span>
      <h1>Evidence integrity first.</h1>
      <p>Verify hashes on receipt, record examinations, sign your reports — every transfer is on the custody chain.</p>
      <button onClick={() => setPage('integrity')}><Fingerprint />Verify evidence integrity</button>
    </div><div className="vault-illustration"><FlaskConical /><Fingerprint /><BadgeCheck /></div></section>
    <Kpis items={[
      { icon: FlaskConical, n: evidence.length, label: 'Assigned evidence' },
      { icon: ClipboardList, n: '1', label: 'Pending examinations', tone: 'amber' },
      { icon: FileText, n: reports.length, label: 'My lab reports on record' },
      { icon: PenLine, n: reports.filter(d => d.signed).length, label: 'Signed reports', tone: 'green' },
    ]} />
    <section className="dms-grid">
      <article className="dms-panel">
        <PanelHead icon={Fingerprint} title="Evidence in my custody" sub="Chain of custody · transfer events logged" action={{ label: 'Integrity center', go: () => setPage('integrity') }} />
        <Rows items={evidence} />
      </article>
      <article className="dms-panel">
        <PanelHead icon={FileText} title="Reports & examinations" sub="Upload, sign, and hash your findings" action={{ label: 'Upload', go: () => setPage('upload') }} />
        <Rows items={reports.map(d => ({ id: d.id, main: <>{d.name}</>, sub: `${d.caseId} · v${d.version} · ${d.signed ? 'Digitally signed' : 'Signature pending'}`, right: <StatusPill s={d.status} /> }))} />
      </article>
    </section>
  </>;
}

/* ---------- 4. Court / Registrar ---------- */
function CourtDash({ docs, setPage }: DashProps) {
  const filings = docs.filter(d => d.type === 'Court filing' || d.type === 'Legal notice' || d.type === 'FIR');
  return <>
    <section className="dms-welcome"><div>
      <span><Scale /> COURT / REGISTRAR · CONTROLLED REVIEW ACCESS</span>
      <h1>Review, verify, never alter.</h1>
      <p>Read-only access to authorized records. Verify hashes, signatures and version chains before acceptance.</p>
      <button onClick={() => setPage('integrity')}><BadgeCheck />Verification report</button>
    </div><div className="vault-illustration"><Gavel /><ShieldCheck /><FileText /></div></section>
    <Kpis items={[
      { icon: FileText, n: filings.length, label: 'Authorized records visible' },
      { icon: BadgeCheck, n: filings.filter(d => d.signed).length, label: 'Signatures valid', tone: 'green' },
      { icon: Fingerprint, n: filings.filter(d => d.status === 'Verified').length, label: 'Hash verified' },
      { icon: ShieldAlert, n: filings.filter(d => d.status !== 'Verified').length, label: 'Awaiting verification', tone: 'amber' },
    ]} />
    <section className="dms-grid">
      <article className="dms-panel">
        <PanelHead icon={Gavel} title="Case files under review" sub="Read-only · every view is audited" action={{ label: 'Repository', go: () => setPage('repository') }} />
        <Rows items={filings.map(d => ({ id: d.id, main: <>{d.name}</>, sub: `${d.caseId} · v${d.version} · ${d.department}`, right: <StatusPill s={d.status} /> }))} />
      </article>
      <article className="dms-panel">
        <PanelHead icon={ShieldCheck} title="Verification checklist" sub="What the court verifies before acceptance" />
        <Rows items={[
          { id: 'v1', main: <>SHA-256 hash matches ledger</>, sub: 'All visible versions chained correctly', right: <CheckCircle2 /> },
          { id: 'v2', main: <>Digital signatures valid</>, sub: 'Signer identity and timestamp confirmed', right: <CheckCircle2 /> },
          { id: 'v3', main: <>Chain of custody complete</>, sub: 'No unexplained custody gaps on record', right: <CheckCircle2 /> },
          { id: 'v4', main: <>Edit access</>, sub: 'Court users cannot modify originals — by design', right: <LockKeyhole /> },
        ]} />
      </article>
    </section>
  </>;
}

/* ---------- 5. Legal Officer / Prosecutor ---------- */
function LegalDash({ docs, setPage }: DashProps) {
  const reviews = docs.filter(d => ['Court filing', 'Legal notice', 'Forensic report'].includes(d.type));
  return <>
    <section className="dms-welcome"><div>
      <span><Scale /> LEGAL OFFICER / PROSECUTOR · LEGAL REVIEW</span>
      <h1>From investigation to court submission.</h1>
      <p>Review records, draft charge sheets, request missing documents, and prepare the case bundle.</p>
      <button onClick={() => setPage('search')}><Search />Search case documents</button>
    </div><div className="vault-illustration"><Scale /><FileText /><PenLine /></div></section>
    <Kpis items={[
      { icon: Briefcase, n: '1', label: 'Cases assigned' },
      { icon: ClipboardList, n: reviews.filter(d => d.status !== 'Verified').length, label: 'Documents to review', tone: 'amber' },
      { icon: FileText, n: reviews.length, label: 'Records reviewed / in review' },
      { icon: BrainCircuit, n: '1', label: 'AI case briefs ready', tone: 'green' },
    ]} />
    <section className="dms-grid">
      <article className="dms-panel">
        <PanelHead icon={ClipboardList} title="Documents awaiting legal action" sub="Approve, sign, or request missing items" action={{ label: 'Repository', go: () => setPage('repository') }} />
        <Rows items={reviews.map(d => ({ id: d.id, main: <>{d.name}</>, sub: `${d.type} · ${d.caseId} · ${d.department}`, right: <StatusPill s={d.status} /> }))} />
      </article>
      <article className="dms-panel ai-brief">
        <PanelHead icon={BrainCircuit} title="AI-assisted case brief" sub="Non-authoritative · retrieval & summarization only" />
        <div className="brief-body">
          <p><b>Case:</b> CR/124/2026 — State vs R. Singh</p>
          <p><b>FIR:</b> Available &amp; verified · <b>Witness statements:</b> 1 pending verification</p>
          <p><b>Forensic reports:</b> 2 signed · <b>Evidence items:</b> 4 registered</p>
          <p><b>Missing:</b> 65B certificate for CCTV clip — flagged for next hearing</p>
        </div>
        <small className="ai-disclaim">AI assists with retrieval and summary — it never makes the legal decision.</small>
      </article>
    </section>
  </>;
}

/* ---------- 6. Records / Compliance Officer ---------- */
function ComplianceDash({ docs, audit, setPage }: DashProps) {
  const holds = docs.filter(d => d.legalHold).length;
  const bridge = getBridgeAccessEvents().length;
  return <>
    <section className="dms-welcome"><div>
      <span><ClipboardList /> RECORDS / COMPLIANCE OFFICER · AUDIT &amp; RETENTION</span>
      <h1>Nothing moves without a record.</h1>
      <p>Retention schedules, legal holds, integrity events, and full auditability across departments.</p>
      <button onClick={() => setPage('audit')}><Download />Export audit report</button>
    </div><div className="vault-illustration"><History /><Fingerprint /><ShieldCheck /></div></section>
    <Kpis items={[
      { icon: History, n: audit.length + bridge, label: 'Total audit events' },
      { icon: Upload, n: docs.length, label: 'Documents under lifecycle' },
      { icon: LockKeyhole, n: holds, label: 'Legal holds active', tone: 'amber' },
      { icon: Fingerprint, n: docs.filter(d => d.status === 'Verified').length, label: 'Integrity verified', tone: 'green' },
    ]} />
    <section className="dms-grid">
      <article className="dms-panel">
        <PanelHead icon={Activity} title="Compliance event feed" sub="Uploads, shares, holds, verifications — append-only" action={{ label: 'Full trail', go: () => setPage('audit') }} />
        <Rows items={audit.slice(0, 6).map(a => ({ id: a.id, main: <>{a.action}</>, sub: `${a.actor} · ${a.department}`, right: <small>{a.at}</small> }))} />
      </article>
      <article className="dms-panel">
        <PanelHead icon={LockKeyhole} title="Retention & integrity watchlist" sub="Items needing compliance attention" action={{ label: 'Compliance', go: () => setPage('compliance') }} />
        <Rows items={[
          { id: 'r1', main: <>{holds} documents under legal hold</>, sub: 'Retained until final judgment + appeal period', right: <LockKeyhole /> },
          { id: 'r2', main: <>{bridge} S.U.R.Y.A. cross-system reads</>, sub: 'Permissioned, logged, DPDP-compliant', right: <Share2 /> },
          { id: 'r3', main: <>Retention schedule: criminal proceedings</>, sub: '10 years after case closure', right: <CalendarClock /> },
        ]} />
      </article>
    </section>
  </>;
}

/* ---------- router ---------- */
export function RoleDashboard(props: DashProps) {
  switch (props.role) {
    case 'System Admin': return <SuperAdminDash {...props} />;
    case 'Investigating Officer': return <IODash {...props} />;
    case 'Forensic Officer': return <ForensicDash {...props} />;
    case 'Court / Registrar Staff': return <CourtDash {...props} />;
    case 'Legal Department Officer': return <LegalDash {...props} />;
    case 'Records / Compliance Officer': return <ComplianceDash {...props} />;
    default: return <SuperAdminDash {...props} />;
  }
}
