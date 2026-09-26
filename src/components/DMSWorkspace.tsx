import { useEffect, useMemo, useState } from 'react';
import { Archive, ArrowLeft, Briefcase, Check, ChevronDown, ChevronRight, Clock3, Database, Download, Eye, FileSearch, FileText, Fingerprint, FolderClosed, Gavel, History, KeyRound, Link, LockKeyhole, Menu, Network, Plus, Search, Share2, ShieldAlert, ShieldCheck, Upload, UserCog, Users, X } from 'lucide-react';
import './DMSWorkspace.css';
import { getBridgeAccessEvents } from '../data/bridgeAudit';
import { anchorDocumentVersion } from '../lib/anchor';
import { RoleDashboard } from './DmsDashboards';
import { EvidenceModule } from './DmsEvidence';
import { VersionHistoryPanel } from './DmsVersioning';
import { DmsAssistant } from './DmsAssistant';
import { ProfileView } from './DmsProfile';
import { CaseGraph, type GraphCase } from './CaseGraph';
import type { DmsSession } from './DmsLogin';
import { appendBlock, ensureGenesis, getChain, sha256Hex, simulateTamper, repairChain, resetLedger, verifyChain, type LedgerBlock, type ChainVerification } from '../lib/blockchain';
import { DMS_CASES, caseById, docsForCase, type DmsDocument, type DmsCase, type AccessRequest, type AccessEvent } from '../data/dmsCases';
export type { DmsDocument };

export type DmsRole = 'Investigating Officer' | 'Forensic Officer' | 'Court / Registrar Staff' | 'Legal Department Officer' | 'Records / Compliance Officer' | 'System Admin';
export type DmsPage = 'profile' | 'dashboard' | 'cases' | 'repository' | 'evidence' | 'case' | 'upload' | 'access' | 'audit' | 'integrity' | 'ledger' | 'sharing' | 'search' | 'compliance' | 'admin';
export type Audit = { id:string; at:string; actor:string; action:string; target:string; department:string };
export type CustodyEvent = { id:string; at:string; from:string; to:string; reason:string; blockIndex:number };
export type EvidenceItem = { id:string; evId:string; caseId:string; type:string; description:string; collectedBy:string; collectedAt:string; location:string; custodian:string; status:'In custody'|'Under examination'|'With court'|'Returned'; integrity:'Verified'|'Pending'|'Failed'; hash:string; custody:CustodyEvent[] };

const seedEvidence:EvidenceItem[]=[
 {id:'ev1',evId:'EV-2026-00312',caseId:'CR/124/2026',type:'Mobile phone',description:'Black smartphone seized from accused; IMEI recorded.',collectedBy:'SI R. Sharma',collectedAt:'12 Jan 2026 · 11:42',location:'Evidence Room, Jaipur Police',custodian:'SI R. Sharma',status:'In custody',integrity:'Verified',hash:'—',custody:[{id:'c1',at:'12 Jan 2026 · 11:42',from:'—',to:'SI R. Sharma',reason:'Collected at scene',blockIndex:0}]},
 {id:'ev2',evId:'EV-2026-00313',caseId:'CR/124/2026',type:'CCTV hard drive',description:'Shop CCTV drive covering 21:00–22:00 hrs on the night of incident.',collectedBy:'SI R. Sharma',collectedAt:'13 Jan 2026 · 09:15',location:'Forensic Lab, Jaipur',custodian:'Dr. R. Iyer',status:'Under examination',integrity:'Verified',hash:'—',custody:[{id:'c2',at:'13 Jan 2026 · 09:15',from:'—',to:'SI R. Sharma',reason:'Collected from shop owner',blockIndex:0},{id:'c3',at:'13 Jan 2026 · 14:35',from:'SI R. Sharma',to:'Dr. R. Iyer',reason:'Forensic examination',blockIndex:0}]},
 {id:'ev3',evId:'EV-2026-00314',caseId:'CR/124/2026',type:'Document set',description:'Recovery memo and seizure list attested by witnesses.',collectedBy:'SI R. Sharma',collectedAt:'12 Jan 2026 · 12:10',location:'Court record room',custodian:'Registrar A. Kapoor',status:'With court',integrity:'Verified',hash:'—',custody:[{id:'c4',at:'12 Jan 2026 · 12:10',from:'—',to:'SI R. Sharma',reason:'Collected at scene',blockIndex:0},{id:'c5',at:'05 Feb 2026 · 10:00',from:'SI R. Sharma',to:'Registrar A. Kapoor',reason:'Produced before court',blockIndex:0}]},
 {id:'ev4',evId:'EV-2026-00290',caseId:'CV/081/2026',type:'Boundary stone sample',description:'Sample from contested boundary stone no. 7, Sikar parcel.',collectedBy:'Court commissioner',collectedAt:'18 Jul 2026 · 10:30',location:'Registry custody',custodian:'Registrar A. Kapoor',status:'With court',integrity:'Verified',hash:'—',custody:[{id:'c6',at:'18 Jul 2026 · 10:30',from:'—',to:'Court commissioner',reason:'Collected during commission',blockIndex:0},{id:'c7',at:'20 Jul 2026 · 09:00',from:'Court commissioner',to:'Registrar A. Kapoor',reason:'Deposited with registry',blockIndex:0}]},
];

const pages:{id:DmsPage;label:string;icon:any}[]=[
  {id:'dashboard',label:'DMS Dashboard',icon:Database},{id:'cases',label:'Active Cases',icon:Briefcase},{id:'repository',label:'Document Repository',icon:FolderClosed},{id:'evidence',label:'Evidence & Custody',icon:Archive},{id:'upload',label:'Upload & Digitize',icon:Upload},{id:'access',label:'Access Control',icon:KeyRound},{id:'audit',label:'Audit Trail',icon:History},{id:'integrity',label:'Integrity & Verification',icon:Fingerprint},{id:'ledger',label:'Integrity Ledger',icon:Link},{id:'sharing',label:'Secure Sharing',icon:Share2},{id:'search',label:'Search & Retrieval',icon:FileSearch},{id:'compliance',label:'Compliance & Retention',icon:Archive},{id:'admin',label:'Admin Panel',icon:UserCog},
];
/* Least-privilege module access — each role sees only the modules its row of the
   permission matrix allows. Production enforces this with RLS; here it is enforced
   in the UI so the demo never shows a role a module it cannot legally open. */
const ALLOWED_PAGES:Record<DmsRole,DmsPage[]>={
  'Investigating Officer':['dashboard','cases','case','repository','evidence','upload','audit','integrity','ledger','sharing','search','compliance'],
  'Forensic Officer':['dashboard','cases','case','repository','evidence','upload','audit','integrity','ledger','search'],
  'Court / Registrar Staff':['dashboard','cases','case','repository','upload','access','audit','integrity','ledger','sharing','search','compliance'],
  'Legal Department Officer':['dashboard','cases','case','repository','upload','access','audit','integrity','ledger','sharing','search','compliance'],
  'Records / Compliance Officer':['dashboard','cases','case','repository','access','audit','integrity','ledger','sharing','search','compliance','admin'],
  'System Admin':['dashboard','cases','case','repository','evidence','upload','access','audit','integrity','ledger','sharing','search','compliance','admin'],
};
const now=()=>new Date().toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});

