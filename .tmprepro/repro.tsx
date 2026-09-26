type DmsSession={role:string;name:string;officerId:string;jurisdiction:string};
type DmsRole='a';type DmsPage='a';
type DmsDocument={id:string};type DmsCase={caseId:string;timeline:{active?:boolean}[]};
type AccessEvent={action:'opened'};
type EvidenceItem={id:string};
declare function useState<T>(v:T):[T,(v:T)=>void];
declare const appendBlock:(a:any)=>any;
declare const VersionHistoryPanel:(p:any)=>any;
declare const DocViewer:(p:any)=>any;
declare const CaseGraph:(p:any)=>any;
declare function Status(p:any):any;
function CaseWorkspace({session,role,docs,caseData,evidence,setPage,share,log,setDocs,flash,logAccess,canOpenCase,onRequest}:{session?:DmsSession|null;role:DmsRole;docs:DmsDocument[];caseData?:DmsCase;evidence:EvidenceItem[];setPage:(p:DmsPage)=>void;share:(id:string)=>void;log:(a:string,t:string)=>void;setDocs:(f:(x:DmsDocument[])=>DmsDocument[])=>void;flash:(x:string)=>void;logAccess:(c:string,d:string,a:AccessEvent['action'],det?:string)=>void;canOpenCase:(id:string)=>boolean;onRequest:(caseId:string,reason:string)=>void}{
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
export {};
