// @ts-nocheck
import { useEffect, useRef, useState } from 'react';
import { Scale, UserRound, BriefcaseBusiness, GraduationCap, ArrowRight, Search, Menu, X, Home, Bot, Users, BookOpen, Briefcase, CalendarDays, FileText, Bell, Send, ShieldCheck, Sparkles, Plus, Check, ChevronRight, Sun, Moon, Languages, MapPin, Mic, LockKeyhole, Landmark, Fingerprint, FileLock2 } from 'lucide-react';
import './App.css';
import './ai.css';
import './roles.css';
import './finder.css';
import './judgment.css';
import './dmsLanding.css';
import './roleThemes.css';
import { JUDGMENTS, CITIZEN_GUIDES, type Judgment, type CitizenGuide } from './data/judgments';
import { askGemini, type CaseContext } from './lib/gemini';
import { CaseGraph } from './components/CaseGraph';
import { CaseDossier } from './components/CaseDossier';
import { MyClientsView, MyRequestsView } from './components/ClientRequestViews';
import { DocumentAnalyzerView } from './components/DocumentAnalyzerView';
import { SEED_REQUESTS, timestampNow, uid, type ClientRequest, type CaseFileItem } from './data/clientRequests';
import { CASE_EXTRAS, buildStarterExtras } from './data/caseExtras';
import { StudentStudies, type StudyRecord, type QuizAttempt } from './components/StudentStudies';
import { type DmsSession } from './components/DmsLogin';
import { DMSWorkspace } from './components/DMSWorkspace';
import { SuryaLanding } from './components/SuryaLanding';
import { DigiLockerAuth } from './components/DigiLockerAuth';
import { DmsUniqueIdStep, LawyerBarIdStep } from './components/AuthFlows';
import { resolveSuiteUser } from './lib/auth';
import { SuiteAdminPanel } from './components/SuiteAdminPanel';
import { type DigiIdentity, type SuiteRole, type DmsRoleType } from './data/identityBindings';
import type { DmsSessionV2 } from './lib/session';

/* Map the new identity-based session onto the workspace's display-role shape. */
function toLegacyDms(s: DmsSessionV2): DmsSession {
  const map: Record<DmsRoleType, DmsSession['role']> = {
    super_admin: 'System Admin',
    department_admin: 'System Admin',
    investigating_officer: 'Investigating Officer',
    forensic_officer: 'Forensic Officer',
    legal_officer: 'Legal Department Officer',
    court_registrar: 'Court / Registrar Staff',
    records_compliance: 'Records / Compliance Officer',
  };
  const parts = s.fullName.replace(/^(Dr\.|Adv\.)\s+/i, '').split(' ').filter(Boolean);
  const shortName = parts.length >= 2 ? parts[0][0] + '. ' + parts[parts.length - 1] : s.fullName;
  return { name: shortName, role: map[s.role], jurisdiction: s.jurisdiction, department: s.department, officerId: s.officerId };
}

const STORAGE_KEY = 'surya-app-state-v1';
function loadSaved(): SavedState { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as SavedState; } catch { return {}; } }
type View = 'landing' | 'home' | 'chat' | 'cases' | 'library' | 'lawyers' | 'calendar' | 'clients' | 'requests' | 'docs' | 'studies' | 'dms-auth' | 'dms-id' | 'suite-auth' | 'lawyer-bar' | 'dms-workspace' | 'suite-admin';
const info = { citizen: { name: 'Citizen', icon: UserRound, color: 'orange', promise: 'Clear legal guidance, when you need it.' }, lawyer: { name: 'Lawyer', icon: BriefcaseBusiness, color: 'blue', promise: 'Organize cases. Work with clarity.' }, student: { name: 'Student', icon: GraduationCap, color: 'green', promise: 'Understand landmark cases, simply.' } } as const;
const nav = { citizen: [['Home', Home, 'home'], ['Ask S.U.R.Y.A.', Bot, 'chat'], ['Find a Lawyer', Users, 'lawyers'], ['My Requests', Check, 'requests'], ['Know Your Rights', BookOpen, 'library']], lawyer: [['Dashboard', Home, 'home'], ['My Cases', Briefcase, 'cases'], ['My Clients', Users, 'clients'], ['Document Analyzer', FileText, 'docs'], ['AI Case Assistant', Sparkles, 'chat'], ['Judgment Research', BookOpen, 'library'], ['Calendar & Reminders', CalendarDays, 'calendar']], student: [['Study Home', Home, 'home'], ['Case Library', BookOpen, 'library'], ['My Case Studies', FileText, 'studies'], ['Ask about a Case', Bot, 'chat']] } as const;
type SavedState = { role?: Role; view?: View; authed?: 'dms' | Role; dark?: boolean; cases?: CaseRecord[]; requests?: ClientRequest[]; caseDocs?: Record<string, CaseFileItem[]>; studyRecords?: StudyRecord[]; quizHistory?: QuizAttempt[]; librarySelectedId?: string | null; dmsSession?: DmsSession };
const SAVED = loadSaved();
/* Views that only an authenticated session may open. */
const DASH_VIEWS: View[] = ['home', 'chat', 'cases', 'library', 'lawyers', 'calendar', 'clients', 'requests', 'docs', 'studies'];
/* A dashboard is restored ONLY when that exact session actually authenticated:
   DigiLocker (+Unique ID) for the DMS, DigiLocker (+Bar ID) for the suite roles.
   Hand-edited storage therefore cannot open an officer's or an advocate's workspace. */
const initialRole: Role = SAVED.authed === 'lawyer' || SAVED.authed === 'student' ? SAVED.authed : 'citizen';
const initialView: View =
  SAVED.authed === 'dms' && SAVED.dmsSession && SAVED.view === 'dms-workspace' ? 'dms-workspace'
    : SAVED.authed && SAVED.authed === SAVED.role && SAVED.view && DASH_VIEWS.includes(SAVED.view) ? SAVED.view
      : 'landing';