export function DMSWorkspace({session,onExit}:{session?:DmsSession|null;onExit:()=>void}){
 const initialRole=(session?.role as DmsRole)||'Investigating Officer';
 const [role]=useState<DmsRole>(initialRole),[page,setPage]=useState<DmsPage>('dashboard');
 const [docs,setDocs]=useState<DmsDocument[]>(()=>[...docsForCase('CR/124/2026'),...docsForCase('CV/081/2026'),...docsForCase('CY/042/2026')]);
 const [audit,setAudit]=useState<Audit[]>([{id:'a7',at:'19 Sep 2026 · 12:14',actor:'SI R. Sharma',action:'Uploaded document',target:'FIR_124_2026.pdf',department:'Jaipur Police'},{id:'a6',at:'19 Sep 2026 · 11:50',actor:'SI R. Sharma',action:'Registered evidence with chain of custody',target:'Mobile handset EV-2026-00312',department:'Jaipur Police'},{id:'a5',at:'19 Sep 2026 · 10:58',actor:'SI R. Sharma',action:'Digitized FIR and ran OCR verification',target:'FIR_124_2026.pdf',department:'Jaipur Police'},{id:'a4',at:'19 Sep 2026 · 10:12',actor:'SI R. Sharma',action:'Opened case file',target:'CR/124/2026',department:'Jaipur Police'},{id:'a1',at:'19 Sep 2026 · 11:38',actor:'Dr. R. Iyer',action:'Verified document',target:'Forensic_Report_17.pdf',department:'Forensic Lab'},{id:'a2',at:'19 Sep 2026 · 11:02',actor:'Dr. R. Iyer',action:'Uploaded document',target:'CCTV_Footage_Certificate.pdf',department:'Forensic Lab'},{id:'a3',at:'19 Sep 2026 · 10:27',actor:'Registrar A. Kapoor',action:'Granted read-only access',target:'CR/124/2026',department:'Court Registry'}]);
 const [evidence,setEvidence]=useState<EvidenceItem[]>(seedEvidence);
 const [selectedCase,setSelectedCase]=useState('CR/124/2026');
 const [mobile,setMobile]=useState(false),[toast,setToast]=useState('');
 /* Access control: which cases this officer may open. Non-admin roles are limited
    to their assigned caseload; System Admin may enter any case and approves
    cross-case access requests. */
 const [accessRequests,setAccessRequests]=useState<AccessRequest[]>([
  {id:'ar1',requester:'Dr. R. Iyer',requesterId:'FO-2026-0451',requesterRole:'Forensic Officer',caseId:'CV/081/2026',reason:'Soil sample comparison from the Sikar parcel may connect with exhibits seized in CR/124/2026; need the demarcation survey map.',status:'pending',at:'19 Sep 2026 · 12:05'},
 ]);
 const [grants,setGrants]=useState<Record<string,string[]>>(()=>({
   'Investigating Officer':['CR/124/2026'],
   'Forensic Officer':['CR/124/2026'],
   'Court / Registrar Staff':['CR/124/2026','CV/081/2026'],
   'Legal Department Officer':['CR/124/2026','CY/042/2026'],
   'Records / Compliance Officer':['CR/124/2026','CV/081/2026','CY/042/2026'],
   'System Admin':['CR/124/2026','CV/081/2026','CY/042/2026'],
 }));
 /* Document access history: who opened what, when — visible to the admin. */
 const [accessHistory,setAccessHistory]=useState<AccessEvent[]>([
  {id:'h1',at:'19 Sep 2026 · 11:52',actor:'Registrar A. Kapoor',actorRole:'Court / Registrar Staff',caseId:'CR/124/2026',document:'Charge_Sheet_Draft.pdf',action:'opened'},
  {id:'h2',at:'19 Sep 2026 · 11:41',actor:'Dr. R. Iyer',actorRole:'Forensic Officer',caseId:'CR/124/2026',document:'Forensic_Report_17.pdf',action:'opened'},
  {id:'h3',at:'19 Sep 2026 · 11:38',actor:'Adv. K. Sharma',actorRole:'Public Prosecutor',caseId:'CR/124/2026',document:'FIR_124_2026.pdf',action:'verified'},
  {id:'h4',at:'19 Sep 2026 · 10:20',actor:'SI R. Sharma',actorRole:'Investigating Officer',caseId:'CR/124/2026',document:'FIR_124_2026.pdf',action:'opened'},
  {id:'h5',at:'18 Sep 2026 · 17:02',actor:'Adv. Vikram Rao',actorRole:'S.U.R.Y.A. lawyer (read-only)',caseId:'CR/124/2026',document:'Charge_Sheet_Draft.pdf',action:'opened',detail:'Permissioned cross-system read via Assistance Suite'},
 ]);
 const [graphCaseId,setGraphCaseId]=useState<string|null>(null);
 const myCases=grants[role]||[];
 const canOpenCase=(caseId:string)=>role==='System Admin'||myCases.includes(caseId);
 const openCase=(caseId:string)=>{ if(!canOpenCase(caseId)){flash('Access denied — '+caseId+' is outside your assigned caseload. Send an access request instead.');return;} setSelectedCase(caseId);setPage('case'); };
 const flash=(x:string)=>{setToast(x);setTimeout(()=>setToast(''),2400)};
 const deptFor=(r:DmsRole)=>r.includes('Court')?'Court Registry':r.includes('Legal')?'Legal Department':r.includes('Records')?'Records & Compliance':r.includes('Admin')?'Platform Administration':r.includes('Forensic')?'Forensic Lab':'Jaipur Police';
 const log=(action:string,target:string)=>setAudit(x=>[{id:crypto.randomUUID(),at:now(),actor:role,action,target,department:deptFor(role)},...x]);
 const logAccess=(caseId:string,document:string,action:AccessEvent['action'],detail?:string)=>{setAccessHistory(x=>[{id:crypto.randomUUID(),at:now(),actor:session?.name||role,actorRole:role,caseId,document,action,detail},...x]);};
 const submitAccessRequest=(caseId:string,reason:string)=>{setAccessRequests(x=>[{id:crypto.randomUUID(),requester:session?.name||role,requesterId:session?.officerId||'—',requesterRole:role,caseId,reason,status:'pending',at:now()},...x]);logAccess(caseId,'—','requested',reason);flash('Access request sent for '+caseId+'. The System Admin will review it.');};
 const decideAccessRequest=(id:string,approve:boolean)=>{const req=accessRequests.find(r=>r.id===id);if(!req)return;setAccessRequests(x=>x.map(r=>r.id===id?{...r,status:approve?'approved':'rejected',decidedBy:session?.name||role,decidedAt:now()}:r));if(approve){setGrants(g=>({...g,[req.requesterRole]:[...(g[req.requesterRole]||[]),req.caseId]}));}
  setAudit(x=>[{id:crypto.randomUUID(),at:now(),actor:session?.name||role,action:approve?'Approved cross-case access request':'Rejected cross-case access request',target:req.caseId+' · '+req.requester,department:'Platform Administration'},...x]);flash((approve?'Access granted to ':'Request rejected for ')+req.requester+' → '+req.caseId);};
 const goDashboard=()=>setPage('dashboard');
 /* Role scoping: the sidebar only lists permitted modules, and any direct jump to a
    forbidden module (stale state, hand-edited storage) is bounced back to the dashboard. */
 const allowedPages=ALLOWED_PAGES[role]||ALLOWED_PAGES['System Admin'];
 const visiblePages=pages.filter(x=>allowedPages.includes(x.id));
 useEffect(()=>{if(page!=='profile'&&!allowedPages.includes(page))setPage('dashboard')},[page,role]);
 useEffect(()=>{ensureGenesis(session?.name||'Platform Administration',session?.officerId||'AD-2026-0001')},[]);
 const upload=async(name:string,type:string,sign:boolean)=>{const realHash=await sha256Hex(name+'|'+selectedCase+'|'+now()+'|'+crypto.randomUUID());const doc:DmsDocument={id:crypto.randomUUID(),name,type,caseId:selectedCase,department:deptFor(role),uploadedBy:session?.name||role,uploadedAt:now(),status:'Pending verification',version:1,hash:realHash,signed:sign,legalHold:false,sharedWithSurya:false};setDocs(x=>[doc,...x]);const anchored=await anchorDocumentVersion({docRef:name,caseRef:selectedCase,actor:session?.name||role,actorRole:role});if(!anchored.ok)flash('Registered locally — anchoring will retry when the backend is reachable.');await appendBlock({action:'DOCUMENT_REGISTERED',actor:session?.name||role,actorId:session?.officerId||'—',caseId:selectedCase,documentName:name,payload:realHash});log('Uploaded & classified document',name+' · '+selectedCase);flash('Document digitized, SHA-256 hashed, and anchored '+(anchored.demo?'to the demo ledger':'on Polygon Amoy')+'.');setPage('repository')};
 const setHold=(id:string)=>{setDocs(x=>x.map(d=>d.id===id?{...d,legalHold:!d.legalHold}:d));const d=docs.find(x=>x.id===id);if(d){log(d.legalHold?'Released legal hold':'Applied legal hold',d.name);appendBlock({action:d.legalHold?'LEGAL_HOLD_RELEASED':'LEGAL_HOLD_APPLIED',actor:session?.name||role,actorId:session?.officerId||'—',caseId:d.caseId,documentName:d.name,payload:'hold|'+d.name+'|'+Date.now()})}};
 const share=(id:string)=>{setDocs(x=>x.map(d=>d.id===id?{...d,sharedWithSurya:true}:d));const d=docs.find(x=>x.id===id);if(d){logAccess(d.caseId,d.name,'shared','Time-bound read-only share');log('Created expiring redacted share',d.name);appendBlock({action:'SHARE_CREATED',actor:session?.name||role,actorId:session?.officerId||'—',caseId:d.caseId,documentName:d.name,payload:'share|'+d.name+'|72h'})}flash('Read-only share created. Expires in 72 hours.');};
 const registerEvidence=async(e:Omit<EvidenceItem,'id'|'custody'|'hash'|'integrity'>)=>{const blk=await appendBlock({action:'EVIDENCE_TRANSFER',actor:session?.name||role,actorId:session?.officerId||'—',caseId:e.caseId,documentName:e.evId+' ('+e.type+')',payload:'register|'+e.evId+'|'+e.type+'|'+e.collectedBy});const item:EvidenceItem={...e,id:crypto.randomUUID(),hash:blk.hash.slice(0,16)+'…',integrity:'Verified',custody:[{id:crypto.randomUUID(),at:e.collectedAt,from:'—',to:e.collectedBy,reason:'Collected & registered',blockIndex:blk.index}]};setEvidence(x=>[item,...x]);log('Registered evidence',e.evId);flash('Evidence registered and anchored to the integrity ledger.')};
 const transferEvidence=async(id:string,to:string,reason:string)=>{const ev=evidence.find(x=>x.id===id);if(!ev)return;const blk=await appendBlock({action:'EVIDENCE_TRANSFER',actor:session?.name||role,actorId:session?.officerId||'—',caseId:ev.caseId,documentName:ev.evId+' ('+ev.type+')',payload:'transfer|'+ev.evId+'|'+ev.custodian+'->'+to+'|'+reason});setEvidence(x=>x.map(e=>e.id===id?{...e,custodian:to,custody:[...e.custody,{id:crypto.randomUUID(),at:now(),from:e.custodian,to,reason,blockIndex:blk.index}]}:e));log('Evidence custody transfer',ev.evId+' → '+to);flash('Custody transfer recorded on the integrity ledger.')};
 const visibleEvidence=evidence.filter(e=>role==='System Admin'||role==='Records / Compliance Officer'||myCases.includes(e.caseId));
 return <div className="dms-app"><aside className={mobile?'dms-side show':'dms-side'}><div className="dms-brand"><div><LockKeyhole/></div><b>S.U.R.Y.A.<small>Secure DMS · Unified platform</small></b><button onClick={()=>setMobile(false)}><X/></button></div><label className="dept-label">{session?`${session.name.toUpperCase()} · ${session.role}`:'ACTIVE PLATFORM ROLE'}</label><nav><button className={page==='profile'?'active':''} onClick={()=>{setPage('profile');setMobile(false)}}><UserCog/>My Service Details</button>{visiblePages.map(x=>{const I=x.icon;return <button key={x.id} className={page===x.id?'active':''} onClick={()=>{setPage(x.id);setMobile(false)}}><I/>{x.label}</button>})}</nav><div className="dms-side-note"><ShieldCheck/>Demo controls simulate RBAC, integrity, and audit logging.<button onClick={onExit}><ArrowLeft/>Open Assistance Suite</button></div></aside>{mobile&&<div className="dms-scrim" onClick={()=>setMobile(false)}/>}<main><header className="dms-header"><button className="dms-menu" onClick={()=>setMobile(true)}><Menu/></button><div><span>S.U.R.Y.A. · SECURE DIGITAL RECORD</span><b>{pages.find(x=>x.id===page)?.label}</b></div><div className="dms-head-actions"><span><ShieldCheck/> {session?`${session.name} · ${session.department||'Demo'} · Encrypted workspace`:'Encrypted demo workspace'}</span><button onClick={onExit}>S.U.R.Y.A. Suite <ArrowLeft/></button></div></header><div className="dms-content">{page==='profile'&&<ProfileView session={session} onBack={goDashboard}/>}{page==='dashboard'&&<RoleDashboard docs={docs} audit={audit} setPage={setPage} role={role} sessionName={session?.name}/>} {page==='cases'&&<ActiveCases role={role} docs={docs} evidence={visibleEvidence} goBack={goDashboard} openCase={openCase} canOpenCase={canOpenCase} onRequest={submitAccessRequest} openGraph={setGraphCaseId}/>} {page==='repository'&&<Repository docs={docs} goBack={goDashboard} openCase={openCase} canOpenCase={canOpenCase} onRequest={submitAccessRequest} openGraph={setGraphCaseId}/>} {page==='evidence'&&<EvidenceModule goBack={goDashboard} session={session} evidence={visibleEvidence} onRegister={registerEvidence} onTransfer={transferEvidence} openLedger={()=>setPage('ledger')}/>} {page==='case'&&<CaseWorkspace session={session} role={role} docs={docs.filter(d=>d.caseId===selectedCase)} caseData={caseById(selectedCase)} evidence={evidence.filter(e=>e.caseId===selectedCase)} setPage={setPage} share={share} log={log} setDocs={setDocs} flash={flash} logAccess={logAccess} canOpenCase={canOpenCase} onRequest={submitAccessRequest}/>} {page==='upload'&&<UploadDigitize goBack={goDashboard} onUpload={upload} targetCase={selectedCase}/>} {page==='access'&&<AccessControl goBack={goDashboard} role={role} log={log} flash={flash}/>} {page==='audit'&&<AuditTrail goBack={goDashboard} audit={audit}/>} {page==='integrity'&&<Integrity goBack={goDashboard} session={session} docs={docs} log={log} flash={flash}/>} {page==='ledger'&&<LedgerExplorer goBack={goDashboard} flash={flash}/>} {page==='sharing'&&<Sharing goBack={goDashboard} docs={docs} share={share}/>} {page==='search'&&<SemanticSearch goBack={goDashboard} docs={docs} openCase={openCase} log={log} canOpenCase={canOpenCase}/>} {page==='compliance'&&<Compliance goBack={goDashboard} docs={docs} setHold={setHold}/>} {page==='admin'&&<Admin goBack={goDashboard} role={role} flash={flash} session={session} accessRequests={accessRequests} decideAccessRequest={decideAccessRequest} accessHistory={accessHistory}/>}</div></main>{toast&&<div className="dms-toast"><Check/>{toast}</div>}
 {graphCaseId&&<GraphModal caseId={graphCaseId} onClose={()=>setGraphCaseId(null)}/>}
 {session&&<DmsAssistant ctx={{role:session.role,officer:session.name,jurisdiction:session.jurisdiction,caseIds:myCases,documents:docs.filter(d=>canOpenCase(d.caseId)).map(d=>({name:d.name,type:d.type,caseId:d.caseId,status:d.status,version:d.version,signed:d.signed,legalHold:d.legalHold,department:d.department})),auditCount:audit.length,ledgerBlocks:getChain().length,evidence:visibleEvidence.map(e=>({evId:e.evId,type:e.type,custodian:e.custodian,status:e.status,integrity:e.integrity})),recentAudit:audit.slice(0,6).map(a=>({action:a.action,target:a.target,actor:a.actor,at:a.at}))}} onOpenCase={openCase}/>}</div>
}

