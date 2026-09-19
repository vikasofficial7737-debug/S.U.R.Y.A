// @ts-nocheck
import { useState } from 'react';
import { Scale, UserRound, BriefcaseBusiness, GraduationCap, ArrowRight, Search, Menu, X, Home, Bot, Users, BookOpen, Briefcase, CalendarDays, FileText, Bell, Send, ShieldCheck, Sparkles, Plus, Check, ChevronRight, Sun, Moon, Languages, MapPin, Mic } from 'lucide-react';
import './App.css';
import './ai.css';
import './roles.css';
import './finder.css';
import './judgment.css';
import { JUDGMENTS, CITIZEN_GUIDES, type Judgment, type CitizenGuide } from './data/judgments';
type Role = 'citizen' | 'lawyer' | 'student'; type View = 'landing' | 'home' | 'chat' | 'cases' | 'library' | 'lawyers' | 'calendar';
const info = { citizen: { name: 'Citizen', icon: UserRound, color: 'orange', promise: 'Clear legal guidance, when you need it.' }, lawyer: { name: 'Lawyer', icon: BriefcaseBusiness, color: 'blue', promise: 'Organize cases. Work with clarity.' }, student: { name: 'Student', icon: GraduationCap, color: 'green', promise: 'Understand landmark cases, simply.' } } as const;
const nav = { citizen: [['Home', Home, 'home'], ['Ask S.U.R.Y.A.', Bot, 'chat'], ['Find a Lawyer', Users, 'lawyers'], ['My Legal Steps', Check, 'cases'], ['Know Your Rights', BookOpen, 'library']], lawyer: [['Dashboard', Home, 'home'], ['My Cases', Briefcase, 'cases'], ['AI Case Assistant', Sparkles, 'chat'], ['Judgment Research', BookOpen, 'library'], ['Calendar & Reminders', CalendarDays, 'calendar']], student: [['Study Home', Home, 'home'], ['Case Library', BookOpen, 'library'], ['Ask about a Case', Bot, 'chat'], ['My Notes', FileText, 'cases']] } as const;
export default function App() {
  const [role, setRole] = useState<Role>('citizen'), [view, setView] = useState<View>('landing'), [dark, setDark] = useState(false), [open, setOpen] = useState(false), [toast, setToast] = useState('');
  const [cases, setCases] = useState(REAL_CASES);
  const flash = (s: string) => { setToast(s); setTimeout(() => setToast(''), 2400) };
  const addCase = (c: typeof REAL_CASES[0]) => { setCases(prev => [c, ...prev]); flash(`Case “${c.title}” created successfully.`); };
  if (view === 'landing') return <Landing role={role} setRole={setRole} start={() => setView('home')} dark={dark} setDark={setDark} />;
  return <div className={'app role-' + role + ' ' + (dark ? 'dark' : '')}><aside className={open ? 'open' : ''}><div className="brand"><Scale /> <b>S.U.R.Y.A.<small>Judicial assistance, unified</small></b><button className="close" onClick={() => setOpen(false)}><X /></button></div><p className="role-label">{info[role].name} SPACE</p><nav>{nav[role].map(([label, Icon, page]) => <button key={label} className={view === page ? 'active' : ''} onClick={() => { setView(page as View); setOpen(false) }}><Icon />{label}</button>)}</nav><div className="side-foot"><ShieldCheck />AI assists, it never decides.<button onClick={() => setView('landing')}>Switch profile <ArrowRight /></button></div></aside>{open && <div className="veil" onClick={() => setOpen(false)} />}<main><header><button className="menu" onClick={() => setOpen(true)}><Menu /></button><button className="back-home" onClick={() => setView('home')}><Home /> Dashboard</button><div className="top-search"><Search /><input placeholder="Search cases, laws, documents..." /></div><div className="top-actions"><button><Languages /> EN</button><button onClick={() => setDark(!dark)}>{dark ? <Sun /> : <Moon />}</button><button onClick={() => flash('You have ' + cases.filter(c => c.daysLeft <= 7).length + ' upcoming reminders.')}><Bell /></button><span>VS</span></div></header><div className="content">{view === 'home' && <HomeView role={role} go={setView} flash={flash} cases={cases} onAddCase={addCase} />} {view === 'chat' && <SmartChat role={role} />} {view === 'cases' && <SmartCases role={role} flash={flash} go={setView} cases={cases} onAddCase={addCase} />} {view === 'calendar' && <CalendarView cases={cases} onAddCase={addCase} go={setView} flash={flash} />} {view === 'library' && <Library role={role} flash={flash} />} {view === 'lawyers' && <SmartLawyers flash={flash} />}</div></main>{toast && <div className="toast"><Check /> {toast}</div>}</div>
}
function Landing({ role, setRole, start, dark, setDark }: { role: Role, setRole: (r: Role) => void, start: () => void, dark: boolean, setDark: (b: boolean) => void }) { return <div className={'landing ' + (dark ? 'dark' : '')}><div className="tricolor"><i /><i /><i /></div><header><div className="brand"><Scale /><b>S.U.R.Y.A.<small>Smart Unified Resource for Judicial Assistance</small></b></div><button onClick={() => setDark(!dark)}>{dark ? <Sun /> : <Moon />}</button></header><section className="landing-hero"><div className="chakra">☸</div><span>WELCOME TO</span><h1>S.U.R.Y.A.</h1><div className="flagline"><i /><i /><i /></div><p>AI-based legal and judicial support platform</p><p className="intro">Legal support becomes clearer, organized, and more accessible — for every citizen, lawyer, and student.</p></section><div className="role-cards">{(Object.keys(info) as Role[]).map(r => { const d = info[r], Icon = d.icon; return <article className={'role-card ' + d.color + (role === r ? ' picked' : '')} key={r} onClick={() => setRole(r)}><div className="illustration"><Icon /><div>⚖</div></div><h2>I am a {d.name}</h2><p>{d.promise}</p><ul>{r === 'citizen' ? <><li>AI legal guidance</li><li>Find verified lawyers</li></> : r === 'lawyer' ? <><li>Intelligent case workspace</li><li>Private document analysis</li></> : <><li>Simple case summaries</li><li>Learn at your own pace</li></>}</ul><button onClick={start}>Continue <ArrowRight /></button></article> })}</div><footer><span><ShieldCheck /> AI provides assistance, not legal advice.</span><span>English · हिन्दी</span></footer></div> }
function HomeView({ role, go, flash, cases, onAddCase }: { role: Role, go: (v: View) => void, flash: (s: string) => void, cases: CaseRecord[], onAddCase: (c: CaseRecord) => void }) { if (role === 'lawyer') return <LawyerHome go={go} flash={flash} cases={cases} onAddCase={onAddCase} />; if (role === 'student') return <StudentHome go={go} flash={flash} />; return <CitizenHome go={go} flash={flash} /> }
function CitizenHome({ go, flash }: { go: (v: View) => void, flash: (s: string) => void }) { let situations = ['Theft or lost item', 'Online fraud', 'Cybercrime', 'Property dispute', 'Consumer issue', 'Family matter']; return <><div className="welcome"><div><em><Sparkles />YOUR LEGAL COMPANION</em><h1>Hello, Vikas <b>✦</b></h1><p>Tell us what happened. We will guide you through the next steps.</p></div><blockquote>“Justice is not just for the few, but for every citizen.”</blockquote></div><div className="split"><section className="panel"><h3><Bot /> How can we help today?</h3><p>Choose a situation or ask in your own words.</p><div className="situations">{situations.map((x, i) => <button onClick={() => go('chat')} key={x}><span>{['◈', '⌁', '◉', '⌂', '◌', '♡'][i]}</span>{x}<ChevronRight /></button>)}</div><button className="ask" onClick={() => go('chat')}><Search />Describe your situation in your own words...<ArrowRight /></button></section><section className="panel steps"><div className="title"><h3>My Legal Steps</h3><button onClick={() => go('cases')}>View all <ArrowRight /></button></div><b>Phone theft report</b><p>3 of 5 steps completed</p><div className="bar"><i /></div>{['File a police complaint', 'Block your SIM card', 'Submit a CEIR request'].map((x, i) => <div className="step" key={x}><span>{i < 2 ? <Check /> : i + 1}</span>{x}</div>)}</section></div><div className="two"><section className="panel"><div className="title"><div><h3>Find the right lawyer</h3><p>Verified specialists near you</p></div><button onClick={() => go('lawyers')}>See all <ArrowRight /></button></div>{['Adv. Priya Sharma — Family Law', 'Adv. Arjun Mehta — Cyber Law', 'Adv. Neha Joshi — Property Law'].map((x, i) => <div className="person" key={x}><i>{['PS', 'AM', 'NJ'][i]}</i><div><b>{x}</b><small>★ 4.{9 - i} · {8 + i} years experience</small></div><button onClick={() => flash('Consultation request sent!')}>Connect</button></div>)}</section><section className="panel rights"><div className="title"><h3>Know your rights</h3><button onClick={() => go('library')}>Explore <ArrowRight /></button></div>{['How to file an FIR', 'What is a legal notice?', 'Online fraud: your immediate rights'].map(x => <button className="line" onClick={() => go('library')} key={x}>⚖ {x}<ChevronRight /></button>)}</section></div></> }
const REAL_CASES = [
  {
    id: 'state-singh', title: 'State vs. R. Singh', ipc: 'IPC 302 – Murder', court: 'Sessions Court, Jaipur', date: '20 Sep 2026', daysLeft: 1, priority: 'HIGH', judge: 'Hon. Justice A.K. Mehta', status: 'Trial in Progress',
    description: 'The accused, Rajesh Singh, is charged under IPC Section 302 for the alleged murder of Sohan Lal on 12 January 2024. The prosecution has presented CCTV footage, a forensic report, and eyewitness testimony by Rajesh Meena. The defense claims alibi. Next hearing is for cross-examination of the forensic expert.',
    timeline: [{ label: 'FIR Filed', date: '12 Jan 2024', done: true }, { label: 'Charge Sheet', date: '5 Mar 2024', done: true }, { label: 'Witness Exam', date: '20 Apr 2026', done: true }, { label: 'Arguments', date: '10 Aug 2026', done: true }, { label: 'Next Hearing', date: '20 Sep 2026', done: false, active: true }, { label: 'Judgment', date: 'TBD', done: false }],
    evidence: ['CCTV Footage (Verified)', 'Forensic Report (Verified)', 'Eyewitness Statement – Rajesh Meena', 'Mobile Call Records', 'Site Photographs'],
    chartData: [65, 72, 58, 80, 75, 88, 70],
    graphSub: 'State vs. R. Singh · IPC 302',
    nodes: [
      { id: 'victim', label: 'Victim', sub: 'Sohan Lal', x: 50, y: 210, color: '#2875e8', bg: '#e8f1ff' },
      { id: 'accused', label: 'Accused', sub: 'R. Singh', x: 260, y: 60, color: '#e46f6c', bg: '#fdf0ef' },
      { id: 'witness', label: 'Witness', sub: 'Rajesh Meena', x: 470, y: 210, color: '#9b70e8', bg: '#f3eeff' },
      { id: 'incident', label: '⚖ Incident', sub: '12 Jan 2024', x: 260, y: 210, color: '#43b484', bg: '#edf9f3' },
      { id: 'evidence', label: 'Evidence', sub: '4 verified files', x: 90, y: 340, color: '#d29b3a', bg: '#fdf6e8' },
      { id: 'court', label: 'Court', sub: '20 Sep 2026', x: 430, y: 340, color: '#7c6fcc', bg: '#f0eefe' },
    ],
    edges: [['victim', 'incident'], ['accused', 'incident'], ['witness', 'incident'], ['incident', 'evidence'], ['incident', 'court']]
  },
  {
    id: 'meena-rajesh', title: 'Meena vs. Rajesh', ipc: 'CPC Order 39', court: 'District Court, Jaipur', date: '24 Sep 2026', daysLeft: 5, priority: 'MEDIUM', judge: 'Hon. Justice S.R. Gupta', status: 'Documents Pending',
    description: 'A civil property dispute between Ms. Meena Devi and Mr. Rajesh Kumar over a 2.4 acre land parcel in Sikar district. The plaintiff claims recorded ownership via registered sale deed (2019). The respondent disputes boundaries and alleges encroachment. 2 key documents remain unverified by the court registry.',
    timeline: [{ label: 'Plaint Filed', date: '3 Feb 2025', done: true }, { label: 'Notice Issued', date: '15 Mar 2025', done: true }, { label: 'Written Statement', date: '22 May 2025', done: true }, { label: 'Evidence Stage', date: '24 Sep 2026', done: false, active: true }, { label: 'Final Hearing', date: 'TBD', done: false }],
    evidence: ['Registered Sale Deed 2019', 'Patwari Records (Pending)', 'Survey Map (Pending)', 'Photographs of Boundary'],
    chartData: [40, 55, 50, 63, 58, 70, 65],
    graphSub: 'Meena vs. Rajesh · CPC Order 39',
    nodes: [
      { id: 'plaintiff', label: 'Plaintiff', sub: 'Meena Devi', x: 70, y: 170, color: '#2875e8', bg: '#e8f1ff' },
      { id: 'respondent', label: 'Respondent', sub: 'Rajesh Kumar', x: 450, y: 170, color: '#e46f6c', bg: '#fdf0ef' },
      { id: 'property', label: '⚖ Property', sub: '2.4 Acres, Sikar', x: 260, y: 170, color: '#43b484', bg: '#edf9f3' },
      { id: 'documents', label: 'Records', sub: '2 pending', x: 150, y: 320, color: '#d29b3a', bg: '#fdf6e8' },
      { id: 'court', label: 'Court', sub: 'District Court', x: 370, y: 320, color: '#7c6fcc', bg: '#f0eefe' },
    ],
    edges: [['plaintiff', 'property'], ['respondent', 'property'], ['property', 'documents'], ['property', 'court']]
  },
  {
    id: 'anita-citybank', title: 'Anita vs. City Bank', ipc: 'Consumer Act', court: 'Consumer Forum', date: '01 Oct 2026', daysLeft: 12, priority: 'LOW', judge: 'President, Forum', status: 'Under Review',
    description: 'Ms. Anita Sharma has filed a consumer complaint against City Bank Ltd. for unauthorized deduction of ₹48,000 from her savings account in March 2026. Despite written complaints and escalations, the bank has not refunded the amount. The case involves digital transaction records and bank correspondence.',
    timeline: [{ label: 'Complaint Filed', date: '10 Apr 2026', done: true }, { label: 'Bank Notice', date: '28 Apr 2026', done: true }, { label: 'Written Reply', date: '20 Jun 2026', done: true }, { label: 'Review', date: '01 Oct 2026', done: false, active: true }, { label: 'Order', date: 'TBD', done: false }],
    evidence: ['Bank Statement (March 2026)', 'Transaction Dispute Form', 'Email Correspondence (3 emails)', 'RBI Grievance Reference'],
    chartData: [30, 45, 38, 55, 52, 60, 58],
    graphSub: 'Anita vs. City Bank · Consumer Act',
    nodes: [
      { id: 'complainant', label: 'Complainant', sub: 'Anita Sharma', x: 80, y: 200, color: '#2875e8', bg: '#e8f1ff' },
      { id: 'bank', label: 'Respondent', sub: 'City Bank Ltd.', x: 440, y: 200, color: '#e46f6c', bg: '#fdf0ef' },
      { id: 'dispute', label: '⚖ Dispute', sub: '₹48,000 deduction', x: 260, y: 200, color: '#43b484', bg: '#edf9f3' },
      { id: 'digital', label: 'Evidence', sub: 'Digital Records', x: 260, y: 60, color: '#d29b3a', bg: '#fdf6e8' },
      { id: 'forum', label: 'Court', sub: 'Consumer Forum', x: 260, y: 320, color: '#7c6fcc', bg: '#f0eefe' },
    ],
    edges: [['complainant', 'dispute'], ['bank', 'dispute'], ['dispute', 'digital'], ['dispute', 'forum']]
  }
];
type CaseRecord = typeof REAL_CASES[0];
type CaseForm = { title: string; ipc: string; court: string; date: string; priority: 'HIGH' | 'MEDIUM' | 'LOW'; judge: string; description: string };
function daysUntil(dateStr: string) {
  const parsed = Date.parse(dateStr);
  if (Number.isNaN(parsed)) return 7;
  return Math.max(0, Math.ceil((parsed - Date.now()) / 86400000));
}
function formatDisplayDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function createCaseFromForm(form: CaseForm): CaseRecord {
  const id = 'case-' + Date.now();
  const displayDate = formatDisplayDate(form.date);
  const today = formatDisplayDate(new Date().toISOString().slice(0, 10));
  const party = (form.title.match(/vs\.?\s+(.+)/i)?.[1] || 'Party').trim().slice(0, 14);
  return {
    id,
    title: form.title.trim(),
    ipc: form.ipc.trim() || 'General matter',
    court: form.court.trim() || 'District Court',
    date: displayDate,
    daysLeft: daysUntil(form.date),
    priority: form.priority,
    judge: form.judge.trim() || 'Hon. Judge',
    status: 'Newly Filed',
    description: form.description.trim() || 'New case workspace created in S.U.R.Y.A. Update facts and evidence as the matter progresses.',
    timeline: [
      { label: 'Case Opened', date: today, done: true },
      { label: 'Next Hearing', date: displayDate, done: false, active: true },
      { label: 'Arguments', date: 'TBD', done: false },
      { label: 'Judgment', date: 'TBD', done: false },
    ],
    evidence: ['Intake notes (draft)', 'Client instructions'],
    chartData: [18, 24, 30, 36, 42, 48, 55],
    graphSub: `${form.title.trim()} · ${form.ipc.trim() || 'General'}`,
    nodes: [
      { id: 'party', label: 'Party', sub: party, x: 50, y: 210, color: '#2875e8', bg: '#e8f1ff' },
      { id: 'accused', label: 'Matter', sub: form.priority, x: 260, y: 60, color: '#e46f6c', bg: '#fdf0ef' },
      { id: 'witness', label: 'Counsel', sub: 'Your desk', x: 470, y: 210, color: '#9b70e8', bg: '#f3eeff' },
      { id: 'incident', label: '⚖ Case', sub: today, x: 260, y: 210, color: '#43b484', bg: '#edf9f3' },
      { id: 'evidence', label: 'Evidence', sub: '2 files', x: 90, y: 340, color: '#d29b3a', bg: '#fdf6e8' },
      { id: 'court', label: 'Court', sub: displayDate, x: 430, y: 340, color: '#7c6fcc', bg: '#f0eefe' },
    ],
    edges: [['party', 'incident'], ['accused', 'incident'], ['witness', 'incident'], ['incident', 'evidence'], ['incident', 'court']],
  };
}
const PRIORITY_RANK = { HIGH: 0, MEDIUM: 1, LOW: 2 };
const byPriority = (a: { priority: string; daysLeft: number }, b: { priority: string; daysLeft: number }) =>
  ((PRIORITY_RANK as any)[a.priority] ?? 9) - ((PRIORITY_RANK as any)[b.priority] ?? 9) || a.daysLeft - b.daysLeft;