export default function App() {
  const [role, setRole] = useState<Role>(initialRole), [view, setView] = useState<View>(initialView), [dark, setDark] = useState<boolean>(SAVED.dark ?? false), [open, setOpen] = useState(false), [toast, setToast] = useState(''), [aiCaseId, setAiCaseId] = useState<string | undefined>();
  const [dmsSession, setDmsSession] = useState<DmsSession | null>(SAVED.dmsSession ?? null);
  const [authDoor, setAuthDoor] = useState<'dms' | SuiteRole | null>(null);
  const [authed, setAuthed] = useState<'dms' | Role | null>(SAVED.authed ?? null);
  const [digiIdentity, setDigiIdentity] = useState<DigiIdentity | null>(null);
  const [cases, setCases] = useState<CaseRecord[]>(SAVED.cases?.length ? SAVED.cases : REAL_CASES);
  const [requests, setRequests] = useState<ClientRequest[]>(SAVED.requests ?? SEED_REQUESTS);
  const [caseDocs, setCaseDocs] = useState<Record<string, CaseFileItem[]>>(SAVED.caseDocs ?? {});
  const [studyRecords, setStudyRecords] = useState<StudyRecord[]>(SAVED.studyRecords ?? [
    { judgmentId: 'bacchan-singh', readAt: '16 Sep, 8:12 pm', timesRead: 3 },
    { judgmentId: 'virsa-singh', readAt: '15 Sep, 9:40 pm', timesRead: 2 },
    { judgmentId: 'lalita-kumari', readAt: '14 Sep, 7:05 pm', timesRead: 1 },
  ]);
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>(SAVED.quizHistory ?? []);
  const [librarySelectedId, setLibrarySelectedId] = useState<string | null>(SAVED.librarySelectedId ?? null);
  const [chatSeed, setChatSeed] = useState<string | null>(null);
  const flash = (s: string) => { setToast(s); setTimeout(() => setToast(''), 2400) };
  /* Keep everything (role, view, cases, chats, study history) alive across refreshes. */
  useEffect(() => {
    try {
      const lightDocs: Record<string, CaseFileItem[]> = {};
      Object.entries(caseDocs).forEach(([k, v]) => { lightDocs[k] = v.map(d => ({ ...d, dataUrl: undefined })); });
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ role, view: view === 'landing' ? undefined : view, dark, authed, cases, requests, caseDocs: lightDocs, studyRecords, quizHistory, librarySelectedId, dmsSession }));
    } catch { /* storage unavailable or full — in-memory demo state still works */ }
  }, [role, view, dark, authed, cases, requests, caseDocs, studyRecords, quizHistory, librarySelectedId, dmsSession]);
  const baseDocsFor = (caseId: string): CaseFileItem[] =>
    CASE_EXTRAS[caseId]?.caseFile ?? (() => {
      const c = cases.find(x => x.id === caseId);
      return c ? buildStarterExtras(c.title, c.description, c.date, c.priority).caseFile : [];
    })();
  const docsForCase = (caseId: string): CaseFileItem[] => caseDocs[caseId] ?? baseDocsFor(caseId);
  const addCaseDoc = (caseId: string, item: CaseFileItem) => {
    setCaseDocs(prev => ({ ...prev, [caseId]: [...(prev[caseId] ?? baseDocsFor(caseId)), item] }));
    flash(`Document “${item.name}” added to the case file.`);
  };
  const removeCaseDoc = (caseId: string, docId: string) => {
    setCaseDocs(prev => ({ ...prev, [caseId]: (prev[caseId] ?? baseDocsFor(caseId)).filter(x => x.id !== docId) }));
  };
  const addCase = (c: typeof REAL_CASES[0]) => { setCases(prev => [c, ...prev]); flash(`Case “${c.title}” created successfully.`); };
  const updateRequest = (id: string, patch: Partial<ClientRequest>) => setRequests(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  const acceptRequest = (id: string) => { const r = requests.find(x => x.id === id); updateRequest(id, { status: 'accepted', updatedAt: timestampNow(), demoThread: true }); if (r) flash(`Request from ${r.clientName} accepted. The conversation is open in My Clients.`); };
  const declineRequest = (id: string) => { const r = requests.find(x => x.id === id); updateRequest(id, { status: 'declined', updatedAt: timestampNow() }); if (r) flash(`Request from ${r.clientName} declined.`); };
  const sendMessage = (requestId: string, text: string, attachments: ClientRequest['messages'][0]['attachments']) => {
    setRequests(prev => prev.map(r => r.id === requestId
      ? { ...r, updatedAt: timestampNow(), messages: [...r.messages, { id: uid(), from: role === 'lawyer' ? 'lawyer' : 'client', text, at: timestampNow(), attachments }] }
      : r));
  };
  const sendRequestToLawyer = (lawyerName: string, issue: string, details: string, area: string) => {
    const req: ClientRequest = {
      id: uid(),
      clientName: 'Vikas Singh',
      clientInitials: 'VS',
      clientCity: 'Jaipur, Rajasthan',
      issue, details, area,
      status: 'pending',
      createdAt: timestampNow(),
      updatedAt: timestampNow(),
      lawyerName,
      messages: [{ id: uid(), from: 'client', text: details, at: timestampNow(), attachments: [] }],
    };
    setRequests(prev => [req, ...prev]);
    flash(`Request sent to ${lawyerName}. You will be notified when they respond.`);
    setView('requests');
  };
  if (view === 'dms-auth') return <DigiLockerAuth channel="pin" purpose="S.U.R.Y.A. Document Management System" onBack={() => setView('landing')} onVerified={id => { setDigiIdentity(id); setView('dms-id'); }} dark={dark} />;
  if (view === 'dms-id' && digiIdentity) return <DmsUniqueIdStep identity={digiIdentity} onBack={() => setView('dms-auth')} onDone={s => { setDmsSession(toLegacyDms(s)); setAuthed('dms'); setView('dms-workspace'); }} />;
  if (view === 'suite-auth' && authDoor && authDoor !== 'dms') return <DigiLockerAuth channel="otp" purpose={`S.U.R.Y.A. — ${authDoor.charAt(0).toUpperCase() + authDoor.slice(1)} Assistance`} onBack={() => setView('landing')} onVerified={id => {
    // Platform super-admin (SA-2026-0001) gets the Assistance Suite admin overview.
    if (id.phone === '919876500006') { setAuthed('dms'); setView('suite-admin'); return; }
    if (authDoor === 'lawyer') { setDigiIdentity(id); setView('lawyer-bar'); return; }
    resolveSuiteUser(id.phone, authDoor).then(r => {
      if (r.ok) { setRole(authDoor); setAuthed(authDoor); setView('home'); }
      else { flash(r.error); setView('landing'); }
    });
  }} dark={dark} />;
  if (view === 'lawyer-bar' && digiIdentity) return <LawyerBarIdStep identity={digiIdentity} onBack={() => setView('landing')} onDone={s => { setRole('lawyer'); setAuthed('lawyer'); setView('home'); flash(`Welcome, Advocate ${s.fullName.split(' ').slice(-1)[0]} — Bar ID ${s.barEnrollmentId} verified.`); }} />;
  if (view === 'dms-workspace' && dmsSession) return <DMSWorkspace session={dmsSession} onExit={() => { setDmsSession(null); setAuthed(null); setView('landing'); }} dark={dark} setDark={setDark} />;
  if (view === 'suite-admin') return <SuiteAdminPanel onBack={() => { setAuthed(null); setView('landing'); }} />;
  const missingPrereq = (view === 'dms-id' && !digiIdentity) || (view === 'dms-workspace' && !dmsSession)
    || (view === 'suite-auth' && !authDoor) || (view === 'lawyer-bar' && !digiIdentity);
  if (view === 'landing' || missingPrereq) return <SuryaLanding dark={dark} setDark={setDark} onDmsLogin={() => { setAuthDoor('dms'); setView('dms-auth'); }} onSuiteRole={r => { setAuthDoor(r); setView('suite-auth'); }} />;
  const openCaseAssistant = (caseId?: string) => { setAiCaseId(caseId); setView('chat'); };
  // Citizen quick options: carry the clicked scenario straight into the chat and auto-send it.
  const askScenario = (query: string) => { setChatSeed(query); setView('chat'); };
  // A student opening a judgment records it in My Case Studies.
  const openJudgmentForStudent = (judgmentId: string) => {
    if (role !== 'student') return;
    setStudyRecords(prev => {
      const existing = prev.find(r => r.judgmentId === judgmentId);
      if (existing) return prev.map(r => r.judgmentId === judgmentId ? { ...r, timesRead: r.timesRead + 1, readAt: timestampNow() } : r);
      return [{ judgmentId, readAt: timestampNow(), timesRead: 1 }, ...prev];
    });
  };
  const openJudgmentDeep = (judgmentId: string) => {
    openJudgmentForStudent(judgmentId);
    setLibrarySelectedId(judgmentId);
    setView('library');
  };
  return <div className={'app role-' + role + ' ' + (dark ? 'dark' : '')}><aside className={open ? 'open' : ''}><div className="brand"><Scale /> <b>S.U.R.Y.A.<small>Judicial assistance, unified</small></b><button className="close" onClick={() => setOpen(false)}><X /></button></div><p className="role-label">{info[role].name} SPACE</p><nav>{nav[role].map(([label, Icon, page]) => <button key={label} className={view === page ? 'active' : ''} onClick={() => { setView(page as View); setOpen(false) }}><Icon />{label}</button>)}</nav><div className="side-foot"><ShieldCheck />AI assists, it never decides.<button onClick={() => { setAuthed(null); setRole('citizen'); setView('landing'); flash('Signed out — DigiLocker re-authentication is required to reopen a dashboard.'); }}>Sign out <ArrowRight /></button></div></aside>{open && <div className="veil" onClick={() => setOpen(false)} />}<main><header><button className="menu" onClick={() => setOpen(true)}><Menu /></button><button className="back-home" onClick={() => setView('home')}><Home /> Dashboard</button><div className="top-search"><Search /><input placeholder="Search cases, laws, documents..." /></div><div className="top-actions"><button title="Language: English (हिन्दी coming soon in this build)" onClick={() => flash('English selected. Hindi interface arrives in the next build — voice input already supports हिन्दी in the assistant.')}><Languages /> EN</button><button onClick={() => setDark(!dark)}>{dark ? <Sun /> : <Moon />}</button><button onClick={() => flash('You have ' + cases.filter(c => c.daysLeft <= 7).length + ' upcoming reminders.')}><Bell /></button><span>VS</span></div></header><div className="content">{view === 'home' && <HomeView role={role} go={setView} flash={flash} cases={cases} onAddCase={addCase} onAskCaseAI={openCaseAssistant} docsFor={docsForCase} onAddDoc={addCaseDoc} onRemoveDoc={removeCaseDoc} onAskScenario={askScenario} />} {view === 'chat' && <GeminiChat role={role} cases={cases} selectedCaseId={aiCaseId} onSelectCase={setAiCaseId} seedQuery={chatSeed} onSeedConsumed={() => setChatSeed(null)} />} {view === 'cases' && <SmartCases role={role} flash={flash} go={setView} cases={cases} onAddCase={addCase} onAskCaseAI={openCaseAssistant} docsFor={docsForCase} onAddDoc={addCaseDoc} onRemoveDoc={removeCaseDoc} />} {view === 'calendar' && <CalendarView cases={cases} onAddCase={addCase} go={setView} flash={flash} onAskCaseAI={openCaseAssistant} docsFor={docsForCase} onAddDoc={addCaseDoc} onRemoveDoc={removeCaseDoc} />} {view === 'library' && <Library role={role} flash={flash} onReadJudgment={openJudgmentForStudent} selectedId={librarySelectedId} setSelectedId={setLibrarySelectedId} />} {view === 'lawyers' && <SmartLawyers flash={flash} onRequest={sendRequestToLawyer} />} {view === 'clients' && <MyClientsView requests={requests} onAccept={acceptRequest} onDecline={declineRequest} onSend={sendMessage} />} {view === 'requests' && <MyRequestsView requests={requests} onSend={sendMessage} onNew={() => setView('lawyers')} />} {view === 'docs' && <DocumentAnalyzerView cases={cases} flash={flash} />} {view === 'studies' && <StudentStudies records={studyRecords} history={quizHistory} onClearHistory={() => setQuizHistory([])} onRecordQuiz={a => setQuizHistory(prev => [a, ...prev])} onOpenJudgment={id => { setView('studies'); openJudgmentDeep(id); }} />}</div></main>{toast && <div className="toast"><Check /> {toast}</div>}</div>
}
function Landing({ role, setRole, start, dark, setDark, goDms }: { role: Role, setRole: (r: Role) => void, start: () => void, dark: boolean, setDark: (b: boolean) => void, goDms: () => void }) {
  return <div className={'landing dms-landing ' + (dark ? 'dark' : '')}>
    <div className="tricolor"><i /><i /><i /></div>
    <header className="gov-topbar">
      <div className="gov-topbar-left"><Landmark /> भारत सरकार · Government of India (Demo)</div>
      <div className="gov-topbar-right">
        <span className="gov-lang">English | हिन्दी</span>
        <button onClick={() => setDark(!dark)}>{dark ? '☀' : '☾'}</button>
      </div>
    </header>
    <div className="gov-emblem-strip">
      <div className="gov-emblem-brand">
        <div className="gov-chakra">☸</div>
        <div>
          <b>NyayaVault — Unified Legal &amp; Judicial Records Platform</b>
          <small>Ministry of Law and Justice (Demo) · National Informatics Centre style interface</small>
        </div>
      </div>
      <div className="gov-strip-links"><a>Home</a><a>Departments</a><a>RTI</a><a>Contact</a></div>
    </div>
    <section className="gov-hero">
      <div>
        <span className="gov-hero-kicker"><ShieldCheck /> SECURE DIGITAL DOCUMENT MANAGEMENT SYSTEM</span>
        <h1>One secure record, from the <em>first report</em> to the <em>final judgment</em>.</h1>
        <p>A unified document management and legal assistance platform for law enforcement, courts, legal departments and the public — with hash-chain integrity, role-based access control and a complete audit trail.</p>
        <div className="gov-hero-cta">
          <button className="gov-primary" onClick={goDms}><LockKeyhole /> Sign in to the Document Management System</button>
          <div className="gov-hero-badges">
            <span><ShieldCheck /> Role-based access + audit trail</span>
            <span><Fingerprint /> Blockchain hash integrity</span>
            <span><FileLock2 /> Encrypted case files</span>
          </div>
        </div>
      </div>
      <div className="gov-hero-visual">
        <div className="gov-vault"><LockKeyhole /></div>
        <small>Authorised personnel only · all activity logged</small>
      </div>
    </section>
    <section className="surya-band">
      <p className="surya-band-kicker">Public &amp; Professional Legal Assistance — powered by <b>S.U.R.Y.A.</b></p>
      <p className="surya-band-sub">Citizens need no login. Lawyers and students enter through their role card.</p>
      <div className="role-cards">{(Object.keys(info) as Role[]).map(r => { const d = info[r], Icon = d.icon; return <article className={'role-card ' + d.color + (role === r ? ' picked' : '')} key={r} onClick={() => setRole(r)}><div className="illustration"><Icon /><div>⚖</div></div><h2>I am a {d.name}</h2><p>{d.promise}</p><ul>{r === 'citizen' ? <><li>AI legal guidance</li><li>Find verified lawyers</li></> : r === 'lawyer' ? <><li>Intelligent case workspace</li><li>Private document analysis</li></> : <><li>Simple case summaries</li><li>Learn at your own pace</li></>}</ul><button onClick={start}>Continue <ArrowRight /></button></article> })}</div>
    </section>
    <footer className="gov-footer">
      <span>© 2026 · Demo prototype for presentation purposes</span>
      <span><ShieldCheck /> AI assists, it never decides · Website policies · Help · Contact NIC helpdesk</span>
    </footer>
  </div>;
}
const CITIZEN_RIGHTS = [
  { icon: '📝', title: 'Right to file an FIR', tag: 'CrPC § 154', desc: 'Police must register an FIR for any cognizable offence — refusal is itself actionable. Always take a free copy.' },
  { icon: '✉️', title: 'Legal notice received', tag: 'Reply in time', desc: 'Read it fully, keep the envelope, save proofs, and reply within the stated window — usually 15 to 30 days.' },
  { icon: '🛡️', title: 'If you are arrested', tag: 'Art. 22', desc: 'You must be told the grounds of arrest, may inform a relative or friend, and are entitled to free legal aid.' },
  { icon: '💳', title: 'Online fraud victim', tag: 'Golden hour', desc: 'Call 1930 or report on cybercrime.gov.in immediately — the sooner you report, the better the chance of freezing the money.' },
  { icon: '🧾', title: 'Consumer complaints', tag: 'CPA 2019', desc: 'Defective goods or poor service? File online at eDaakhil for refund, replacement or compensation from home.' },
  { icon: '🤝', title: 'Free legal aid', tag: 'Art. 39A', desc: 'Below the income limit, NALSA and your District Legal Services Authority provide a lawyer at no cost.' },
];
function HomeView({ role, go, flash, cases, onAddCase, onAskCaseAI, docsFor, onAddDoc, onRemoveDoc, onAskScenario }: { role: Role, go: (v: View) => void, flash: (s: string) => void, cases: CaseRecord[], onAddCase: (c: CaseRecord) => void, onAskCaseAI: (caseId?: string) => void, docsFor?: (caseId: string) => CaseFileItem[], onAddDoc?: (caseId: string, item: CaseFileItem) => void, onRemoveDoc?: (caseId: string, docId: string) => void, onAskScenario: (q: string) => void }) { if (role === 'lawyer') return <LawyerHome go={go} flash={flash} cases={cases} onAddCase={onAddCase} onAskCaseAI={onAskCaseAI} docsFor={docsFor} onAddDoc={onAddDoc} onRemoveDoc={onRemoveDoc} />; if (role === 'student') return <StudentHome go={go} flash={flash} />; return <CitizenHome go={go} flash={flash} onAskScenario={onAskScenario} /> }
function CitizenHome({ go, flash, onAskScenario }: { go: (v: View) => void, flash: (s: string) => void, onAskScenario: (q: string) => void }) { let situations: [string, string][] = [['Theft or lost item', 'My phone was stolen. What should I do first?'], ['Online fraud', 'I lost money to an online UPI fraud. What are my first steps?'], ['Cybercrime', 'Someone is harassing me on social media. How do I report this cybercrime?'], ['Property dispute', 'I have a property dispute with a neighbour over the boundary. What should I do?'], ['Consumer issue', 'I received a faulty product and the seller refuses a refund. How do I file a consumer complaint?'], ['Family matter', 'I need legal guidance on a family matter. Where do I start?']]; return <><div className="welcome"><div><em><Sparkles />YOUR LEGAL COMPANION</em><h1>Hello, Vikas <b>✦</b></h1><p>Tell us what happened. We will guide you through the next steps.</p></div><blockquote>“Justice is not just for the few, but for every citizen.”</blockquote></div><div className="split"><section className="panel"><h3><Bot /> How can we help today?</h3><p>Choose a situation or ask in your own words.</p><div className="situations">{situations.map(([label, query], i) => <button onClick={() => onAskScenario(query)} key={label} title={'Ask: ' + query}><span>{['◈', '⌁', '◉', '⌂', '◌', '♡'][i]}</span>{label}<ChevronRight /></button>)}</div><button className="ask" onClick={() => go('chat')}><Search />Describe your situation in your own words...<ArrowRight /></button></section><section className="panel steps"><div className="title"><h3>My Legal Steps</h3><button onClick={() => go('cases')}>View all <ArrowRight /></button></div><b>Phone theft report</b><p>3 of 5 steps completed</p><div className="bar"><i /></div>{['File a police complaint', 'Block your SIM card', 'Submit a CEIR request'].map((x, i) => <div className="step" key={x}><span>{i < 2 ? <Check /> : i + 1}</span>{x}</div>)}</section></div><div className="two"><section className="panel"><div className="title"><div><h3>Find the right lawyer</h3><p>Verified specialists near you</p></div><button onClick={() => go('lawyers')}>See all <ArrowRight /></button></div>{['Adv. Priya Sharma — Family Law', 'Adv. Arjun Mehta — Cyber Law', 'Adv. Neha Joshi — Property Law'].map((x, i) => <div className="person" key={x}><i>{['PS', 'AM', 'NJ'][i]}</i><div><b>{x}</b><small>★ 4.{9 - i} · {8 + i} years experience</small></div><button onClick={() => flash('Consultation request sent!')}>Connect</button></div>)}</section><section className="panel rights"><div className="title"><div><h3>Know your rights</h3><p>Plain-language explainers for everyday legal situations</p></div><button onClick={() => go('library')}>All guides <ArrowRight /></button></div><div className="rights-grid">{CITIZEN_RIGHTS.map(r => <button className="rights-card" key={r.title} onClick={() => go('library')}><span className="rights-ico">{r.icon}</span><b>{r.title}</b><p>{r.desc}</p><small>{r.tag}</small></button>)}</div></section></div><section className="panel helplines"><div className="title"><h3>Emergency &amp; helpline numbers</h3><small>Tap to call · available 24×7</small></div><div className="help-grid">{[['112', 'National emergency (police · fire · medical)'], ['100', 'Police control room'], ['181', 'Women helpline'], ['1098', 'Childline (CHILDLINE India)'], ['1930', 'Cyber & financial fraud'], ['14567', 'Senior citizen helpline']].map(([num, label]) => <a className="help-num" key={num} href={'tel:' + num}><b>{num}</b><small>{label}</small></a>)}</div></section></> }
const REAL_CASES = [
  {
    id: 'state-singh', title: 'State vs. R. Singh', ipc: 'IPC 302 – Murder', court: 'Sessions Court, Jaipur', date: '20 Sep 2026', daysLeft: 1, priority: 'HIGH', judge: 'Hon. Justice A.K. Mehta', status: 'Trial in Progress',
    description: 'The accused, Rajesh Singh, is charged under IPC Section 302 for the alleged murder of Sohan Lal on 12 January 2024. The prosecution has presented CCTV footage, a forensic report, and eyewitness testimony by Rajesh Meena. The defense claims alibi. Next hearing is for cross-examination of the forensic expert.',
    timeline: [{ label: 'FIR Filed', date: '12 Jan 2024', done: true }, { label: 'Charge Sheet', date: '5 Mar 2024', done: true }, { label: 'Witness Exam', date: '20 Apr 2026', done: true }, { label: 'Arguments', date: '10 Aug 2026', done: true }, { label: 'Next Hearing', date: '20 Sep 2026', done: false, active: true }, { label: 'Judgment', date: 'TBD', done: false }],
    evidence: ['CCTV Footage (Verified)', 'Forensic Report (Verified)', 'Eyewitness Statement – Rajesh Meena', 'Mobile Call Records', 'Site Photographs'],
    chartData: [65, 72, 58, 80, 75, 88, 70],
    graphSub: 'State vs. R. Singh · IPC 302',
    nodes: [
      { id: 'victim', label: 'Victim', sub: 'Sohan Lal', x: 90, y: 150, role: 'victim', info: 'Deceased; last seen near his residence on the evening of 12 Jan 2024.' },
      { id: 'accused', label: 'Accused', sub: 'R. Singh', x: 320, y: 80, role: 'suspect', info: 'Charged under IPC 302. The defense claims an alibi for the night of the incident.' },
      { id: 'witness', label: 'Witness', sub: 'Rajesh Meena', x: 550, y: 155, role: 'witness', info: 'Eyewitness testimony places the accused at the scene; cross-examination is pending.' },
      { id: 'incident', label: 'Incident', sub: '12 Jan 2024', x: 320, y: 240, role: 'incident', info: 'Alleged murder on 12 Jan 2024; the basis of the IPC 302 charge.' },
      { id: 'evidence', label: 'Evidence', sub: '4 verified files', x: 105, y: 335, role: 'evidence', info: 'CCTV footage and the forensic report are verified; call records and site photos are under review.' },
      { id: 'court', label: 'Court', sub: '20 Sep 2026', x: 450, y: 350, role: 'location', info: 'Sessions Court, Jaipur. Next hearing: cross-examination of the forensic expert.' },
      { id: 'cctv', label: 'CCTV clip', sub: 'Shop camera', x: 505, y: 62, role: 'evidence', info: 'Shop-camera footage recorded a person matching the accused\u2019s build at 21:14 hrs. 65B certificate pending.' },
      { id: 'statement', label: 'PW statement', sub: 'u/s 161 CrPC', x: 585, y: 262, role: 'evidence', info: 'Rajesh Meena\u2019s statement recorded under Section 161 CrPC; cross-examination pending at the next hearing.' },
    ],
    edges: [
      { from: 'victim', to: 'incident', label: 'victim of' },
      { from: 'accused', to: 'incident', label: 'charged with' },
      { from: 'witness', to: 'incident', label: 'saw' },
      { from: 'incident', to: 'evidence', label: 'supported by' },
      { from: 'incident', to: 'court', label: 'listed at' },
      { from: 'witness', to: 'statement', label: 'gave' },
      { from: 'witness', to: 'accused', label: 'identified' },
      { from: 'cctv', to: 'incident', label: 'recorded' },
      { from: 'cctv', to: 'accused', label: 'places at scene' },
      { from: 'accused', to: 'victim', label: 'prior enmity alleged', suspected: true },
      { from: 'evidence', to: 'court', label: 'filed with' },
      { from: 'accused', to: 'court', label: 'produced before' },
    ],
    graphTimeline: [
      { date: '12 Jan 2024', label: 'Incident occurred' },
      { date: '5 Mar 2024', label: 'Charge sheet filed' },
      { date: '20 Apr 2026', label: 'Witness examined' },
      { date: '20 Sep 2026', label: 'Next hearing' },
    ]
  },
  {
    id: 'meena-rajesh', title: 'Meena vs. Rajesh', ipc: 'CPC Order 39', court: 'District Court, Jaipur', date: '24 Sep 2026', daysLeft: 5, priority: 'MEDIUM', judge: 'Hon. Justice S.R. Gupta', status: 'Documents Pending',
    description: 'A civil property dispute between Ms. Meena Devi and Mr. Rajesh Kumar over a 2.4 acre land parcel in Sikar district. The plaintiff claims recorded ownership via registered sale deed (2019). The respondent disputes boundaries and alleges encroachment. 2 key documents remain unverified by the court registry.',
    timeline: [{ label: 'Plaint Filed', date: '3 Feb 2025', done: true }, { label: 'Notice Issued', date: '15 Mar 2025', done: true }, { label: 'Written Statement', date: '22 May 2025', done: true }, { label: 'Evidence Stage', date: '24 Sep 2026', done: false, active: true }, { label: 'Final Hearing', date: 'TBD', done: false }],
    evidence: ['Registered Sale Deed 2019', 'Patwari Records (Pending)', 'Survey Map (Pending)', 'Photographs of Boundary'],
    chartData: [40, 55, 50, 63, 58, 70, 65],
    graphSub: 'Meena vs. Rajesh · CPC Order 39',
    nodes: [
      { id: 'plaintiff', label: 'Plaintiff', sub: 'Meena Devi', x: 95, y: 130, role: 'victim', info: 'Claims recorded ownership of the 2.4 acre parcel via a registered 2019 sale deed.' },
      { id: 'respondent', label: 'Respondent', sub: 'Rajesh Kumar', x: 540, y: 130, role: 'suspect', info: 'Disputes the recorded boundaries and alleges encroachment on the parcel.' },
      { id: 'property', label: 'Property', sub: '2.4 Acres, Sikar', x: 318, y: 155, role: 'incident', info: 'Subject land parcel; boundaries are contested between the parties.' },
      { id: 'documents', label: 'Records', sub: '2 pending', x: 130, y: 330, role: 'evidence', info: 'Patwari records and the survey map remain unverified by the court registry.' },
      { id: 'court', label: 'Court', sub: 'District Court', x: 475, y: 340, role: 'location', info: 'District Court, Jaipur. The matter is at the evidence stage.' },
      { id: 'patwari', label: 'Patwari', sub: 'Sikar circle', x: 150, y: 45, role: 'witness', info: 'Revenue officer who maintains the land records; summons to issue after document verification.' },
      { id: 'survey', label: 'Survey map', sub: '2023 demarcation', x: 500, y: 45, role: 'evidence', info: 'Private demarcation map; conflicts with the respondent\u2019s report on the boundary stone position. Registry verification pending.' },
    ],
    edges: [
      { from: 'plaintiff', to: 'property', label: 'claims' },
      { from: 'respondent', to: 'property', label: 'disputes' },
      { from: 'property', to: 'documents', label: 'recorded in' },
      { from: 'property', to: 'court', label: 'listed at' },
      { from: 'patwari', to: 'documents', label: 'maintains' },
      { from: 'patwari', to: 'property', label: 'measured' },
      { from: 'survey', to: 'property', label: 'demarcates' },
      { from: 'survey', to: 'court', label: 'filed with' },
      { from: 'respondent', to: 'survey', label: 'relies on', suspected: true },
      { from: 'plaintiff', to: 'respondent', label: 'boundary dispute with', suspected: true },
      { from: 'plaintiff', to: 'court', label: 'filed plaint at' },
      { from: 'respondent', to: 'court', label: 'summoned by' },
    ],
    graphTimeline: [
      { date: '3 Feb 2025', label: 'Plaint filed' },
      { date: '15 Mar 2025', label: 'Notice issued' },
      { date: '22 May 2025', label: 'Written statement' },
      { date: '24 Sep 2026', label: 'Evidence stage hearing' },
    ]
  },
  {
    id: 'anita-citybank', title: 'Anita vs. City Bank', ipc: 'Consumer Act', court: 'Consumer Forum', date: '01 Oct 2026', daysLeft: 12, priority: 'LOW', judge: 'President, Forum', status: 'Under Review',
    description: 'Ms. Anita Sharma has filed a consumer complaint against City Bank Ltd. for unauthorized deduction of ₹48,000 from her savings account in March 2026. Despite written complaints and escalations, the bank has not refunded the amount. The case involves digital transaction records and bank correspondence.',
    timeline: [{ label: 'Complaint Filed', date: '10 Apr 2026', done: true }, { label: 'Bank Notice', date: '28 Apr 2026', done: true }, { label: 'Written Reply', date: '20 Jun 2026', done: true }, { label: 'Review', date: '01 Oct 2026', done: false, active: true }, { label: 'Order', date: 'TBD', done: false }],
    evidence: ['Bank Statement (March 2026)', 'Transaction Dispute Form', 'Email Correspondence (3 emails)', 'RBI Grievance Reference'],
    chartData: [30, 45, 38, 55, 52, 60, 58],
    graphSub: 'Anita vs. City Bank · Consumer Act',
    nodes: [
      { id: 'complainant', label: 'Complainant', sub: 'Anita Sharma', x: 90, y: 150, role: 'victim', info: 'Account holder disputing an unauthorized deduction of ₹48,000 in March 2026.' },
      { id: 'bank', label: 'Respondent', sub: 'City Bank Ltd.', x: 545, y: 150, role: 'suspect', info: 'Has not refunded the amount despite written complaints and escalations.' },
      { id: 'dispute', label: 'Dispute', sub: '₹48,000 deduction', x: 318, y: 240, role: 'incident', info: 'Unauthorized deduction from the savings account, raised as a consumer complaint.' },
      { id: 'digital', label: 'Evidence', sub: 'Digital Records', x: 320, y: 75, role: 'evidence', info: 'Bank statements and the transaction dispute form establish the deduction.' },
      { id: 'forum', label: 'Court', sub: 'Consumer Forum', x: 318, y: 360, role: 'location', info: 'Consumer Forum. The complaint is under review; order is pending.' },
      { id: 'ombudsman', label: 'RBI Ombudsman', sub: 'Reference taken', x: 100, y: 58, role: 'location', info: 'Complaint escalated to the RBI Integrated Ombudsman before approaching the Consumer Forum.' },
      { id: 'emails', label: 'Email trail', sub: '3 escalations', x: 560, y: 58, role: 'evidence', info: 'Three written escalation emails from March\u2013April; the bank replied once denying liability.' },
    ],
    edges: [
      { from: 'complainant', to: 'dispute', label: 'filed' },
      { from: 'bank', to: 'dispute', label: 'respondent in' },
      { from: 'dispute', to: 'digital', label: 'proven by' },
      { from: 'dispute', to: 'forum', label: 'listed at' },
      { from: 'dispute', to: 'ombudsman', label: 'escalated via' },
      { from: 'complainant', to: 'emails', label: 'wrote' },
      { from: 'emails', to: 'bank', label: 'notice to' },
      { from: 'digital', to: 'bank', label: 'issued by' },
      { from: 'digital', to: 'complainant', label: 'provided by' },
      { from: 'bank', to: 'forum', label: 'reply on record' },
      { from: 'complainant', to: 'ombudsman', label: 'reference taken' },
    ],
    graphTimeline: [
      { date: '10 Apr 2026', label: 'Complaint filed' },
      { date: '28 Apr 2026', label: 'Bank notice sent' },
      { date: '20 Jun 2026', label: 'Written reply received' },
      { date: '01 Oct 2026', label: 'Forum review' },
    ]
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
      { id: 'party', label: 'Party', sub: party, x: 95, y: 130, role: 'victim', info: 'Primary party in the matter. Update details as the case file develops.' },
      { id: 'accused', label: 'Matter', sub: form.priority, x: 320, y: 80, role: 'suspect', info: `Matter posture: ${form.priority} priority. Update as facts are verified.` },
      { id: 'witness', label: 'Counsel', sub: 'Your desk', x: 545, y: 130, role: 'witness', info: 'Handling counsel. Track evidence and hearing prep here.' },
      { id: 'incident', label: 'Case', sub: today, x: 320, y: 240, role: 'incident', info: 'Core matter opened on ' + today + '. Link verified facts to this node.' },
      { id: 'evidence', label: 'Evidence', sub: '2 files', x: 105, y: 335, role: 'evidence', info: 'Intake notes (draft) and client instructions currently on file.' },
      { id: 'court', label: 'Court', sub: displayDate, x: 450, y: 350, role: 'location', info: `Next hearing listed for ${displayDate}.` },
    ],
    edges: [
      { from: 'party', to: 'incident', label: 'party to' },
      { from: 'accused', to: 'incident', label: 'posture' },
      { from: 'witness', to: 'incident', label: 'counsel for' },
      { from: 'incident', to: 'evidence', label: 'supported by' },
      { from: 'incident', to: 'court', label: 'listed at' },
      { from: 'witness', to: 'court', label: 'appears at' },
      { from: 'witness', to: 'party', label: 'instructed by' },
      { from: 'witness', to: 'evidence', label: 'verifies' },
      { from: 'evidence', to: 'court', label: 'filed with' },
    ],
    graphTimeline: [
      { date: today, label: 'Case opened' },
      { date: displayDate, label: 'Next hearing' },
    ],
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

function LawyerHome({ go, flash, cases, onAddCase, onAskCaseAI, docsFor, onAddDoc, onRemoveDoc }: { go: (v: View) => void, flash: (s: string) => void, cases: CaseRecord[], onAddCase: (c: CaseRecord) => void, onAskCaseAI: (caseId?: string) => void, docsFor?: (caseId: string) => CaseFileItem[], onAddDoc?: (caseId: string, item: CaseFileItem) => void, onRemoveDoc?: (caseId: string, docId: string) => void }) {
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [graphCaseId, setGraphCaseId] = useState<string>(cases[0]?.id || '');
  const [showNew, setShowNew] = useState(false);
  const selected = cases.find(c => c.id === selectedCase);
  if (selected) return <CaseDossier caseData={selected} onBack={() => setSelectedCase(null)} onAskAI={onAskCaseAI} docs={docsFor?.(selected.id)} onAddDoc={onAddDoc} onRemoveDoc={onRemoveDoc} />;
  const activeCase = cases.find(c => c.id === graphCaseId) || cases[0];
  if (!activeCase) return <div className="panel"><p>No cases yet.</p><button className="primary" onClick={() => setShowNew(true)}><Plus />New case</button>{showNew && <NewCaseModal onClose={() => setShowNew(false)} onCreate={c => { onAddCase(c); setGraphCaseId(c.id); }} />}</div>;
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
        <CaseGraph key={activeCase.id} caseData={{ id: activeCase.id, title: activeCase.title, description: activeCase.description, nodes: activeCase.nodes, edges: activeCase.edges, timeline: activeCase.graphTimeline }} />
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
function StudentHome({ go, flash }: { go: (v: View) => void, flash: (s: string) => void }) { let topics = ['Criminal Law', 'Constitutional', 'Cyber Law', 'Property Law', 'Contract Law', 'Family Law']; return <><div className="welcome"><div><em className="green"><GraduationCap />YOUR LEGAL LEARNING SPACE</em><h1>Learn the law, <b>clearly.</b></h1><p>Explore landmark cases explained in language that makes sense.</p></div><div className="streak">🔥 <b>7 day streak</b><small>Keep going!</small></div></div><section className="panel"><div className="title"><div><h3>Explore by topic</h3><p>Start with what you are studying</p></div><button onClick={() => go('library')}>All topics <ArrowRight /></button></div><div className="topics">{topics.map((x, i) => <button onClick={() => go('library')} key={x}>⚖<b>{x}</b><small>{12 + i * 7} cases</small></button>)}</div></section><div className="two"><section className="panel reading"><span>CONSTITUTIONAL LAW</span><h2>Kesavananda Bharati<br />v. State of Kerala</h2><p>Understanding the Basic Structure Doctrine</p><button onClick={() => go('library')}>Resume case <ArrowRight /></button></section><section className="panel quiz"><Sparkles /><h3>Test your understanding</h3><p>Pick the cases you have studied and take an AI-generated quiz on the important points. Scores are saved so you can watch them climb.</p><button onClick={() => go('studies')}>Start a quiz from My Case Studies <ArrowRight /></button></section></div></> }
type Help = { title: string; now: string[]; docs: string[]; where: string; source: string };
function legalHelp(text: string): Help { let q = text.toLowerCase(); if (/phone|mobile|stolen|theft|lost/.test(q)) return { title: 'Phone theft or loss', now: ['Call your mobile operator to block the SIM.', 'File a police complaint with the place and time of loss.', 'Use the CEIR portal to request blocking of the device IMEI.'], docs: ['Government ID proof', 'Mobile number and IMEI / purchase invoice', 'Copy of police complaint'], where: 'Nearest police station, then the CEIR portal', source: 'CEIR / Department of Telecommunications' }; if (/fraud|upi|bank|scam|money|transaction/.test(q)) return { title: 'Online financial fraud', now: ['Call 1930 immediately to report the transaction.', 'Contact your bank or payment provider and request a freeze.', 'Preserve screenshots, transaction IDs, messages and call records.'], docs: ['Transaction ID and bank details', 'Screenshots / chats / URLs', 'Identity proof'], where: '1930 cyber fraud helpline and cybercrime.gov.in', source: 'National Cyber Crime Reporting Portal' }; if (/cyber|instagram|facebook|harass|blackmail/.test(q)) return { title: 'Cybercrime report', now: ['Do not delete messages, URLs, or screenshots.', 'Use the National Cyber Crime Reporting Portal.', 'If you feel unsafe, contact local police immediately.'], docs: ['Screenshots and profile links', 'Device / account details', 'Identity proof'], where: 'cybercrime.gov.in or your local cyber cell', source: 'National Cyber Crime Reporting Portal' }; if (/property|land|tenant|rent|house/.test(q)) return { title: 'Property or tenancy concern', now: ['Collect agreements, receipts, notices and ownership records.', 'Write down a timeline of events and all parties involved.', 'Consider a legal-aid clinic or property lawyer for document review.'], docs: ['Sale deed / rent agreement', 'Tax receipts and notices', 'Communication records'], where: 'District Legal Services Authority or a property-law specialist', source: 'National Legal Services Authority' }; return { title: 'General legal guidance', now: ['Write down a clear timeline of what happened.', 'Keep originals and copies of all messages and documents.', 'Use the relevant official authority or consult a qualified lawyer for advice specific to your facts.'], docs: ['Identity proof', 'Written timeline', 'Relevant notices, receipts, or communications'], where: 'Relevant local authority or District Legal Services Authority', source: 'National Legal Services Authority' } }
function SmartChat({ role }: { role: Role }) { const [text, setText] = useState(''), [question, setQuestion] = useState(''), [loading, setLoading] = useState(false), [listening, setListening] = useState(false), [voiceLang, setVoiceLang] = useState<'en-IN' | 'hi-IN'>('en-IN'); const help = question ? legalHelp(question) : null; const send = () => { if (!text.trim()) return; setLoading(true); setTimeout(() => { setQuestion(text); setText(''); setLoading(false) }, 550) }; const voice = () => { const Speech = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; if (!Speech) { alert('Voice input is supported in Chrome and Microsoft Edge.'); return } const r = new Speech(); r.lang = voiceLang; r.interimResults = true; setListening(true); r.onresult = (e: any) => setText(e.results[0][0].transcript); r.onerror = () => setListening(false); r.onend = () => setListening(false); r.start() }; const prompts = role === 'lawyer' ? ['Summarize the main arguments in this case', 'What evidence should I verify first?', 'Create a hearing preparation checklist'] : voiceLang === 'hi-IN' ? ['मेरा फोन चोरी हो गया है', 'मेरे साथ UPI फ्रॉड हुआ है', 'FIR क्या होती है?'] : ['My phone was stolen. What should I do?', 'I lost money in an online UPI fraud', 'What does an FIR mean?']; return <><div className="chat-head"><Bot /><div><em>S.U.R.Y.A. AI ASSISTANT · DEMO MODE</em><h1>{role === 'lawyer' ? 'Your case intelligence partner' : 'Describe your situation in your own words'}</h1><p>Answers are organized into practical next steps, documents, and reporting channels.</p></div></div><div className="smart-chat"><section className="panel chat-workspace">{!help && !loading && <div className="empty-ai"><Sparkles /><h2>What happened?</h2><p>Try a real-life scenario for the presentation. The assistant will classify it and prepare a guidance plan.</p></div>}{loading && <div className="thinking"><Sparkles /> S.U.R.Y.A. is organizing your legal guidance…</div>}{help && <div className="help-result"><div className="result-top"><span>AI CLASSIFICATION</span><h2>{help.title}</h2><small>Confidence: High · Based on keywords in your description</small></div><div className="result-grid"><article><b>1. What to do now</b>{help.now.map(x => <p key={x}><Check />{x}</p>)}</article><article><b>2. Documents to keep</b>{help.docs.map(x => <p key={x}><FileText />{x}</p>)}</article></div><div className="report-channel"><MapPin /><div><b>Where to report</b><p>{help.where}</p><small>Source: {help.source}</small></div><button onClick={() => window.print()}>Print plan</button></div><div className="disclaimer"><ShieldCheck />This is general information, not legal advice. A qualified professional should assess your specific situation.</div></div>}</section><aside className="prompt-panel"><h3>Presentation prompts</h3>{prompts.map(x => <button onClick={() => setText(x)} key={x}>{x}<ChevronRight /></button>)}<div><ShieldCheck /><b>Privacy-first</b><p>Demo data stays in your browser. Do not enter sensitive personal information.</p></div></aside></div><div className="composer"><button className="voice-language" title="Switch voice language" onClick={() => setVoiceLang(voiceLang === 'en-IN' ? 'hi-IN' : 'en-IN')}>{voiceLang === 'en-IN' ? 'EN' : 'हि'}</button><button className={'voice ' + (listening ? 'listening' : '')} title={'Speak in ' + (voiceLang === 'en-IN' ? 'English' : 'Hindi')} onClick={voice}><Mic /></button><input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder={listening ? (voiceLang === 'hi-IN' ? 'सुन रहा हूँ… बोलिए' : 'Listening… speak now') : role === 'lawyer' ? 'Ask about evidence, precedents, or hearing prep...' : (voiceLang === 'hi-IN' ? 'उदाहरण: मेरा फोन जयपुर में चोरी हो गया' : 'Example: My phone was stolen yesterday in Jaipur...')} /><button onClick={send}><Send /></button></div></> }
type ChatMessage = { role: 'user' | 'assistant'; text: string };
function GeminiChat({ role, cases, selectedCaseId, onSelectCase, seedQuery, onSeedConsumed }: { role: Role, cases: CaseRecord[], selectedCaseId?: string, onSelectCase: (caseId?: string) => void, seedQuery?: string | null, onSeedConsumed?: () => void }) {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState<'en-IN' | 'hi-IN'>('en-IN');
  const consumedSeedRef = useRef<string | null>(null);
  const send = async (override?: string) => {
    /* `override` is a suggested question from the prompt buttons. A button that calls
       onClick={send} would otherwise pass its MouseEvent in — guard against that. */
    const question = (typeof override === 'string' ? override : text).trim();
    if (!question || loading) return;
    setText('');
    setMessages(current => [...current, { role: 'user', text: question }]);
    setLoading(true);
    try {
      const answer = await askGemini(question, role, cases as CaseContext[], selectedCaseId);
      setMessages(current => [...current, { role: 'assistant', text: answer }]);
    } catch (error) {
      setMessages(current => [...current, { role: 'assistant', text: error instanceof Error ? error.message : 'Unable to contact the chatbot. Please try again.' }]);
    } finally { setLoading(false); }
  };
  // A quick option clicked on the dashboard arrives as seedQuery — send it immediately so the answer is ready when the chat opens.
  useEffect(() => {
    if (!seedQuery || consumedSeedRef.current === seedQuery) return;
    consumedSeedRef.current = seedQuery;
    onSeedConsumed?.();
    void send(seedQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedQuery]);
  const voice = () => { const Speech = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; if (!Speech) { alert('Voice input is supported in Chrome and Microsoft Edge.'); return; } const r = new Speech(); r.lang = voiceLang; r.interimResults = true; setListening(true); r.onresult = (e: any) => setText(e.results[0][0].transcript); r.onerror = () => setListening(false); r.onend = () => setListening(false); r.start(); };
  const prompts = role === 'lawyer'
    ? ['Summarize this case', 'What evidence should I verify first?', 'Create a hearing preparation checklist']
    : role === 'student'
      ? ['I want to study the top murder cases', 'Show me landmark cases about privacy', 'Which cases deal with electronic evidence?', 'Suggest cases to study on criminal procedure']
      : ['My phone was stolen. What should I do?', 'I lost money in an online UPI fraud', 'What does an FIR mean?'];
  const selected = cases.find(c => c.id === selectedCaseId);
  return <><div className="chat-head"><Bot /><div><em>S.U.R.Y.A. AI ASSISTANT · CHATBOT</em><h1>{role === 'lawyer' ? 'Your case intelligence partner' : 'Describe your situation in your own words'}</h1><p>{role === 'lawyer' && selected ? `Asking about: ${selected.title}` : 'Chatbot-generated information should be reviewed by a legal professional.'}</p></div></div><div className="smart-chat"><section className="panel chat-workspace">{messages.length === 0 && !loading && <div className="empty-ai"><Sparkles /><h2>How can I help?</h2><p>{role === 'lawyer' ? 'Ask about the selected case, evidence, a hearing, or all of your case records.' : 'Ask a legal-information question in your own words.'}</p></div>}<div className="chat-messages">{messages.map((message, index) => <article className={'chat-message ' + message.role} key={index}><b>{message.role === 'user' ? 'You' : 'S.U.R.Y.A.'}</b><p>{message.text}</p></article>)}{loading && <div className="thinking"><Sparkles /> The chatbot is preparing your response…</div>}</div></section><aside className="prompt-panel">{role === 'lawyer' && <label className="case-context"><b>Case context</b><select value={selectedCaseId || ''} onChange={e => onSelectCase(e.target.value || undefined)}><option value="">All my cases</option>{cases.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label>}<h3>Try asking <small>· tap to send</small></h3>{prompts.map(x => <button onClick={() => send(x)} key={x}>{x}<ChevronRight /></button>)}<div><ShieldCheck /><b>Privacy-first</b><p>Do not enter sensitive personal information. Chatbot responses are assistance, not legal advice.</p></div></aside></div><div className="composer"><button className="voice-language" title="Switch voice language" onClick={() => setVoiceLang(voiceLang === 'en-IN' ? 'hi-IN' : 'en-IN')}>{voiceLang === 'en-IN' ? 'EN' : 'हि'}</button><button className={'voice ' + (listening ? 'listening' : '')} title="Voice input" onClick={voice}><Mic /></button><input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder={listening ? 'Listening… speak now' : role === 'lawyer' ? 'Ask about this case, all your cases, evidence, or hearing prep...' : 'Ask S.U.R.Y.A. anything...'} /><button disabled={loading} onClick={() => send()} aria-label="Send question"><Send /></button></div></>;
}
function SmartCases({ role, flash, go, cases, onAddCase, onAskCaseAI, docsFor, onAddDoc, onRemoveDoc }: { role: Role, flash: (x: string) => void, go: (v: View) => void, cases: CaseRecord[], onAddCase: (c: CaseRecord) => void, onAskCaseAI: (caseId?: string) => void, docsFor: (caseId: string) => CaseFileItem[], onAddDoc: (caseId: string, item: CaseFileItem) => void, onRemoveDoc: (caseId: string, docId: string) => void }) {
  return <Cases role={role} flash={flash} go={go} cases={cases} onAddCase={onAddCase} onAskCaseAI={onAskCaseAI} docsFor={docsFor} onAddDoc={onAddDoc} onRemoveDoc={onRemoveDoc} />;
}
function Cases({ role, flash, go, cases = [], onAddCase, onAskCaseAI, docsFor, onAddDoc, onRemoveDoc }: { role: Role, flash: (x: string) => void, go?: (v: View) => void, cases?: CaseRecord[], onAddCase?: (c: CaseRecord) => void, onAskCaseAI?: (caseId?: string) => void, docsFor?: (caseId: string) => CaseFileItem[], onAddDoc?: (caseId: string, item: CaseFileItem) => void, onRemoveDoc?: (caseId: string, docId: string) => void }) {
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState('');
  const selected = cases.find(c => c.id === selectedCase);
  if (role === 'lawyer' && selected) return <CaseDossier caseData={selected} onBack={() => setSelectedCase(null)} onAskAI={onAskCaseAI || (() => go?.('chat'))} docs={docsFor?.(selected.id)} onAddDoc={onAddDoc} onRemoveDoc={onRemoveDoc} />;
  let list = role === 'lawyer'
    ? [...cases].sort(byPriority).filter(c => !search.trim() || (c.title + ' ' + c.status + ' ' + c.ipc + ' ' + c.court).toLowerCase().includes(search.toLowerCase())).map(c => ({ id: c.id, name: c.title, sub: c.ipc + ' · ' + c.court + ' · Hearing ' + c.date, status: c.status, priority: c.priority }))
    : (role === 'citizen' ? ['Phone theft report', 'Consumer complaint', 'Property documentation'] : ['Constitutional law notes', 'Criminal law collection', 'Cybercrime research']).map((n, i) => ({ id: n, name: n, sub: 'Saved for later', status: i === 0 ? 'In progress' : i === 1 ? 'Review needed' : 'Saved' }));
  return <>
    <div className="heading"><div><em>{role === 'lawyer' ? 'CASE MANAGEMENT' : role === 'citizen' ? 'MY PROGRESS' : 'MY STUDY SPACE'}</em><h1>{role === 'lawyer' ? 'My Cases' : role === 'citizen' ? 'Your legal journey' : 'Bookmarks & notes'}</h1><p>{role === 'lawyer' ? 'Search your matters and open the full dossier — network graph, timeline and case file.' : 'Everything you need, organized in one secure place.'}</p></div>
      <button className="primary" onClick={() => role === 'lawyer' ? setShowNew(true) : flash('Saved successfully.')}><Plus />{role === 'lawyer' ? 'New case' : 'Add new'}</button>
    </div>
    <section className="panel table">
      <div className="table-search"><Search /><input placeholder={role === 'lawyer' ? 'Search by case, statute, court or status...' : 'Search...'} value={search} onChange={e => setSearch(e.target.value)} /></div>
      {list.map((x) => <div className="row hearing-clickable" key={x.id} onClick={() => { if (role === 'lawyer') setSelectedCase(x.id); else flash(`${x.name} opened.`) }}><FileText /><div><b>{x.name}</b><small>{x.sub}</small></div>{x.priority && <span className={'pq-badge ' + x.priority.toLowerCase()}>{x.priority}</span>}<span>{x.status}</span><button type="button"><ChevronRight /></button></div>)}
      {list.length === 0 && <p className="table-empty">No cases match “{search}”. Try a different keyword.</p>}
    </section>
    {showNew && onAddCase && <NewCaseModal onClose={() => setShowNew(false)} onCreate={c => { onAddCase(c); setSelectedCase(c.id); }} />}
  </>
}
function CalendarView({ cases, onAddCase, go, flash, onAskCaseAI, docsFor, onAddDoc, onRemoveDoc }: { cases: CaseRecord[], onAddCase: (c: CaseRecord) => void, go: (v: View) => void, flash: (s: string) => void, onAskCaseAI: (caseId?: string) => void, docsFor: (caseId: string) => CaseFileItem[], onAddDoc: (caseId: string, item: CaseFileItem) => void, onRemoveDoc: (caseId: string, docId: string) => void }) {
  const [showNew, setShowNew] = useState(false);
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const selected = cases.find(c => c.id === selectedCase);
  if (selected) return <CaseDossier caseData={selected} onBack={() => setSelectedCase(null)} onAskAI={onAskCaseAI} docs={docsFor(selected.id)} onAddDoc={onAddDoc} onRemoveDoc={onRemoveDoc} />;
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
function matchJudgment(j: Judgment, q: string) {
  if (!q.trim()) return true;
  const s = q.toLowerCase();
  return [j.title, j.shortTitle, j.citation, j.court, j.area, j.bench, j.summary, String(j.year), j.domain, ...j.tags, ...j.statutes].join(' ').toLowerCase().includes(s);
}
function matchGuide(g: CitizenGuide, q: string) {
  if (!q.trim()) return true;
  const s = q.toLowerCase();
  return [g.title, g.area, g.summary, ...g.tags].join(' ').toLowerCase().includes(s);
}
function JudgmentDetailPage({ judgment, onBack }: { judgment: Judgment, onBack: () => void }) {
  return (
    <div className="judgment-portal">
      <div className="judgment-portal-top">
        <div className="jp-emblem"><span>⚖</span><div><b>Supreme Court of India</b><small>JUDGMENT RESEARCH ARCHIVE · S.U.R.Y.A.</small></div></div>
      </div>
      <div className="jp-tricolor"><i /><i /><i /></div>
      <div className="jp-body">
        <button className="jp-back" onClick={onBack}>← Back to Judgment Research</button>
        <div className="jp-court">IN THE SUPREME COURT OF INDIA</div>
        <h2 className="jp-caption">{judgment.title}</h2>
        <p className="jp-citation">{judgment.citation} · Decided on {judgment.date}</p>
        <table className="jp-meta">
          <tbody>
            <tr><th>Court</th><td>{judgment.court}</td></tr>
            <tr><th>Date of Judgment</th><td>{judgment.date}</td></tr>
            <tr><th>Citation</th><td>{judgment.citation}</td></tr>
            <tr><th>Bench</th><td>{judgment.bench}</td></tr>
            <tr><th>Subject Area</th><td>{judgment.area}</td></tr>
            <tr><th>Statutes / Provisions</th><td>{judgment.statutes.join('; ')}</td></tr>
          </tbody>
        </table>
        <div className="jp-section"><h4>1. Brief Summary</h4><p>{judgment.summary}</p></div>
        <div className="jp-section"><h4>2. Facts of the Case</h4><p>{judgment.facts}</p></div>
        <div className="jp-section"><h4>3. Issues Before the Court</h4><ol>{judgment.issues.map((x, i) => <li key={i}>{x}</li>)}</ol></div>
        <div className="jp-section"><h4>4. Holding</h4><div className="jp-holding"><p>{judgment.holding}</p></div></div>
        <div className="jp-section"><h4>5. Ratio Decidendi</h4><p>{judgment.ratio}</p></div>
        <div className="jp-section"><h4>6. Significance</h4><p>{judgment.significance}</p></div>
        <div className="jp-footer">
          <span>Educational summary for research assistance only. Not an official certified copy. Always verify against the authentic judgment text.</span>
          <a href={judgment.sourceUrl} target="_blank" rel="noreferrer">View source reference ↗</a>
        </div>
      </div>
    </div>
  );
}
function GuideDetailPage({ guide, onBack }: { guide: CitizenGuide, onBack: () => void }) {
  return (
    <div className="judgment-portal guide-portal">
      <div className="judgment-portal-top">
        <div className="jp-emblem"><span>🇮🇳</span><div><b>Citizen Legal Guidance</b><small>KNOW YOUR RIGHTS · S.U.R.Y.A.</small></div></div>
      </div>
      <div className="jp-tricolor"><i /><i /><i /></div>
      <div className="jp-body">
        <button className="jp-back" onClick={onBack}>← Back to guides</button>
        <div className="jp-court">PUBLIC LEGAL INFORMATION</div>
        <h2 className="jp-caption">{guide.title}</h2>
        <p className="jp-citation">{guide.area}</p>
        <div className="jp-section"><h4>Overview</h4><p>{guide.summary}</p></div>
        <div className="jp-section"><h4>What to do</h4><ol>{guide.steps.map((x, i) => <li key={i}>{x}</li>)}</ol></div>
        <div className="jp-section"><h4>Documents to keep</h4><ol>{guide.docs.map((x, i) => <li key={i}>{x}</li>)}</ol></div>
        <div className="jp-section"><h4>Where to go</h4><div className="jp-holding"><p>{guide.where}</p></div></div>
        <div className="jp-footer"><span>General information only — not legal advice. Consult a qualified professional for your specific facts.</span></div>
      </div>
    </div>
  );
}
function Library({ role, flash, onReadJudgment, selectedId, setSelectedId }: { role: Role, flash: (x: string) => void, onReadJudgment?: (judgmentId: string) => void, selectedId: string | null, setSelectedId: (id: string | null) => void }) {
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState('All');
  const [year, setYear] = useState('Any');
  const [court, setCourt] = useState('All');
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

  const domains = ['All', ...Array.from(new Set(JUDGMENTS.map(j => j.domain)))];
  const years = ['Any', ...Array.from(new Set(JUDGMENTS.map(j => j.year))).sort((a, b) => b - a).map(String)];
  const courts = ['All', ...Array.from(new Set(JUDGMENTS.map(j => j.court)))];
  const judgments = JUDGMENTS.filter(j =>
    matchJudgment(j, query)
    && (domain === 'All' || j.domain === domain)
    && (year === 'Any' || String(j.year) === year)
    && (court === 'All' || j.court === court));
  const guides = CITIZEN_GUIDES.filter(g => matchGuide(g, query));
  const hasFilters = domain !== 'All' || year !== 'Any' || court !== 'All';
  const filterSummary = [domain !== 'All' ? domain : null, year !== 'Any' ? year : null, court !== 'All' ? court : null].filter(Boolean).join(' · ');
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
        <div className="lib-filters">
          <div className="lib-chips">
            {domains.map(d => <button key={d} className={domain === d ? 'on' : ''} onClick={() => setDomain(d)}>{d}</button>)}
          </div>
          <div className="lib-selects">
            <label>Year
              <select value={year} onChange={e => setYear(e.target.value)}>
                {years.map(y => <option key={y} value={y}>{y === 'Any' ? 'Any year' : y}</option>)}
              </select>
            </label>
            <label>Court
              <select value={court} onChange={e => setCourt(e.target.value)}>
                {courts.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            {hasFilters && <button className="lib-clear" onClick={() => { setDomain('All'); setYear('Any'); setCourt('All'); }}>Clear filters</button>}
          </div>
        </div>
        <p className="results-count">Showing {judgments.length} landmark judgment{judgments.length === 1 ? '' : 's'}{filterSummary ? ` · ${filterSummary}` : ''} · Real Indian courts, educational summaries</p>
        <div className="cards">
          {judgments.length === 0 && <div className="library-empty">No judgments matched your search. Try “privacy”, “FIR”, “377”, or a year like “2017”.</div>}
          {judgments.map((j, i) => (
            <article key={j.id}>
              <div className={'cover c' + (i % 3)}><Scale /></div>
              <em>{j.domain}</em>
              <p className="card-cite">{j.citation}</p>
              <h3>{j.shortTitle}</h3>
              <p className="card-meta">{j.court} · {j.year} · {j.area}</p>
              <p>{j.summary}</p>
              <button onClick={() => { onReadJudgment?.(j.id); setSelectedId(j.id); }}>Read <ArrowRight /></button>
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
const LAWYERS = [
  { name: 'Vikas Singh', area: 'Criminal defence & murder trials', areaKey: 'criminal', city: 'Jaipur', state: 'Rajasthan', exp: 14, rating: 4.9, reviews: 152, fee: '₹3,500', courts: 'Sessions Court, Rajasthan High Court', languages: 'English · Hindi' },
  { name: 'Karan Sethi', area: 'Criminal defence & appeals', areaKey: 'criminal', city: 'Jaipur', state: 'Rajasthan', exp: 12, rating: 4.8, reviews: 96, fee: '₹4,000', courts: 'Sessions Court, High Court', languages: 'English · Hindi' },
  { name: 'Priya Sharma', area: 'Family & civil law', areaKey: 'family', city: 'Jaipur', state: 'Rajasthan', exp: 8, rating: 4.7, reviews: 61, fee: '₹2,000', courts: 'Family Court, District Court', languages: 'English · Hindi' },
  { name: 'Devika Rathore', area: 'Criminal defence & bail matters', areaKey: 'criminal', city: 'Jodhpur', state: 'Rajasthan', exp: 9, rating: 4.6, reviews: 44, fee: '₹2,500', courts: 'Sessions Court, High Court', languages: 'Hindi · English' },
  { name: 'Arjun Mehta', area: 'Cybercrime & technology law', areaKey: 'cyber', city: 'Jaipur', state: 'Rajasthan', exp: 11, rating: 4.8, reviews: 88, fee: '₹3,000', courts: 'Cyber Cells, District Courts', languages: 'English · Hindi' },
  { name: 'Aditi Rao', area: 'Consumer & banking disputes', areaKey: 'consumer', city: 'Bengaluru', state: 'Karnataka', exp: 7, rating: 4.5, reviews: 39, fee: '₹2,200', courts: 'Consumer Commissions', languages: 'English' },
  { name: 'Neha Joshi', area: 'Property disputes & tenancy', areaKey: 'property', city: 'Delhi', state: 'Delhi', exp: 9, rating: 4.6, reviews: 57, fee: '₹3,200', courts: 'Delhi District Courts, High Court', languages: 'English · Hindi' },
  { name: 'Rahul Verma', area: 'Family & mediation', areaKey: 'family', city: 'Lucknow', state: 'Uttar Pradesh', exp: 10, rating: 4.4, reviews: 52, fee: '₹1,800', courts: 'Family Courts', languages: 'Hindi · English' },
  { name: 'Sana Qureshi', area: 'Cybercrime & data protection', areaKey: 'cyber', city: 'Delhi', state: 'Delhi', exp: 6, rating: 4.5, reviews: 31, fee: '₹2,800', courts: 'Cyber Cells, District Courts', languages: 'English · Hindi' },
  { name: 'Mahesh Choudhary', area: 'Property & land revenue matters', areaKey: 'property', city: 'Sikar', state: 'Rajasthan', exp: 15, rating: 4.7, reviews: 73, fee: '₹2,400', courts: 'Revenue Boards, District Courts', languages: 'Hindi · Rajasthani' },
] as const;

const ISSUE_KEYWORDS: { key: string; label: string; re: RegExp }[] = [
  { key: 'criminal', label: 'Criminal / murder', re: /murder|kill|assault|theft|snatch|robber|stab|shot|criminal|fir|cogniz|302|arrest|bail/i },
  { key: 'cyber', label: 'Cybercrime / fraud', re: /cyber|online|upi|otp|hack|fraud|scam|impersonat|social media|data|privacy/i },
  { key: 'property', label: 'Property / land', re: /property|land|plot|tenant|rent|evict|possession|boundary|deed|encroach|lease/i },
  { key: 'consumer', label: 'Consumer / banking', re: /consumer|refund|bank|insurance|defect|service|warranty|emi|deduct/i },
  { key: 'family', label: 'Family / matrimonial', re: /divorce|custody|maintenance|alimony|marriage|dowry|domestic|guardian|adoption/i },
];

function detectIssueKey(text: string): string | null {
  return ISSUE_KEYWORDS.find(k => k.re.test(text))?.key ?? null;
}

function SmartLawyers({ flash, onRequest }: { flash: (x: string) => void, onRequest: (lawyerName: string, issue: string, details: string, area: string) => void }) {
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [area, setArea] = useState('');
  const [typeKey, setTypeKey] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'experience' | 'fee'>('rating');
  const [asking, setAsking] = useState<{ name: string; area: string } | null>(null);
  const [issue, setIssue] = useState('');
  const [details, setDetails] = useState('');

  // The issue text doubles as a smart matcher: it pre-filters lawyers by case type.
  const issueKey = detectIssueKey(issue);
  const effectiveType = typeKey || issueKey || '';

  let visible = LAWYERS.filter(p =>
    (!city || p.city === city)
    && (!state || p.state === state)
    && (!area || p.area.toLowerCase().includes(area.toLowerCase()))
    && (!effectiveType || p.areaKey === effectiveType));
  visible = [...visible].sort((a, b) =>
    sortBy === 'rating' ? b.rating - a.rating
      : sortBy === 'experience' ? b.exp - a.exp
        : parseInt(a.fee.replace(/\D/g, '')) - parseInt(b.fee.replace(/\D/g, '')));

  return <><div className="heading"><div><em>VERIFIED LEGAL PROFESSIONALS</em><h1>Find the right lawyer</h1><p>Filter by case type, city and state — then sort by rating, experience or fee. Requests go straight to the advocate's inbox.</p></div></div>
    <div className="finder smart-finder"><Search /><input value={area} onChange={e => setArea(e.target.value)} placeholder="Practice area, e.g. murder, cyber, property..." /><select value={city} onChange={e => setCity(e.target.value)}><option value="">All cities</option>{Array.from(new Set(LAWYERS.map(p => p.city))).map(x => <option key={x}>{x}</option>)}</select><select value={state} onChange={e => setState(e.target.value)}><option value="">All states</option>{Array.from(new Set(LAWYERS.map(p => p.state))).map(x => <option key={x}>{x}</option>)}</select><button onClick={() => flash(`${visible.length} verified lawyers found.`)}>Search</button></div>
    <div className="type-chips">
      <button className={effectiveType === '' ? 'on' : ''} onClick={() => setTypeKey('')}>All case types</button>
      {ISSUE_KEYWORDS.map(k => <button key={k.key} className={effectiveType === k.key ? 'on' : ''} onClick={() => setTypeKey(k.key)}>{k.label}</button>)}
    </div>
    <div className="lawyer-sort">
      <label>Sort by
        <select value={sortBy} onChange={e => setSortBy(e.target.value as 'rating' | 'experience' | 'fee')}>
          <option value="rating">Top rating</option>
          <option value="experience">Most experienced</option>
          <option value="fee">Lowest fee</option>
        </select>
      </label>
      {issue.trim() && issueKey && <span className="lawyer-match"><Sparkles width={12} /> Your description matched “{ISSUE_KEYWORDS.find(k => k.key === issueKey)?.label}” — showing specialists first.</span>}
      <span className="results-count">{visible.length} advocate{visible.length === 1 ? '' : 's'} found</span>
    </div>
    <div className="cards lawyer-cards">{visible.map((p) => <article key={p.name} className={issueKey && p.areaKey === issueKey ? 'best-match' : ''}><div className="face">{p.name.split(' ').map(w => w[0]).join('')}</div><span className="verified">✓ Verified</span><h3>Adv. {p.name}</h3><p>{p.area}</p><small>📍 {p.city}, {p.state} · {p.exp}+ yrs · {p.fee} consult</small><strong>★ {p.rating} <i>({p.reviews} reviews)</i></strong><small className="lawyer-courts">{p.courts} · {p.languages}</small><button onClick={() => { setAsking({ name: p.name, area: p.area }); setIssue(''); setDetails(''); }}>Request consultation <ArrowRight /></button></article>)}</div>
    {visible.length === 0 && <div className="library-empty">No advocates match these filters. Clear a filter or try a nearby city.</div>}
    {asking && <div className="modal-veil" onClick={() => setAsking(null)}><form className="modal-card" onClick={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); if (!issue.trim()) return; onRequest(asking.name, issue.trim(), details.trim() || issue.trim(), asking.area); setAsking(null); }}><div className="modal-head"><h3><Users /> Request · Adv. {asking.name}</h3><button type="button" className="modal-x" onClick={() => setAsking(null)}><X /></button></div><p className="modal-sub">Describe your issue. Adv. {asking.name} will see it in their intake inbox and can accept to start a conversation.</p><label>Your issue *<input value={issue} onChange={e => setIssue(e.target.value)} placeholder="e.g. Murder trial defence for a family member in Jaipur" required /></label><label>Details<textarea value={details} onChange={e => setDetails(e.target.value)} rows={3} placeholder="What happened, key dates, what you need help with…" /></label><div className="modal-actions"><button type="button" className="ghost" onClick={() => setAsking(null)}>Cancel</button><button type="submit" className="primary"><Send /> Send request</button></div></form></div>  }</>;
}