function Kpi({icon:Icon,n,label,tone}:{icon:any;n:any;label:string;tone:string}){return <article className={'dms-kpi '+tone}><Icon/><div><b>{n}</b><span>{label}</span></div></article>}

/* ---------- Active Cases: the officer's caseload desk ---------- */
function ActiveCases({role,docs,evidence,goBack,openCase,canOpenCase,onRequest,openGraph}:{role:DmsRole;docs:DmsDocument[];evidence:EvidenceItem[];goBack:()=>void;openCase:(id:string)=>void;canOpenCase:(id:string)=>boolean;onRequest:(caseId:string,reason:string)=>void;openGraph:(caseId:string)=>void}){
 const myCaseIds=role==='System Admin'?DMS_CASES.map(c=>c.caseId):DMS_CASES.map(c=>c.caseId).filter(id=>canOpenCase(id));
 const workloadCases=role==='System Admin'?DMS_CASES:DMS_CASES.filter(c=>myCaseIds.includes(c.caseId));
 /* Other platform cases: graph stays visible, documents locked until approved. */
 const otherCases=DMS_CASES.filter(c=>!myCaseIds.includes(c.caseId));
 return <><div className="dms-page-head with-button"><div><button className="dms-back" onClick={goBack}><ArrowLeft/>Back to Dashboard</button><span>YOUR CASELOAD · CASE-ID INDEXED</span><h1>Active Cases</h1><p>Every case carries a unique case ID. Open a case to reach its graph, documents, evidence and timeline in one workspace.</p></div></div>
 <section className="cases-grid">{workloadCases.map(c=>{
   const cdocs=docs.filter(d=>d.caseId===c.caseId);
   const cev=evidence.filter(e=>e.caseId===c.caseId);
   const allowed=canOpenCase(c.caseId);
   return <article className="dms-panel case-card" key={c.caseId}>
     <div className="case-card-head"><span className={'pq-badge '+c.priority.toLowerCase()}>{c.priority}</span><h3>{c.title}</h3><code className="case-chip">{c.caseId}</code></div>
     <p className="case-card-meta">{c.statute} · {c.court} · stage: {c.stage}</p>
     <div className="case-card-stats"><span><FileText/>{cdocs.length} documents</span><span><Archive/>{cev.length} evidence</span><span><Clock3/>hearing in {c.daysLeft}d</span></div>
     <div className="case-card-actions">
       <button className="primary" onClick={()=>openCase(c.caseId)} disabled={!allowed} title={allowed?'Open the full case workspace':'Not in your caseload — use Request access'}><Eye/>{allowed?'Open case workspace':'No access'}</button>
       <button onClick={()=>openGraph(c.caseId)}><Network/>Graph</button>
       {!allowed&&<button onClick={()=>{const r=window.prompt('Describe why you need access to '+c.caseId+' (shown to the System Admin):');if(r&&r.trim())onRequest(c.caseId,r.trim());}}><KeyRound/>Request access</button>}
     </div>
   </article>;})}</section>
 {otherCases.length>0&&<section className="dms-panel" style={{marginTop:'14px'}}>
   <h3><KeyRound/>Other cases on the platform <small>graph visible · documents locked</small></h3>
   {otherCases.map(c=><div className="audit-row" key={c.caseId}>
     <b>{c.title}<small style={{display:'block',fontWeight:400,opacity:.6}}>{c.court} · {c.stage}</small></b>
     <span><code style={{fontSize:'10px'}}>{c.caseId}</code></span>
     <span style={{fontSize:'10px',flex:1,minWidth:'120px'}}>{c.statute} · hearing {c.nextHearing}</span>
     <span style={{display:'flex',gap:'6px'}}>
       <button onClick={()=>openGraph(c.caseId)} title="Graph is open to every role; documents stay locked" style={{fontSize:'9px',padding:'4px 8px',borderRadius:'6px',border:'1px solid var(--line)',background:'transparent',color:'inherit',cursor:'pointer'}}>View graph</button>
       <button onClick={()=>{const r=window.prompt('Describe why you need access to '+c.caseId+' (shown to the System Admin):');if(r&&r.trim())onRequest(c.caseId,r.trim());}} style={{fontSize:'9px',padding:'4px 8px',borderRadius:'6px',border:'1px solid var(--line)',background:'transparent',color:'inherit',cursor:'pointer'}}>Request access</button>
     </span>
   </div>)}
 </section>}
 </>;
}