function NewCaseModal({ onClose, onCreate }: { onClose: () => void, onCreate: (c: CaseRecord) => void }) {
  const defaultDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const [form, setForm] = useState<CaseForm>({ title: '', ipc: '', court: '', date: defaultDate, priority: 'MEDIUM', judge: '', description: '' });
  const set = (k: keyof CaseForm, v: string) => setForm(f => ({ ...f, [k]: v }));
  const submit = (e: any) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onCreate(createCaseFromForm(form));
    onClose();
  };
  return (
    <div className="modal-veil" onClick={onClose}>
      <form className="modal-card" onClick={e => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-head"><h3><Plus /> Create new case</h3><button type="button" className="modal-x" onClick={onClose}><X /></button></div>
        <p className="modal-sub">Add a matter to your workspace. It will appear in Priority queue, My Cases, and Calendar.</p>
        <label>Case title *<input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. State vs. A. Kumar" required /></label>
        <div className="modal-row">
          <label>Statute / IPC<input value={form.ipc} onChange={e => set('ipc', e.target.value)} placeholder="e.g. IPC 420" /></label>
          <label>Priority<select value={form.priority} onChange={e => set('priority', e.target.value)}><option value="HIGH">HIGH</option><option value="MEDIUM">MEDIUM</option><option value="LOW">LOW</option></select></label>
        </div>
        <div className="modal-row">
          <label>Court<input value={form.court} onChange={e => set('court', e.target.value)} placeholder="e.g. Sessions Court, Jaipur" /></label>
          <label>Next hearing<input type="date" value={form.date} onChange={e => set('date', e.target.value)} required /></label>
        </div>
        <label>Judge<input value={form.judge} onChange={e => set('judge', e.target.value)} placeholder="e.g. Hon. Justice A.K. Mehta" /></label>
        <label>Case description<textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Short facts, parties, and next steps..." rows={3} /></label>
        <div className="modal-actions">
          <button type="button" className="ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary"><Plus />Create case</button>
        </div>
      </form>
    </div>
  );
}