/* ---------- Case graph modal (works for any case, any role) ---------- */
export function GraphModal({caseId,onClose}:{caseId:string;onClose:()=>void}){
 const c=caseById(caseId);
 if(!c)return null;
 const gc:GraphCase={id:c.caseId,title:c.title,description:c.description,nodes:c.graph.nodes,edges:c.graph.edges,timeline:c.timeline.map(t=>({date:t.date,label:t.label}))};
 return <div className="modal-scrim" onClick={onClose}><div className="dms-graph-modal" onClick={e=>e.stopPropagation()}>
   <div className="dms-graph-head"><div><small>CASE RELATIONSHIP GRAPH · {c.caseId}</small><h3>{c.title}</h3></div><button onClick={onClose}><X/></button></div>
   <div className="dms-graph-body"><CaseGraph caseData={gc}/></div>
   <p className="dms-graph-note"><Network/> The relationship graph is readable by every role — even without document access — because it contains no document contents.</p>
 </div></div>;
}

/* ---------- Repository: case list first, then the case's documents ---------- */
function Repository({docs,openCase,goBack,canOpenCase,onRequest,openGraph}:{goBack:()=>void;docs:DmsDocument[];openCase:(id:string)=>void;canOpenCase:(id:string)=>boolean;onRequest:(caseId:string,reason:string)=>void;openGraph:(caseId:string)=>void}){
 const [query,setQuery]=useState('');
 const [stage,setStage]=useState('');
 const results=DMS_CASES.filter(c=>(!query||(c.title+c.caseId+c.statute).toLowerCase().includes(query.toLowerCase()))&&(!stage||c.stage===stage));
 return <><div className="dms-page-head with-button"><div><button className="dms-back" onClick={goBack}><ArrowLeft/>Back to Dashboard</button><span>SECURE REPOSITORY · ORGANIZED BY CASE</span><h1>Document Repository</h1><p>Documents live inside their case files. Search a unique case ID (e.g. CR/124/2026) and open the case to reach every related document.</p></div></div>
 <section className="repo-toolbar"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by case ID, title or statute — e.g. CR/124/2026"/><select value={stage} onChange={e=>setStage(e.target.value)}><option value="">All stages</option><option>Trial — cross-examination</option><option>Evidence stage</option><option>Under review</option></select></section>
 <section className="repo-cases">{results.map(c=>{
   const allowed=canOpenCase(c.caseId);
   const cdocs=docs.filter(d=>d.caseId===c.caseId);
   return <article className={'dms-panel repo-case-card'+(allowed?'':' locked')} key={c.caseId}>
     <div className="repo-case-top"><code className="case-chip">{c.caseId}</code><span className={'pq-badge '+c.priority.toLowerCase()}>{c.priority}</span></div>
     <h3>{c.title}</h3>
     <p className="repo-case-meta">{c.statute} · {c.court} · stage: {c.stage}</p>
     <div className="repo-case-docs">{allowed
       ? cdocs.slice(0,4).map(d=><span key={d.id} className="doc-pill">{d.name}</span>)
       : cdocs.map(d=><span key={d.id} className="doc-pill dim">🔒 hidden document</span>)}
       {allowed&&cdocs.length>4&&<span className="doc-pill more">+{cdocs.length-4} more</span>}
       {cdocs.length===0&&<span className="doc-pill none">No documents yet</span>}
     </div>
     <div className="repo-case-actions">
       {allowed
         ? <button className="primary" onClick={()=>openCase(c.caseId)}><FolderClosed/>Open case documents</button>
         : <button onClick={()=>{const r=window.prompt('Why do you need access to '+c.caseId+'? Include a short description for the System Admin:');if(r&&r.trim())onRequest(c.caseId,r.trim());}}><KeyRound/>Request access</button>}
       <button onClick={()=>openGraph(c.caseId)}><Network/>Case graph</button>
       {!allowed&&<small className="repo-locked-note"><LockKeyhole/>Documents hidden — access request needed</small>}
     </div>
   </article>;})}</section></>;
}

function Status({status}:{status:DmsDocument['status']}){return <span className={'doc-status '+status.replaceAll(' ','-').toLowerCase()}>{status==='Verified'?<Check/>:status==='Flagged'?<ShieldAlert/>:<Clock3/>}{status}</span>}

/* ---------- Case workspace: tabbed dossier (Overview / Timeline / Documents) ---------- */
function CaseWorkspace({session,role,docs,caseData,evidence,setPage,share,log,setDocs,flash,logAccess,canOpenCase,onRequest}:{session?:DmsSession|null;role:DmsRole;docs:DmsDocument[];caseData?:DmsCase;evidence:EvidenceItem[];setPage:(p:DmsPage)=>void;share:(id:string)=>void;log:(a:string,t:string)=>void;setDocs:(f:(x:DmsDocument[])=>DmsDocument[])=>void;flash:(x:string)=>void;logAccess:(c:string,d:string,a:AccessEvent['action'],det?:string)=>void;canOpenCase:(id:string)=>boolean;onRequest:(caseId:string,reason:string)=>void}){
 const [tab,setTab]=useState<'overview'|'timeline'|'docs'>('overview');
 const [versionDoc,setVersionDoc]=useState<string|null>(null);
 const [viewing,setViewing]=useState<DmsDocument|null>(null);
 const [typeFilter,setTypeFilter]=useState('All');
 const [query,setQuery]=useState('');
 const [openStage,setOpenStage]=useState<number|null>(null);
 if(!caseData)return null;
 const allowed=canOpenCase(caseData.caseId);
 const types=['All',...Array.from(new Set(docs.map(d=>d.type)))];
 const filtered=docs.filter(d=>(typeFilter==='All'||d.type===typeFilter)&&(!query||d.name.toLowerCase().includes(query.toLowerCase())));
 const openDoc=(d:DmsDocument)=>{if(!allowed)return;logAccess(caseData.caseId,d.name,'opened');log('Viewed document',d.name+' · '+caseData.caseId);appendBlock({action:'DOCUMENT_VIEWED',actor:session?.name||'Authorized user',actorId:session?.officerId||'—',caseId:caseData.caseId,documentName:d.name,payload:'view|'+d.name+'|v'+d.version});setViewing(d);};
 const openStageAuto=caseData.timeline.findIndex(t=>t.active);
 return <><div className="dms-page-head with-button"><div><span>CASE FILE · {allowed?'PERMISSIONED ACCESS':'OVERVIEW + GRAPH ONLY'}</span><h1>{caseData.title} <code className="case-chip">{caseData.caseId}</code></h1><p>{caseData.statute} · {caseData.court} · stage: {caseData.stage} · next hearing {caseData.nextHearing}</p></div><button onClick={()=>setPage('repository')}><ArrowLeft/>Repository</button></div>
 {!allowed&&<section className="dms-panel no-access-note"><LockKeyhole/><div><b>Your role is not assigned to {caseData.caseId}.</b><p>You can study the overview, relationship graph and timeline below, but the documents stay hidden. Send an access request with a short description — the System Admin approves it in the Admin Panel.</p><button onClick={()=>{const r=window.prompt('Why do you need access to '+caseData.caseId+'?');if(r&&r.trim())onRequest(caseData.caseId,r.trim());}}><KeyRound/>Request access to {caseData.caseId}</button></div></section>}
 <section className="dms-panel case-dossier">
   <div className="cd-tabs">
     <button className={tab==='overview'?'on':''} onClick={()=>setTab('overview')}>Overview</button>
     <button className={tab==='timeline'?'on':''} onClick={()=>setTab('timeline')}>Detailed timeline</button>
     <button className={tab==='docs'?'on':''} onClick={()=>setTab('docs')}>Case file &amp; documents{allowed?'':' [locked]'}</button>
   </div>

   {tab==='overview'&&<div className="cd-view">
     <div className="cd-overview">
       <div>
         <h3 className="cd-h">Description</h3>
         <p className="cd-desc">{caseData.description}</p>
         <h3 className="cd-sub">Facts of the matter</h3>
         <ul className="cd-facts">{caseData.facts.map((f,i)=><li key={i}>{f}</li>)}</ul>
         <h3 className="cd-sub">Statute notes</h3>
         <div className="cd-statutes">{caseData.statutes.map(s=><span key={s.name}><b>{s.name}</b><small>{s.note}</small></span>)}</div>
       </div>
       <div className="cd-side">
         {(['victim','suspect','witness'] as const).map(cat=>{
           const list=caseData.parties.filter(p=>p.category===cat);
           if(!list.length)return null;
           return <div className="dms-panel cd-party-card" key={cat}>
             <h3>{cat==='victim'?<Users/>:cat==='suspect'?<Gavel/>:<Eye/>}{cat==='victim'?'Victims / affected parties':cat==='suspect'?'Accused / respondents':'Witnesses'}</h3>
             {list.map(p=><div className="cd-person" key={p.name}><b>{p.name}</b><small>{p.detail}</small></div>)}
           </div>;
         })}
         <div className="dms-panel">
           <h3><Network/>Case graph</h3>
           <CaseGraph caseData={{id:caseData.caseId,title:caseData.title,description:caseData.description,nodes:caseData.graph.nodes,edges:caseData.graph.edges,timeline:caseData.timeline.map(t=>({date:t.date,label:t.label}))}}/>
         </div>
         <div className="dms-panel">
           <h3><Archive/>Evidence in this case</h3>
           {evidence.length===0&&<p className="dash-empty">No registered evidence.</p>}
           {evidence.map(e=><p className="evidence-mini" key={e.id}><b>{e.evId}</b><small>{e.type} · custodian: {e.custodian}</small></p>)}
         </div>
       </div>
     </div>
   </div>}

   {tab==='timeline'&&<div className="cd-view">
     <p className="cd-stage-sub">Every stage expands — what happened, who was involved, and the outcome. The current stage is highlighted.</p>
     <div className="cd-stages">
       {caseData.timeline.map((t,i)=>{
         const open=openStage!==null?openStage===i:(openStageAuto===i);
         return <div key={i} className={'cd-stage'+(t.done?' done':'')+(t.active?' active':'')+(open?' open':'')}>
           <button className="cd-stage-head" onClick={()=>setOpenStage(open?null:i)} aria-expanded={open}>
             <span className="cd-stage-dot"/>
             <span className="cd-stage-titles"><b>{t.label}</b><small>{t.date}</small></span>
             <span className="cd-stage-state">{t.active?'Current stage':t.done?'Completed':'Upcoming'}</span>
             <ChevronDown className="cd-stage-chev"/>
           </button>
           {open&&<div className="cd-stage-body">
             {t.summary&&<p>{t.summary}</p>}
             {!!t.participants?.length&&<div className="cd-stage-people"><Users width={12}/> {t.participants.join(' · ')}</div>}
             {t.outcome&&<p className="cd-stage-outcome"><b>Outcome:</b> {t.outcome}</p>}
           </div>}
         </div>;
       })}
     </div>
   </div>}

   {tab==='docs'&&<div className="cd-view">
     {!allowed? <div className="cd-locked-docs"><LockKeyhole/><b>Documents are permissioned.</b><p>Your role is not assigned to {caseData.caseId}. The overview, graph and timeline above are open for situational awareness; the document layer requires an approved access request.</p><button onClick={()=>{const r=window.prompt('Why do you need access to '+caseData.caseId+'?');if(r&&r.trim())onRequest(caseData.caseId,r.trim());}}><KeyRound/>Request access to {caseData.caseId}</button></div>
     : <>
     <section className="repo-toolbar" style={{margin:'4px 0 12px'}}><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Filter documents in this case…"/><select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>{types.map(t=><option key={t}>{t}</option>)}</select></section>
     <div className="docs-table">
       <div className="doc-head"><span>Document</span><span>Uploaded by</span><span>Date &amp; time</span><span>Status</span><span>Integrity</span><span/></div>
       {filtered.map(d=><div className="doc-row" key={d.id}>
         <FileText/><div><b>{d.name}</b><small>{d.type} · v{d.version} · {d.department}</small></div>
         <span>{d.uploadedBy}</span><span>{d.uploadedAt}</span><Status status={d.status}/>
         <span className="hash-ok"><Fingerprint/>{d.hash.slice(0,12)}…</span>
         <div className="doc-row-actions">
           <button onClick={()=>openDoc(d)} title="Open read-only (view is recorded in access history)"><Eye/></button>
           <button onClick={()=>share(d.id)} title="Create expiring share"><Share2/></button>
           <button title="Version history" onClick={()=>setVersionDoc(versionDoc===d.name?null:d.name)}><History/></button>
         </div>
       </div>)}
       {filtered.length===0&&<p className="dash-empty">No documents match this filter.</p>}
     </div>
     <p className="immut-note"><LockKeyhole/>Documents in the repository are immutable. Corrections happen only as a new version with a recorded, ledger-anchored reason — the original is never altered.</p>
     </>}
   </div>}
 </section>
 {viewing&&<DocViewer doc={viewing} caseTitle={caseData.title} onClose={()=>setViewing(null)}/>}
 {versionDoc&&<VersionHistoryPanel docName={versionDoc} currentVersion={docs.find(x=>x.name===versionDoc)?.version??1} canEdit={role==='Investigating Officer'||role==='Legal Department Officer'} onCreateVersion={async reason=>{const d=docs.find(x=>x.name===versionDoc);if(!d)return;await appendBlock({action:'VERSION_CREATED',actor:session?.name||'Authorized user',actorId:session?.officerId||'—',caseId:caseData.caseId,documentName:d.name,payload:'version|v'+(d.version+1)+'|'+reason});setDocs(x=>x.map(y=>y.id===d.id?{...y,version:y.version+1}:y));log('Created new version (reason recorded)',d.name);flash('Version '+(d.version+1)+' created — reason anchored to the integrity ledger.')}}/>}
 </>;
}

/* ---------- Doc viewer: read-only modal, opens are recorded in access history ---------- */
function DocViewer({doc,caseTitle,onClose}:{doc:DmsDocument;caseTitle:string;onClose:()=>void}){
 return <div className="modal-scrim" onClick={onClose}><div className="doc-viewer" onClick={e=>e.stopPropagation()}>
   <div className="doc-viewer-head"><div><small>READ-ONLY · VIEW RECORDED IN ACCESS HISTORY</small><h3>{doc.name}</h3><code className="case-chip">{doc.caseId}</code></div><button onClick={onClose}><X/></button></div>
   <div className="doc-viewer-meta">
     <span><UserCog/>Uploaded by: <b>{doc.uploadedBy}</b></span>
     <span><Clock3/>At: <b>{doc.uploadedAt}</b></span>
     <span><ShieldCheck/>Status: <b>{doc.status}</b></span>
     <span><Fingerprint/>SHA-256: <code>{doc.hash}</code></span>
   </div>
   <div className="doc-viewer-body">
     <div className="watermark">CONFIDENTIAL · S.U.R.Y.A.</div>
     <p><b>{doc.type}</b> — document body preview is simulated in this demo build. In production the full file renders from encrypted object storage; the viewer is intentionally read-only and has no edit affordance.</p>
     <p>Case: <b>{caseTitle}</b> ({doc.caseId}) · Version {doc.version} · {doc.signed?'Digitally signed':'Signature pending'}{doc.legalHold?' · Legal hold active':''}</p>
   </div>
   <small className="doc-viewer-note"><Eye/>Your open was logged — who, when, and what — visible to the System Admin under Document access history.</small>
 </div></div>;
}