function CaseDetailView({ caseData, onBack, onAskAI }: { caseData: CaseRecord, onBack: () => void, onAskAI?: () => void }) {
  const c = caseData;
  const max = Math.max(...c.chartData);
  return <div className="case-detail-view">
    <button className="back-btn" onClick={onBack}>← Back to Dashboard</button>
    <div className="cdv-header">
      <div><span className={'cdv-badge priority-' + c.priority.toLowerCase()}>{c.priority}</span><h2>{c.title}</h2><p>{c.ipc} · {c.court}</p></div>
      <div className="cdv-meta"><span>📅 Next Hearing: <b>{c.date}</b></span><span>⚖ Judge: <b>{c.judge}</b></span><span>📌 Status: <b>{c.status}</b></span></div>
    </div>
    <div className="cdv-grid">
      <div className="cdv-left">
        <section className="panel"><h3>Case Description</h3><p className="cdv-desc">{c.description}</p></section>
        <section className="panel cdv-evidence"><h3>Evidence &amp; Documents</h3><ul>{c.evidence.map((e, i) => <li key={i}><Check />{e}</li>)}</ul></section>
        <section className="panel cdv-timeline-wrap"><h3>Case Timeline</h3><div className="cdv-timeline">{c.timeline.map((t, i) => <div key={i} className={'ctl-item' + (t.done ? ' done' : '') + (t.active ? ' active' : '')}><div className="ctl-dot" /><div className="ctl-info"><b>{t.label}</b><small>{t.date}</small></div>{i < c.timeline.length - 1 && <div className="ctl-line" />}</div>)}</div></section>
      </div>
      <div className="cdv-right">
        <section className="panel cdv-chart-panel"><h3>Case Activity Overview</h3><p>Engagement score over last 7 months</p><div className="cdv-chart">{c.chartData.map((v, i) => <div key={i} className="cdv-bar-wrap"><div className="cdv-bar" style={{ height: Math.round((v / max) * 140) + 'px' }} title={v + '%'} /><small>{['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'][i]}</small></div>)}</div></section>
        <section className="panel cdv-ai"><Bot /><h3>AI Case Brief</h3><p>S.U.R.Y.A. can prepare a hearing brief, find related precedents, or summarize the evidence for this case.</p><button className="ask" style={{ marginTop: '12px' }} onClick={() => onAskAI?.()}><Search />Generate hearing brief<ArrowRight /></button></section>
      </div>
    </div>
  </div>
}
function LawyerHome({ go, flash, cases, onAddCase }: { go: (v: View) => void, flash: (s: string) => void, cases: CaseRecord[], onAddCase: (c: CaseRecord) => void }) {
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [graphCaseId, setGraphCaseId] = useState<string>(cases[0]?.id || '');
  const [showNew, setShowNew] = useState(false);
  const selected = cases.find(c => c.id === selectedCase);
  if (selected) return <CaseDetailView caseData={selected} onBack={() => setSelectedCase(null)} onAskAI={() => go('chat')} />;
  const activeCase = cases.find(c => c.id === graphCaseId) || cases[0];
  if (!activeCase) return <div className="panel"><p>No cases yet.</p><button className="primary" onClick={() => setShowNew(true)}><Plus />New case</button>{showNew && <NewCaseModal onClose={() => setShowNew(false)} onCreate={c => { onAddCase(c); setGraphCaseId(c.id); }} />}</div>;
  const { nodes, edges } = activeCase;
  const getNode = (id: string) => nodes.find(n => n.id === id)!;
  const upcoming = [...cases].sort((a, b) => a.daysLeft - b.daysLeft);
  return <><div className="welcome"><div><em className="gold"><Sparkles />CASE COMMAND CENTER</em><h1>Good morning, <b>Vikas.</b></h1><p>Your practice is moving. Here is what needs your attention.</p></div><button className="primary" onClick={() => setShowNew(true)}><Plus />New case</button></div>
    <div className="stats">{[[Briefcase, String(cases.length).padStart(2, '0'), 'Active cases', 'cases'], [Bell, String(cases.filter(c => c.daysLeft <= 7).length).padStart(2, '0'), 'Upcoming hearings', 'calendar'], [Sparkles, '08', 'AI summaries', 'chat'], [FileText, String(cases.reduce((n, c) => n + c.evidence.length, 0)), 'Verified documents', 'cases']].map(([I, n, t, page]: any, idx) => <div key={idx} className="stat-clickable" role="button" tabIndex={0} onClick={() => go(page)} onKeyDown={e => e.key === 'Enter' && go(page)}><I /><b>{n}</b><small>{t}</small></div>)}</div>
    <div className="split law">
      <section className="panel graph">
        <div className="title" style={{ alignItems: 'center' }}><div><h3>AI Case Visualizer</h3><p>{activeCase.graphSub}</p></div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select value={activeCase.id} onChange={e => setGraphCaseId(e.target.value)} style={{ fontSize: '10px', padding: '5px', borderRadius: '5px', border: '1px solid var(--line)', color: 'var(--ink)', background: 'var(--paper)', outline: 'none' }}>
              {cases.map(c => <option key={c.id} value={c.id}>Case: {c.title}</option>)}
            </select>
            <button onClick={() => flash('Case graph expanded.')} style={{ marginTop: 0 }}>Expand ↗</button>
          </div>
        </div>
        <div className="network-svg-wrap">
          <svg viewBox="0 0 620 430" className="case-svg">
            <defs><marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#8fadd4" /></marker></defs>
            {edges.map(([a, b], i) => { const na = getNode(a), nb = getNode(b); return <line key={i} x1={na.x + 48} y1={na.y + 20} x2={nb.x + 48} y2={nb.y + 20} stroke="#8fadd4" strokeWidth="1.5" strokeDasharray="5,3" markerEnd="url(#arr)" opacity="0.7" /> })}
            {nodes.map(n => <g key={n.id}>
              <rect x={n.x} y={n.y} width="96" height="42" rx="10" fill={n.bg} stroke={n.color} strokeWidth="1.5" />
              <text x={n.x + 48} y={n.y + 15} textAnchor="middle" fontSize="10" fontWeight="600" fill={n.color}>{n.label}</text>
              <text x={n.x + 48} y={n.y + 29} textAnchor="middle" fontSize="8" fill="#7a8fa8">{n.sub}</text>
            </g>)}
          </svg>
        </div>
      </section>
      <section className="panel priority"><div className="title"><h3>Priority queue</h3><button onClick={() => go('cases')}>View cases</button></div>
        {[...cases].sort(byPriority).map((c) => <button key={c.id} onClick={() => setSelectedCase(c.id)}><span className={'pq-badge ' + c.priority.toLowerCase()}>{c.priority}</span><div><b>{c.title}</b><small>{c.priority === 'HIGH' ? 'Hearing in ' + c.daysLeft + ' day' + (c.daysLeft === 1 ? '' : 's') : c.priority === 'MEDIUM' ? (c.status === 'Newly Filed' ? 'Newly filed matter' : '2 documents missing') : 'Review due Friday'}</small></div><ChevronRight /></button>)}
      </section>
    </div>
    <section className="panel case-timeline-panel">
      <div className="title"><h3>Case Timeline · {activeCase.title}</h3><button onClick={() => setSelectedCase(activeCase.id)}>View Full Timeline →</button></div>
      <div className="case-tl">
        {activeCase.timeline.map((t, i) => <div key={i} className={'tl-step' + (t.done ? ' tl-done' : '') + (t.active ? ' tl-active' : '')}>
          <div className="tl-dot"><div /></div>
          {i < activeCase.timeline.length - 1 && <div className="tl-connector" />}
          <div className="tl-label"><b>{t.label}</b><small>{t.date}</small></div>
        </div>)}
      </div>
    </section>
    <div className="two">
      <section className="panel">
        <div className="title"><h3>Upcoming hearings</h3><button onClick={() => go('calendar')}>Calendar <ArrowRight /></button></div>
        {upcoming.map((c) => <div className="hearing hearing-clickable" key={c.id} onClick={() => setSelectedCase(c.id)}>
          <CalendarDays />
          <div><b>{c.title}</b><small>{c.date} · {c.court}</small><span className={'h-ipc'}>{c.ipc}</span></div>
          <span className={'h-days ' + (c.priority.toLowerCase())}>{c.daysLeft}d</span>
        </div>)}
      </section>
      <section className="panel ai"><Bot /><h3>Ask S.U.R.Y.A.</h3><p>"I can summarize evidence, find related precedents, or prepare a hearing brief."</p><button className="ask" onClick={() => go('chat')}><Search />Ask about a case<ArrowRight /></button></section>
    </div>
    {showNew && <NewCaseModal onClose={() => setShowNew(false)} onCreate={c => { onAddCase(c); setGraphCaseId(c.id); }} />}
  </>
}
function StudentHome({ go, flash }: { go: (v: View) => void, flash: (s: string) => void }) { let topics = ['Criminal Law', 'Constitutional', 'Cyber Law', 'Property Law', 'Contract Law', 'Family Law']; return <><div className="welcome"><div><em className="green"><GraduationCap />YOUR LEGAL LEARNING SPACE</em><h1>Learn the law, <b>clearly.</b></h1><p>Explore landmark cases explained in language that makes sense.</p></div><div className="streak">🔥 <b>7 day streak</b><small>Keep going!</small></div></div><section className="panel"><div className="title"><div><h3>Explore by topic</h3><p>Start with what you are studying</p></div><button onClick={() => go('library')}>All topics <ArrowRight /></button></div><div className="topics">{topics.map((x, i) => <button onClick={() => go('library')} key={x}>⚖<b>{x}</b><small>{12 + i * 7} cases</small></button>)}</div></section><div className="two"><section className="panel reading"><span>CONSTITUTIONAL LAW</span><h2>Kesavananda Bharati<br />v. State of Kerala</h2><p>Understanding the Basic Structure Doctrine</p><button onClick={() => go('library')}>Resume case <ArrowRight /></button></section><section className="panel quiz"><Sparkles /><h3>Test your understanding</h3><p>Try a quick AI-generated quiz from your recent reading.</p><button onClick={() => go('chat')}>Start 5-question quiz <ArrowRight /></button></section></div></> }
type Help = { title: string; now: string[]; docs: string[]; where: string; source: string };
function legalHelp(text: string): Help { let q = text.toLowerCase(); if (/phone|mobile|stolen|theft|lost/.test(q)) return { title: 'Phone theft or loss', now: ['Call your mobile operator to block the SIM.', 'File a police complaint with the place and time of loss.', 'Use the CEIR portal to request blocking of the device IMEI.'], docs: ['Government ID proof', 'Mobile number and IMEI / purchase invoice', 'Copy of police complaint'], where: 'Nearest police station, then the CEIR portal', source: 'CEIR / Department of Telecommunications' }; if (/fraud|upi|bank|scam|money|transaction/.test(q)) return { title: 'Online financial fraud', now: ['Call 1930 immediately to report the transaction.', 'Contact your bank or payment provider and request a freeze.', 'Preserve screenshots, transaction IDs, messages and call records.'], docs: ['Transaction ID and bank details', 'Screenshots / chats / URLs', 'Identity proof'], where: '1930 cyber fraud helpline and cybercrime.gov.in', source: 'National Cyber Crime Reporting Portal' }; if (/cyber|instagram|facebook|harass|blackmail/.test(q)) return { title: 'Cybercrime report', now: ['Do not delete messages, URLs, or screenshots.', 'Use the National Cyber Crime Reporting Portal.', 'If you feel unsafe, contact local police immediately.'], docs: ['Screenshots and profile links', 'Device / account details', 'Identity proof'], where: 'cybercrime.gov.in or your local cyber cell', source: 'National Cyber Crime Reporting Portal' }; if (/property|land|tenant|rent|house/.test(q)) return { title: 'Property or tenancy concern', now: ['Collect agreements, receipts, notices and ownership records.', 'Write down a timeline of events and all parties involved.', 'Consider a legal-aid clinic or property lawyer for document review.'], docs: ['Sale deed / rent agreement', 'Tax receipts and notices', 'Communication records'], where: 'District Legal Services Authority or a property-law specialist', source: 'National Legal Services Authority' }; return { title: 'General legal guidance', now: ['Write down a clear timeline of what happened.', 'Keep originals and copies of all messages and documents.', 'Use the relevant official authority or consult a qualified lawyer for advice specific to your facts.'], docs: ['Identity proof', 'Written timeline', 'Relevant notices, receipts, or communications'], where: 'Relevant local authority or District Legal Services Authority', source: 'National Legal Services Authority' } }
function SmartChat({ role }: { role: Role }) { const [text, setText] = useState(''), [question, setQuestion] = useState(''), [loading, setLoading] = useState(false), [listening, setListening] = useState(false), [voiceLang, setVoiceLang] = useState<'en-IN' | 'hi-IN'>('en-IN'); const help = question ? legalHelp(question) : null; const send = () => { if (!text.trim()) return; setLoading(true); setTimeout(() => { setQuestion(text); setText(''); setLoading(false) }, 550) }; const voice = () => { const Speech = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; if (!Speech) { alert('Voice input is supported in Chrome and Microsoft Edge.'); return } const r = new Speech(); r.lang = voiceLang; r.interimResults = true; setListening(true); r.onresult = (e: any) => setText(e.results[0][0].transcript); r.onerror = () => setListening(false); r.onend = () => setListening(false); r.start() }; const prompts = role === 'lawyer' ? ['Summarize the main arguments in this case', 'What evidence should I verify first?', 'Create a hearing preparation checklist'] : voiceLang === 'hi-IN' ? ['मेरा फोन चोरी हो गया है', 'मेरे साथ UPI फ्रॉड हुआ है', 'FIR क्या होती है?'] : ['My phone was stolen. What should I do?', 'I lost money in an online UPI fraud', 'What does an FIR mean?']; return <><div className="chat-head"><Bot /><div><em>S.U.R.Y.A. AI ASSISTANT · DEMO MODE</em><h1>{role === 'lawyer' ? 'Your case intelligence partner' : 'Describe your situation in your own words'}</h1><p>Answers are organized into practical next steps, documents, and reporting channels.</p></div></div><div className="smart-chat"><section className="panel chat-workspace">{!help && !loading && <div className="empty-ai"><Sparkles /><h2>What happened?</h2><p>Try a real-life scenario for the presentation. The assistant will classify it and prepare a guidance plan.</p></div>}{loading && <div className="thinking"><Sparkles /> S.U.R.Y.A. is organizing your legal guidance…</div>}{help && <div className="help-result"><div className="result-top"><span>AI CLASSIFICATION</span><h2>{help.title}</h2><small>Confidence: High · Based on keywords in your description</small></div><div className="result-grid"><article><b>1. What to do now</b>{help.now.map(x => <p key={x}><Check />{x}</p>)}</article><article><b>2. Documents to keep</b>{help.docs.map(x => <p key={x}><FileText />{x}</p>)}</article></div><div className="report-channel"><MapPin /><div><b>Where to report</b><p>{help.where}</p><small>Source: {help.source}</small></div><button onClick={() => window.print()}>Print plan</button></div><div className="disclaimer"><ShieldCheck />This is general information, not legal advice. A qualified professional should assess your specific situation.</div></div>}</section><aside className="prompt-panel"><h3>Presentation prompts</h3>{prompts.map(x => <button onClick={() => setText(x)} key={x}>{x}<ChevronRight /></button>)}<div><ShieldCheck /><b>Privacy-first</b><p>Demo data stays in your browser. Do not enter sensitive personal information.</p></div></aside></div><div className="composer"><button className="voice-language" title="Switch voice language" onClick={() => setVoiceLang(voiceLang === 'en-IN' ? 'hi-IN' : 'en-IN')}>{voiceLang === 'en-IN' ? 'EN' : 'हि'}</button><button className={'voice ' + (listening ? 'listening' : '')} title={'Speak in ' + (voiceLang === 'en-IN' ? 'English' : 'Hindi')} onClick={voice}><Mic /></button><input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder={listening ? (voiceLang === 'hi-IN' ? 'सुन रहा हूँ… बोलिए' : 'Listening… speak now') : role === 'lawyer' ? 'Ask about evidence, precedents, or hearing prep...' : (voiceLang === 'hi-IN' ? 'उदाहरण: मेरा फोन जयपुर में चोरी हो गया' : 'Example: My phone was stolen yesterday in Jaipur...')} /><button onClick={send}><Send /></button></div></> }
function SmartCases({ role, flash, go, cases, onAddCase }: { role: Role, flash: (x: string) => void, go: (v: View) => void, cases: CaseRecord[], onAddCase: (c: CaseRecord) => void }) {
  if (role !== 'lawyer') return <Cases role={role} flash={flash} go={go} cases={cases} onAddCase={onAddCase} />;
  return <><div className="heading"><div><em>AI CASE ANALYSIS WORKSPACE</em><h1>Generate a case intelligence map</h1><p>Enter basic facts and demonstrate case classification, priorities, and evidence mapping.</p></div></div><CaseAnalyzer flash={flash} /><Cases role={role} flash={flash} go={go} cases={cases} onAddCase={onAddCase} /></>
}
function CaseAnalyzer({ flash }: { flash: (x: string) => void }) {
  const [title, setTitle] = useState('State vs. R. Singh');
  const [facts, setFacts] = useState('Accused was identified by a witness. CCTV footage and a forensic report are available.');
  const [ready, setReady] = useState(false);
  const q = facts.toLowerCase();
  const evidence = ['Witness statement', ...(q.includes('cctv') ? ['CCTV footage'] : []), ...(q.includes('forensic') ? ['Forensic report'] : []), ...(q.includes('message') ? ['Digital messages'] : [])];
  const urgency = q.includes('hearing') || q.includes('urgent') ? 'High' : 'Medium';
  const vsMatch = title.match(/(.+?)\s+vs\.?\s+(.+)/i);
  const accusedName = vsMatch ? vsMatch[2].replace(/\s*[-–].*$/, '').trim() : 'Named party';
  const NODE_W = 108, NODE_H = 44;
  const nodes = [
    { id: 'case', label: '⚖ Case', sub: title.length > 16 ? title.slice(0, 14) + '…' : title, x: 206, y: 118, color: '#43b484', bg: '#edf9f3' },
    { id: 'accused', label: 'Accused', sub: accusedName.length > 16 ? accusedName.slice(0, 14) + '…' : accusedName, x: 206, y: 18, color: '#e46f6c', bg: '#fdf0ef' },
    { id: 'witness', label: 'Witness', sub: 'Statement', x: 28, y: 118, color: '#9b70e8', bg: '#f3eeff' },
    { id: 'evidence', label: 'Evidence', sub: evidence.length + ' items', x: 206, y: 218, color: '#d29b3a', bg: '#fdf6e8' },
    { id: 'court', label: 'Court', sub: urgency + ' priority', x: 384, y: 118, color: '#7c6fcc', bg: '#f0eefe' },
  ];
  const edges: [string, string][] = [['accused', 'case'], ['witness', 'case'], ['evidence', 'case'], ['court', 'case']];
  const getNode = (id: string) => nodes.find(n => n.id === id)!;
  const cx = (n: typeof nodes[0]) => n.x + NODE_W / 2;
  const cy = (n: typeof nodes[0]) => n.y + NODE_H / 2;

  return (
    <section className="analyzer panel">
      <div className="analyzer-form">
        <h3><Sparkles /> AI case analyzer</h3>
        <label>Case title<input value={title} onChange={e => setTitle(e.target.value)} /></label>
        <label>Case facts / evidence<input value={facts} onChange={e => setFacts(e.target.value)} /></label>
        <button className="primary" onClick={() => { setReady(true); flash('AI case graph generated from the entered facts.') }}><Sparkles />Generate intelligence map</button>
        <p><ShieldCheck /> AI suggestions must be reviewed by a legal professional.</p>
      </div>
      <div className={'generated ' + (ready ? 'visible' : '')}>
        <div className="generated-head"><span>ANALYSIS READY</span><b>{title}</b><small>Priority: <i className={urgency.toLowerCase()}>{urgency}</i> · Case type: Criminal matter</small></div>
        <div className="dynamic-graph">
          <svg viewBox="0 0 520 280" className="analyzer-svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <marker id="analyzer-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#8fadd4" />
              </marker>
            </defs>
            {edges.map(([a, b], i) => {
              const na = getNode(a), nb = getNode(b);
              return <line key={i} x1={cx(na)} y1={cy(na)} x2={cx(nb)} y2={cy(nb)} stroke="#8fadd4" strokeWidth="1.5" strokeDasharray="5,3" markerEnd="url(#analyzer-arr)" opacity="0.75" />;
            })}
            {nodes.map(n => (
              <g key={n.id}>
                <rect x={n.x} y={n.y} width={NODE_W} height={NODE_H} rx="10" fill={n.bg} stroke={n.color} strokeWidth="1.5" />
                <text x={cx(n)} y={n.y + 17} textAnchor="middle" fontSize="11" fontWeight="600" fill={n.color}>{n.label}</text>
                <text x={cx(n)} y={n.y + 32} textAnchor="middle" fontSize="9" fill="#7a8fa8">{n.sub}</text>
              </g>
            ))}
          </svg>
        </div>
        <div className="evidence-list"><b>Detected evidence</b>{evidence.map(x => <span key={x}><Check />{x}</span>)}</div>
      </div>
    </section>
  );
}
function Cases({ role, flash, go, cases = [], onAddCase }: { role: Role, flash: (x: string) => void, go?: (v: View) => void, cases?: CaseRecord[], onAddCase?: (c: CaseRecord) => void }) {
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState('');
  const selected = cases.find(c => c.id === selectedCase);
  if (role === 'lawyer' && selected) return <CaseDetailView caseData={selected} onBack={() => setSelectedCase(null)} onAskAI={() => go?.('chat')} />;
  let list = role === 'lawyer'
    ? [...cases].sort(byPriority).filter(c => !search.trim() || (c.title + c.status + c.ipc).toLowerCase().includes(search.toLowerCase())).map(c => ({ id: c.id, name: c.title, sub: 'Confidential case workspace', status: c.status }))
    : (role === 'citizen' ? ['Phone theft report', 'Consumer complaint', 'Property documentation'] : ['Constitutional law notes', 'Criminal law collection', 'Cybercrime research']).map((n, i) => ({ id: n, name: n, sub: 'Saved for later', status: i === 0 ? 'In progress' : i === 1 ? 'Review needed' : 'Saved' }));
  return <>
    <div className="heading"><div><em>{role === 'lawyer' ? 'CASE MANAGEMENT' : role === 'citizen' ? 'MY PROGRESS' : 'MY STUDY SPACE'}</em><h1>{role === 'lawyer' ? 'Your cases' : role === 'citizen' ? 'Your legal journey' : 'Bookmarks & notes'}</h1><p>Everything you need, organized in one secure place.</p></div>
      <button className="primary" onClick={() => role === 'lawyer' ? setShowNew(true) : flash('Saved successfully.')}><Plus />{role === 'lawyer' ? 'New case' : 'Add new'}</button>
    </div>
    <section className="panel table">
      <div className="table-search"><Search /><input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      {list.map((x) => <div className="row hearing-clickable" key={x.id} onClick={() => { if (role === 'lawyer') setSelectedCase(x.id); else flash(`${x.name} opened.`) }}><FileText /><div><b>{x.name}</b><small>{x.sub}</small></div><span>{x.status}</span><button type="button"><ChevronRight /></button></div>)}
    </section>
    {showNew && onAddCase && <NewCaseModal onClose={() => setShowNew(false)} onCreate={c => { onAddCase(c); setSelectedCase(c.id); }} />}
  </>
}
function CalendarView({ cases, onAddCase, go, flash }: { cases: CaseRecord[], onAddCase: (c: CaseRecord) => void, go: (v: View) => void, flash: (s: string) => void }) {
  const [showNew, setShowNew] = useState(false);
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const selected = cases.find(c => c.id === selectedCase);
  if (selected) return <CaseDetailView caseData={selected} onBack={() => setSelectedCase(null)} onAskAI={() => go('chat')} />;
  const upcoming = [...cases].sort((a, b) => a.daysLeft - b.daysLeft);
  const reminders = upcoming.filter(c => c.daysLeft <= 14);
  return <>
    <div className="heading">
      <div><em>CALENDAR & REMINDERS</em><h1>Hearings and follow-ups</h1><p>Track upcoming dates and create new matters for your diary.</p></div>
      <button className="primary" onClick={() => setShowNew(true)}><Plus />New case</button>
    </div>
    <div className="two">
      <section className="panel">
        <div className="title"><h3>Upcoming hearings</h3><button onClick={() => go('cases')}>All cases <ArrowRight /></button></div>
        {upcoming.map(c => (
          <div className="hearing hearing-clickable" key={c.id} onClick={() => setSelectedCase(c.id)}>
            <CalendarDays />
            <div><b>{c.title}</b><small>{c.date} · {c.court}</small><span className="h-ipc">{c.ipc}</span></div>
            <span className={'h-days ' + c.priority.toLowerCase()}>{c.daysLeft}d</span>
          </div>
        ))}
      </section>
      <section className="panel">
        <div className="title"><h3>Reminders</h3><button onClick={() => flash(reminders.length + ' reminders in the next 2 weeks')}>Refresh</button></div>
        {reminders.length === 0 && <p style={{ fontSize: 12, color: 'var(--muted)' }}>No reminders in the next 14 days.</p>}
        {reminders.map(c => (
          <div className="hearing hearing-clickable" key={'r-' + c.id} onClick={() => setSelectedCase(c.id)}>
            <Bell />
            <div><b>{c.title}</b><small>{c.priority} priority · Hearing in {c.daysLeft} day{c.daysLeft === 1 ? '' : 's'}</small></div>
            <ChevronRight />
          </div>
        ))}
        <button className="ask" style={{ marginTop: 14 }} onClick={() => setShowNew(true)}><Plus />Create case with hearing date<ArrowRight /></button>
      </section>
    </div>
    {showNew && <NewCaseModal onClose={() => setShowNew(false)} onCreate={c => { onAddCase(c); setSelectedCase(c.id); }} />}
  </>
}
function Library({ role, flash }: { role: Role, flash: (x: string) => void }) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isCitizen = role === 'citizen';
  const runSearch = () => flash(query.trim() ? `Showing results for “${query.trim()}”` : 'Showing all records');

  if (!isCitizen && selectedId) {
    const j = JUDGMENTS.find(x => x.id === selectedId);
    if (j) return <JudgmentDetailPage judgment={j} onBack={() => setSelectedId(null)} />;
  }
  if (isCitizen && selectedId) {
    const g = CITIZEN_GUIDES.find(x => x.id === selectedId);
    if (g) return <GuideDetailPage guide={g} onBack={() => setSelectedId(null)} />;
  }

  const judgments = JUDGMENTS.filter(j => matchJudgment(j, query));
  const guides = CITIZEN_GUIDES.filter(g => matchGuide(g, query));
  const heading = role === 'lawyer'
    ? { em: 'JUDGMENT RESEARCH', h1: 'Landmark judgments', p: 'Search authentic Supreme Court authorities with structured case briefs.' }
    : role === 'student'
      ? { em: 'CASE LIBRARY', h1: 'Learn from landmark cases', p: 'Clear summaries, original context, and useful next steps.' }
      : { em: 'LEGAL KNOWLEDGE', h1: 'Guides you can understand', p: 'Clear summaries, original context, and useful next steps.' };

  return <>
    <div className="heading"><div><em>{heading.em}</em><h1>{heading.h1}</h1><p>{heading.p}</p></div></div>
    <div className="library-search">
      <Search />
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && runSearch()}
        placeholder={isCitizen ? 'Search guides, e.g. FIR, fraud, consumer...' : 'Search cases, citations, years, or keywords...'}
      />
      <button onClick={runSearch}>Search</button>
    </div>
    {!isCitizen && (
      <>
        <p className="results-count">Showing {judgments.length} landmark judgment{judgments.length === 1 ? '' : 's'} · Real Supreme Court of India authorities (educational summaries)</p>
        <div className="cards">
          {judgments.length === 0 && <div className="library-empty">No judgments matched your search. Try “privacy”, “FIR”, “377”, or a year like “2017”.</div>}
          {judgments.map((j, i) => (
            <article key={j.id}>
              <div className={'cover c' + (i % 3)}><Scale /></div>
              <em>LANDMARK JUDGMENT</em>
              <p className="card-cite">{j.citation}</p>
              <h3>{j.shortTitle}</h3>
              <p className="card-meta">{j.court} · {j.year} · {j.area}</p>
              <p>{j.summary}</p>
              <button onClick={() => setSelectedId(j.id)}>Read <ArrowRight /></button>
            </article>
          ))}
        </div>
      </>
    )}
    {isCitizen && (
      <>
        <p className="results-count">Showing {guides.length} guide{guides.length === 1 ? '' : 's'}</p>
        <div className="cards">
          {guides.length === 0 && <div className="library-empty">No guides matched your search.</div>}
          {guides.map((g, i) => (
            <article key={g.id}>
              <div className={'cover c' + (i % 3)}><Scale /></div>
              <em>KNOW YOUR RIGHTS</em>
              <h3>{g.title}</h3>
              <p className="card-meta">{g.area}</p>
              <p>{g.summary}</p>
              <button onClick={() => setSelectedId(g.id)}>Read <ArrowRight /></button>
            </article>
          ))}
        </div>
      </>
    )}
  </>;
}
function SmartLawyers({ flash }: { flash: (x: string) => void }) { const [city, setCity] = useState('Jaipur'), [state, setState] = useState('Rajasthan'), [area, setArea] = useState(''); const all = [['Priya Sharma', 'Family & civil law', 'Jaipur', 'Rajasthan', 8], ['Arjun Mehta', 'Cybercrime & technology', 'Jaipur', 'Rajasthan', 11], ['Neha Joshi', 'Property disputes', 'Delhi', 'Delhi', 9], ['Karan Sethi', 'Criminal defence', 'Mumbai', 'Maharashtra', 12], ['Aditi Rao', 'Consumer & banking law', 'Bengaluru', 'Karnataka', 7], ['Rahul Verma', 'Family & mediation', 'Lucknow', 'Uttar Pradesh', 10]]; const visible = all.filter(p => (!city || p[2] === city) && (!state || p[3] === state) && (!area || p[1].toLowerCase().includes(area.toLowerCase()))); return <><div className="heading"><div><em>VERIFIED LEGAL PROFESSIONALS</em><h1>Find the right lawyer</h1><p>Search by practice area, city, state, experience, and reviews.</p></div></div><div className="finder smart-finder"><Search /><input value={area} onChange={e => setArea(e.target.value)} placeholder="Practice area, e.g. family, cyber, property..." /><select value={city} onChange={e => setCity(e.target.value)}><option value="">All cities</option>{['Jaipur', 'Delhi', 'Mumbai', 'Bengaluru', 'Lucknow'].map(x => <option key={x}>{x}</option>)}</select><select value={state} onChange={e => setState(e.target.value)}><option value="">All states</option>{['Rajasthan', 'Delhi', 'Maharashtra', 'Karnataka', 'Uttar Pradesh'].map(x => <option key={x}>{x}</option>)}</select><button onClick={() => flash(`${visible.length} verified lawyers found.`)}>Search</button></div><p className="results-count">Showing {visible.length} verified advocates · All profiles are sample presentation data.</p><div className="cards lawyer-cards">{visible.map((p, i) => <article key={p[0] as string}><div className="face">{(p[0] as string).split(' ').map(w => w[0]).join('')}</div><span className="verified">✓ Verified</span><h3>Adv. {p[0]}</h3><p>{p[1]}</p><small>📍 {p[2]}, {p[3]} · {p[4]}+ years</small><strong>★ 4.{9 - i} <i>({48 - i * 4} reviews)</i></strong><button onClick={() => flash(`Consultation request sent to ${p[0]}.`)}>Request consultation <ArrowRight /></button></article>)}</div></> }
function Lawyers({ flash }: { flash: (x: string) => void }) { return <SmartLawyers flash={flash} /> }