function UploadDigitize({onUpload,goBack,targetCase}:{goBack:()=>void;onUpload:(n:string,t:string,s:boolean)=>void;targetCase:string}){const [name,setName]=useState(''),[type,setType]=useState('FIR'),[sign,setSign]=useState(true),[file,setFile]=useState<File|null>(null);const submit=()=>{const x=file?.name||name.trim();if(!x)return;onUpload(x,type,sign)};return <><div className="dms-page-head with-button"><div><button className="dms-back" onClick={goBack}><ArrowLeft/>Back to Dashboard</button><span>INGEST · CLASSIFY · PROTECT</span><h1>Upload &amp; Digitize</h1><p>New documents are registered under the currently selected case ID: <b>{targetCase}</b>. Open a case workspace first to upload into it.</p></div></div><section className="upload-layout"><article className="dms-panel upload-drop"><Upload/><h2>Drop a document here</h2><p>PDF, JPG, PNG · Demo accepts a local file name only; files never leave this browser.</p><label>Choose document<input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={e=>{setFile(e.target.files?.[0]??null);setName(e.target.files?.[0]?.name??'')}}/></label>{file&&<b><FileText/>{file.name}</b>}</article><article className="dms-panel upload-meta"><h3>AI classification &amp; metadata</h3><label>Document label<input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Witness_statement.pdf"/></label><label>Detected document type<select value={type} onChange={e=>setType(e.target.value)}>{['FIR','Charge sheet','Witness statement','Electronic evidence','Forensic report','Court filing','Legal notice','Judgment'].map(x=><option key={x}>{x}</option>)}</select></label><div className="ai-classified"><SparkleMini/> AI classification ready <span>94% confidence</span></div><label className="signature-check"><input type="checkbox" checked={sign} onChange={e=>setSign(e.target.checked)}/> Attach demo digital signature</label><button onClick={submit}><Upload/>Digitize, hash &amp; upload</button></article></section></>}
function SparkleMini(){return <span className="sparkle">✦</span>}
function AccessControl({role,log,flash,goBack}:{goBack:()=>void;role:DmsRole;log:(a:string,t:string)=>void;flash:(x:string)=>void}){const [dept,setDept]=useState('Court Registry'),[hours,setHours]=useState('72');const grant=()=>{log('Granted time-bound access',`${dept} · ${hours} hours`);flash(`Read-only access granted to ${dept} for ${hours} hours.`)};return <><div className="dms-page-head with-button"><div><button className="dms-back" onClick={goBack}><ArrowLeft/>Back to Dashboard</button><span>ROLE-BASED ACCESS CONTROL</span><h1>Access Control Center</h1><p>Officers see only their assigned cases. Cross-case access is granted here or via access-request approval.</p></div></div><section className="access-layout"><article className="dms-panel permission-matrix"><h3>Permission matrix</h3><table><thead><tr><th>Role</th><th>Repository</th><th>Upload</th><th>Share</th><th>Audit</th></tr></thead><tbody>{[['Investigating Officer','Own cases only','Create','Request','Own actions'],['Forensic Officer','Own cases only','Create','Request','Own actions'],['Court / Registrar Staff','Assigned cases','Create','Grant','Read'],['Legal Department Officer','Assigned cases','Create','Request','Read'],['Records / Compliance Officer','Read','No','Approve','Full'],['System Admin','Full','Full','Full','Full']].map(x=><tr key={x[0]}>{x.map((y,i)=><td key={i}>{y}</td>)}</tr>)}</tbody></table></article><article className="dms-panel access-grant"><h3><KeyRound/>Grant time-bound access</h3><p>Current approver: {role}</p><label>Department<select value={dept} onChange={e=>setDept(e.target.value)}>{['Court Registry','Forensic Lab','Public Prosecutor','Legal Department'].map(x=><option key={x}>{x}</option>)}</select></label><label>Expires in<select value={hours} onChange={e=>setHours(e.target.value)}><option value="24">24 hours</option><option value="72">72 hours</option><option value="168">7 days</option></select></label><button onClick={grant}><KeyRound/>Grant read-only access</button></article></section></>}
function AuditTrail({audit,goBack}:{goBack:()=>void;audit:Audit[]}){const [q,setQ]=useState('');const bridge=getBridgeAccessEvents();const bridgeRows:Audit[]=bridge.map((e,i)=>({id:'bridge-'+i,at:e.at,actor:e.lawyer+' (S.U.R.Y.A. · read-only)',action:'Viewed DMS record via assistance suite',target:e.document,department:'Permissioned cross-system access'}));const all=[...bridgeRows,...audit];const filtered=all.filter(x=>(x.action+x.target+x.actor).toLowerCase().includes(q.toLowerCase()));const csv=()=>{const body=['Time,Actor,Action,Target,Department',...filtered.map(x=>[x.at,x.actor,x.action,x.target,x.department].map(y=>'"'+y.replaceAll('"','""')+'"').join(','))].join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([body],{type:'text/csv'}));a.download='surya-dms-audit-export.csv';a.click();URL.revokeObjectURL(a.href)};return <><div className="dms-page-head with-button"><div><button className="dms-back" onClick={goBack}><ArrowLeft/>Back to Dashboard</button><span>APPEND-ONLY DEMO LEDGER</span><h1>Audit Trail</h1><p>Every view, upload, share, and role switch is retained in this session — including S.U.R.Y.A. cross-system reads.</p></div><button onClick={csv}><Download/>Export CSV</button></div><section className="dms-panel audit-table"><div className="audit-search"><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Filter activity…"/></div><div className="audit-head"><span>Timestamp</span><span>Actor</span><span>Action</span><span>Target</span><span>Department</span></div>{filtered.map(x=><div className="audit-row" key={x.id}><span>{x.at}</span><b>{x.actor}</b><span>{x.action}</span><span>{x.target}</span><span>{x.department}</span></div>)}</section></>}
function Integrity({session,docs,log,flash,goBack}:{goBack:()=>void;session?:DmsSession|null;docs:DmsDocument[];log:(a:string,t:string)=>void;flash:(x:string)=>void}){const check=async(d:DmsDocument)=>{const v=await verifyChain();await appendBlock({action:'INTEGRITY_VERIFIED',actor:session?.name||'Verifier',actorId:session?.officerId||'—',caseId:d.caseId,documentName:d.name,payload:d.name+'|v'+d.version+'|'+d.hash});log('Re-verified integrity hash',d.name);flash(v.valid?`Hash chain verified for ${d.name} — ledger intact (${v.length} blocks).`:`WARNING: tamper detected at block #${v.brokenAtIndex}!`)};return <><div className="dms-page-head with-button"><div><button className="dms-back" onClick={goBack}><ArrowLeft/>Back to Dashboard</button><span>HASH-CHAIN · DEMO IMPLEMENTATION</span><h1>Integrity &amp; Verification</h1><p>Every version has a record hash. Production would calculate hashes and notarize them server-side.</p></div></div><section className="integrity-grid">{docs.map(d=><article className="dms-panel integrity-card" key={d.id}><div><Fingerprint/><Status status={d.status==='Flagged'?'Flagged':'Verified'}/></div><h3>{d.name}</h3><p>SHA-256 record: <code>{d.hash.slice(0,16)}…</code></p><small>Case {d.caseId} · v{d.version} · {d.signed?'Digital signature present':'Signature pending'}</small><button onClick={()=>check(d)}><ShieldCheck/>Verify hash chain</button></article>)}</section></>}
function Sharing({docs,share,goBack}:{goBack:()=>void;docs:DmsDocument[];share:(id:string)=>void}){const [chosen,setChosen]=useState(docs[0]?.id||''),[redact,setRedact]=useState(true);const current=docs.find(d=>d.id===chosen);return <><div className="dms-page-head with-button"><div><button className="dms-back" onClick={goBack}><ArrowLeft/>Back to Dashboard</button><span>CONTROLLED COLLABORATION</span><h1>Secure Sharing</h1><p>Shares are read-only, time-bound, watermarked, and logged in the audit trail.</p></div></div><section className="share-layout"><article className="dms-panel redact-preview"><div className="watermark">CONFIDENTIAL · S.U.R.Y.A.</div><h3>{current?.name}</h3><p>Witness name: {redact?<b className="redacted">██████████</b>:'Rajesh Meena'}</p><p>Contact number: {redact?<b className="redacted">████████</b>:'98XXXXXX12'}</p><p>Case reference: {current?.caseId}</p><label><input type="checkbox" checked={redact} onChange={e=>setRedact(e.target.checked)}/> Apply redaction to sensitive personal data</label></article><article className="dms-panel share-controls"><h3><Share2/>Create permissioned share</h3><label>Document<select value={chosen} onChange={e=>setChosen(e.target.value)}>{docs.map(x=><option value={x.id} key={x.id}>{x.name} — {x.caseId}</option>)}</select></label><label>Recipient department<select><option>Court Registry</option><option>Public Prosecutor</option><option>Lawyer on record — read only</option></select></label><label>Expires<select><option>72 hours</option><option>7 days</option><option>30 days</option></select></label><button onClick={()=>current&&share(current.id)}><Link/>Create expiring share link</button><small><ShieldCheck/> Recipients receive a watermark and cannot edit the source document.</small></article></section></>}
function SemanticSearch({docs,openCase,log,goBack,canOpenCase}:{goBack:()=>void;docs:DmsDocument[];openCase:(x:string)=>void;log:(a:string,t:string)=>void;canOpenCase:(id:string)=>boolean}){const [q,setQ]=useState('cctv');const result=useMemo(()=>docs.filter(d=>(d.name+d.type+d.caseId).toLowerCase().includes(q.toLowerCase())||(['cctv','evidence','murder'].some(x=>q.toLowerCase().includes(x)&&d.caseId==='CR/124/2026'))),[docs,q]);return <><div className="dms-page-head with-button"><div><button className="dms-back" onClick={goBack}><ArrowLeft/>Back to Dashboard</button><span>AI-ASSISTED RETRIEVAL · DEMO</span><h1>Search &amp; Retrieval</h1><p>Semantic matching is simulated locally. Gemini/vector retrieval requires a secured server integration in production.</p></div></div><section className="semantic"><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Try: CCTV evidence in CR/124/2026"/><button onClick={()=>log('Ran semantic search',q)}>Search</button></section><p className="search-note">{result.length} permissioned results · relevance scoring based on document type, case ID, and keyword context.</p><section className="semantic-results">{result.map((d,i)=><button key={d.id} onClick={()=>{if(!canOpenCase(d.caseId))return;log('Opened search result',d.name);openCase(d.caseId)}}><span>{Math.max(82,98-i*5)}%</span><FileText/><div><b>{d.name}</b><p>{d.type} · {d.caseId} · {d.department}</p><small>Matched: <mark>{q}</mark> in document metadata and case context</small></div><ChevronRight/></button>)}</section></>}
function Compliance({docs,setHold,goBack}:{goBack:()=>void;docs:DmsDocument[];setHold:(id:string)=>void}){return <><div className="dms-page-head with-button"><div><button className="dms-back" onClick={goBack}><ArrowLeft/>Back to Dashboard</button><span>RETENTION · LEGAL HOLDS · DISPOSAL</span><h1>Compliance &amp; Retention</h1><p>Manage record lifecycles while preserving litigation and investigation materials.</p></div></div><section className="dms-panel retention"><div className="retention-banner"><Archive/><div><b>Retention policy: Criminal proceedings</b><p>Retain until final judgment and appeal period, then follow departmental retention schedule.</p></div></div>{docs.map(d=><div className="retention-row" key={d.id}><FileText/><div><b>{d.name}</b><small>{d.caseId} · Retention: 10 years after closure</small></div><span className={d.legalHold?'hold':'schedule'}>{d.legalHold?'Legal hold active':'Scheduled retention'}</span><button onClick={()=>setHold(d.id)}>{d.legalHold?'Release hold':'Apply legal hold'}</button></div>)}</section></>}

function LedgerExplorer({goBack,flash}:{goBack:()=>void;flash:(x:string)=>void}){
 const [chain,setChain]=useState<LedgerBlock[]>(getChain());
 const [verdict,setVerdict]=useState<ChainVerification|null>(null);
 const [busy,setBusy]=useState(false);
 const [expanded,setExpanded]=useState<string|null>(null);
 const refresh=()=>setChain(getChain());
 const runVerify=async()=>{setBusy(true);const v=await verifyChain();setVerdict(v);setBusy(false);refresh();flash(v.valid?`Ledger verified: ${v.length} blocks, chain intact.`:`TAMPER DETECTED at block #${v.brokenAtIndex} (${v.brokenReason})`)};
 const doTamper=()=>{const i=Math.max(1,Math.floor(chain.length/2));simulateTamper(i);refresh();flash(`Block #${i} modified by an attacker in demo — now run Verify chain.`)};
 const doRepair=async()=>{setBusy(true);const n=await repairChain();setVerdict(null);setBusy(false);refresh();flash(`${n} block(s) re-mined. In production this is impossible without consensus — that is the security guarantee.`)};
 const doReset=()=>{resetLedger();ensureGenesis();setVerdict(null);refresh();flash('Demo ledger reset to genesis block.')};
 return <><div className="dms-page-head with-button"><div><button className="dms-back" onClick={goBack}><ArrowLeft/>Back to Dashboard</button><span>BLOCKCHAIN INTEGRITY LEDGER · SHA-256 HASH CHAIN</span><h1>Integrity Ledger</h1><p>Every document action is anchored as a block. Each block hash covers its content and the previous block's hash — altering any historical record breaks the chain and is detected instantly.</p></div><div className="ledger-actions"><button onClick={runVerify} disabled={busy}><ShieldCheck/>Verify chain</button><button className="warn" onClick={doTamper}><ShieldAlert/>Simulate tamper</button><button onClick={doRepair} disabled={busy}><History/>Repair (demo)</button><button className="warn" onClick={doReset}><Archive/>Reset demo</button></div></div>
 {verdict&&<section className={verdict.valid?'ledger-verdict ok':'ledger-verdict bad'}>{verdict.valid?<><ShieldCheck/><div><b>CHAIN VERIFIED</b><p>{verdict.length} blocks recomputed — every hash matches, every link intact. Ledger integrity confirmed at {new Date(verdict.checkedAt).toLocaleTimeString('en-IN')}.</p></div></>:<><ShieldAlert/><div><b>INTEGRITY VERIFICATION FAILED</b><p>Block #{verdict.brokenAtIndex} failed ({verdict.brokenReason}). The record was modified after anchoring — treat all downstream blocks as untrusted until re-mined.</p></div></>}</section>}
 <section className="ledger-stats"><article><Fingerprint/><div><b>{chain.length}</b><span>Blocks</span></div></article><article><Link/><div><b title={chain[chain.length-1]?.hash}>{(chain[chain.length-1]?.hash||'').slice(0,10)}…</b><span>Chain tip</span></div></article><article><History/><div><b>{chain.filter(b=>b.action==='DOCUMENT_REGISTERED').length}</b><span>Documents anchored</span></div></article><article><ShieldCheck/><div><b>{verdict?(verdict.valid?'VALID':'BROKEN'):'—'}</b><span>Last verification</span></div></article></section>
 <section className="dms-panel ledger-list"><div className="ledger-head"><span>#</span><span>Action</span><span>Document / Case</span><span>Actor</span><span>Hash → Prev</span><span/></div>
 {chain.slice().reverse().map(b=><div key={b.index} className={verdict&&!verdict.valid&&verdict.brokenAtIndex!==null&&b.index>=verdict.brokenAtIndex?'ledger-row broken':'ledger-row'} onClick={()=>setExpanded(expanded===String(b.index)?null:String(b.index))}>
  <span className="ledger-idx">#{b.index}</span>
  <span className={'ledger-action act-'+b.action.toLowerCase().replaceAll('_','-')}>{b.action.replaceAll('_',' ')}</span>
  <span className="ledger-doc"><b>{b.documentName}</b><small>{b.caseId}</small></span>
  <span className="ledger-actor"><b>{b.actor}</b><small>{b.actorId}</small></span>
  <span className="ledger-hash" title={b.hash}><code>{b.hash.slice(0,10)}…</code><small>← {b.previousHash.slice(0,8)}…</small></span>
  <span className="ledger-time">{new Date(b.timestamp).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
  {expanded===String(b.index)&&<div className="ledger-detail" onClick={e=>e.stopPropagation()}>
    <p><b>Full block hash:</b> <code>{b.hash}</code></p>
    <p><b>Previous hash:</b> <code>{b.previousHash}</code></p>
    <p><b>Payload hash:</b> <code>{b.payloadHash}</code></p>
    <p><b>Timestamp:</b> {new Date(b.timestamp).toISOString()}</p>
    <p><b>Nonce:</b> {b.nonce} · <b>Index:</b> {b.index}</p>
    <small>Block hash = SHA-256(index, timestamp, action, actor, actorId, caseId, document, payloadHash, previousHash, nonce). Recompute it yourself — that is the verification.</small>
  </div>}
 </div>)}
 </section>
 <p className="production-note"><ShieldAlert/> <b>Production note:</b> this demo chain runs client-side with real SHA-256 (Web Crypto). Production anchors the same chain to a permissioned ledger (Hyperledger Fabric / Postgres append-only table with periodic notarization), so no single actor can rewrite history.</p></>;
}

function Admin({role,flash,goBack,session,accessRequests,decideAccessRequest,accessHistory}:{goBack:()=>void;role:DmsRole;flash:(x:string)=>void;session?:DmsSession|null;accessRequests:AccessRequest[];decideAccessRequest:(id:string,approve:boolean)=>void;accessHistory:AccessEvent[]}){
const isSuper = role==='System Admin';
const [users,setUsers]=useState([
 {id:'u1',name:'SI R. Sharma',officerId:'IO-2026-0142',role:'Investigating Officer',dept:'Jaipur Police',status:'Active',lastLogin:'19 Sep 2026 · 12:10',clearance:'RESTRICTED'},
 {id:'u2',name:'Dr. R. Iyer',officerId:'FO-2026-0451',role:'Forensic Officer',dept:'Forensic Science Laboratory',status:'Active',lastLogin:'19 Sep 2026 · 11:30',clearance:'RESTRICTED'},
 {id:'u3',name:'A. Kapoor',officerId:'CR-2026-0087',role:'Court / Registrar Staff',dept:'Jaipur Registry',status:'Active',lastLogin:'19 Sep 2026 · 10:02',clearance:'CONFIDENTIAL'},
 {id:'u4',name:'K. Sharma',officerId:'LO-2026-0219',role:'Legal Department Officer',dept:'Public Prosecutor',status:'Active',lastLogin:'18 Sep 2026 · 17:44',clearance:'CONFIDENTIAL'},
 {id:'u5',name:'M. Thomas',officerId:'RC-2026-0104',role:'Records / Compliance Officer',dept:'State Records',status:'Active',lastLogin:'18 Sep 2026 · 16:20',clearance:'INTERNAL'},
 {id:'u6',name:'S. Verma',officerId:'IO-2026-0177',role:'Investigating Officer',dept:'Jaipur Police',status:'Suspended',lastLogin:'02 Sep 2026 · 09:15',clearance:'RESTRICTED'},
]);
const [roleFilter,setRoleFilter]=useState('All');
const [query,setQuery]=useState('');
const roles=['All','Investigating Officer','Forensic Officer','Court / Registrar Staff','Legal Department Officer','Records / Compliance Officer','System Admin'];
const filtered=users.filter(u=>(roleFilter==='All'||u.role===roleFilter)&&(u.name+u.officerId+u.dept).toLowerCase().includes(query.toLowerCase()));
const pendingReqs=accessRequests.filter(r=>r.status==='pending');
const toggleStatus=(id:string)=>{if(!isSuper)return;setUsers(x=>x.map(u=>u.id===id?{...u,status:u.status==='Active'?'Suspended':'Active'}:u));const u=users.find(x=>x.id===id);flash(u?(u.status==='Active'?'Access suspended for '+u.name:'Access restored for '+u.name):'Updated');};
const provision=()=>{if(!isSuper)return;const n='IO-2026-0'+(200+users.length);setUsers(x=>[...x,{id:'u'+Date.now(),name:'New Officer',officerId:n,role:'Investigating Officer',dept:'Unassigned',status:'Pending',lastLogin:'—',clearance:'RESTRICTED'}]);flash('Officer '+n+' provisioned. Assign department and clearance next.');};
const roleMatrix=[
 {role:'Investigating Officer',pages:'Repository · Evidence · Upload · Audit · Integrity · Ledger · Sharing · Search · Compliance',scope:'Assigned cases only (caseload)'},
 {role:'Forensic Officer',pages:'Repository · Evidence · Upload · Audit · Integrity · Ledger · Search',scope:'Assigned cases only (caseload)'},
 {role:'Court / Registrar Staff',pages:'Repository · Upload · Access · Audit · Integrity · Ledger · Sharing · Search · Compliance',scope:'Assigned cases, filings and certified copies'},
 {role:'Legal Department Officer',pages:'Repository · Upload · Access · Audit · Integrity · Ledger · Sharing · Search · Compliance',scope:'Assigned cases, prosecution documents'},
 {role:'Records / Compliance Officer',pages:'Repository · Access · Audit · Integrity · Ledger · Sharing · Search · Compliance',scope:'Cross-department, read-mostly'},
 {role:'System Admin',pages:'All modules + Admin Panel',scope:'Full platform · approves access requests'},
];
return <><div className="dms-page-head with-button"><div><button className="dms-back" onClick={goBack}><ArrowLeft/>Back to Dashboard</button><span>PLATFORM ADMINISTRATION · {isSuper?'FULL CLEARANCE':'VIEW ONLY'}</span><h1>Admin Panel</h1><p>Signed in as {session?.name||role} ({role}). Non-admin roles see this panel read-only; every action here is written to the audit trail.</p></div><button onClick={provision} disabled={!isSuper} title={isSuper?'':'Only System Admin can provision'}><Plus/>Provision user</button></div>
<section className="admin-kpis"><Kpi icon={Users} n={String(users.length)} label="Provisioned officers" tone="blue"/><Kpi icon={Users} n={String(users.filter(u=>u.status==='Active').length)} label="Active accounts" tone="green"/><Kpi icon={KeyRound} n={String(pendingReqs.length)} label="Pending access requests" tone="amber"/><Kpi icon={Eye} n={String(accessHistory.length)} label="Document opens (history)" tone="red"/></section>
{accessRequests.length>0&&<section className="dms-panel" style={{marginBottom:'14px'}}>
 <h3><KeyRound/>Cross-case access requests <small>{pendingReqs.length} pending</small></h3>
 {accessRequests.map(r=><div className="audit-row" key={r.id}>
   <b>{r.requester}<small style={{display:'block',fontWeight:400,opacity:.6}}>{r.requesterId} · {r.requesterRole} · {r.at}</small></b>
   <span><code style={{fontSize:'10px'}}>{r.caseId}</code></span>
   <span style={{fontSize:'10px',flex:1,minWidth:'160px'}}>{r.reason}</span>
   {r.status==='pending'
     ? <span style={{display:'flex',gap:'6px'}}><button onClick={()=>decideAccessRequest(r.id,true)} disabled={!isSuper} style={{fontSize:'9px',padding:'4px 10px',borderRadius:'6px',border:'1px solid var(--line)',background:'transparent',color:'inherit',cursor:isSuper?'pointer':'not-allowed'}}>Approve</button><button onClick={()=>decideAccessRequest(r.id,false)} disabled={!isSuper} style={{fontSize:'9px',padding:'4px 10px',borderRadius:'6px',border:'1px solid var(--line)',background:'transparent',color:'inherit',cursor:isSuper?'pointer':'not-allowed'}}>Reject</button></span>
     : <span style={{fontSize:'10px',opacity:.7}}>{r.status.toUpperCase()} by {r.decidedBy}</span>}
 </div>)}
 <p style={{fontSize:'10px',opacity:.7,marginTop:'8px'}}>Approval adds the case to the officer's caseload for this session — the grant is audit-logged.</p>
</section>}
<section className="dms-panel user-table">
 <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap',marginBottom:'10px'}}>
  <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name, ID, department…" style={{flex:'1 1 180px',padding:'8px 10px',borderRadius:'8px',border:'1px solid var(--line)',background:'transparent',color:'inherit',fontSize:'11px'}}/>
  <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)} style={{padding:'8px 10px',borderRadius:'8px',border:'1px solid var(--line)',background:'var(--paper, #fff)',color:'inherit',fontSize:'11px'}}>{roles.map(r=><option key={r} value={r}>{r}</option>)}</select>
 </div>
 <div className="audit-head"><span>Officer</span><span>Role</span><span>Department</span><span>Clearance</span><span>Last login</span><span>Status</span><span></span></div>
 {filtered.map(u=><div className="audit-row" key={u.id}><b>{u.name}<small style={{display:'block',fontWeight:400,opacity:.6}}>{u.officerId}</small></b><span>{u.role}</span><span>{u.dept}</span><span><code style={{fontSize:'9px'}}>{u.clearance}</code></span><span style={{fontSize:'10px',opacity:.7}}>{u.lastLogin}</span><span className={u.status==='Active'?'active-user':'pending-user'}>{u.status}</span><button onClick={()=>toggleStatus(u.id)} disabled={!isSuper} style={{fontSize:'9px',padding:'4px 8px',borderRadius:'6px',border:'1px solid var(--line)',background:'transparent',color:'inherit',cursor:isSuper?'pointer':'not-allowed'}}>{u.status==='Active'?'Suspend':'Restore'}</button></div>)}
 {filtered.length===0&&<p style={{opacity:.6,padding:'12px 0'}}>No accounts match this filter.</p>}
</section>
<section className="dms-panel" style={{marginTop:'14px'}}>
 <h3><Eye/>Document access history <small>who opened what, when</small></h3>
 <div className="audit-head"><span>Timestamp</span><span>Actor</span><span>Case</span><span>Document</span><span>Action</span></div>
 {accessHistory.map(h=><div className="audit-row" key={h.id}><span style={{fontSize:'10px',opacity:.7}}>{h.at}</span><b>{h.actor}<small style={{display:'block',fontWeight:400,opacity:.6}}>{h.actorRole}</small></b><span><code style={{fontSize:'10px'}}>{h.caseId}</code></span><span style={{fontSize:'10px'}}>{h.document}</span><span style={{fontSize:'10px'}}>{h.action}{h.detail?' · '+h.detail:''}</span></div>)}
 {accessHistory.length===0&&<p style={{opacity:.6,padding:'12px 0'}}>No document opens recorded yet in this session.</p>}
</section>
<section className="dms-panel" style={{marginTop:'14px'}}>
 <h3><KeyRound/>Role–permission matrix</h3>
 <div className="audit-head"><span>Role</span><span>Modules visible</span><span>Data scope</span></div>
 {roleMatrix.map(r=><div className="audit-row" key={r.role}><b>{r.role}</b><span style={{fontSize:'10px'}}>{r.pages}</span><span style={{fontSize:'10px',opacity:.75}}>{r.scope}</span></div>)}
 <p style={{fontSize:'10px',opacity:.7,marginTop:'8px'}}>This is the same matrix enforced by Postgres RLS in <code>supabase/schema-complete.sql</code> — the UI hides modules; the database enforces it even against forged requests.</p>
</section>
<p className="production-note"><ShieldAlert/> <b>Demo scope:</b> RBAC, encryption badges, signatures, audit records and hash verification are client-side demonstrations. Production requires server-side RBAC (RLS is deployed), encryption at rest, WORM audit storage, and India-compliant eSign / DSC workflows.</p></>}
