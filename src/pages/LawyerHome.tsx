import { useState } from 'react';
import { Sparkles, Plus, Briefcase, Bell, FileText, ChevronRight, CalendarDays, ArrowRight, Bot, Search } from 'lucide-react';
import type { View } from '../types';
import { REAL_CASES } from '../data/cases';
import { CaseDetailView } from '../components/CaseDetailView';

export function LawyerHome({ go, flash }: { go: (v: View) => void, flash: (s: string) => void }) {
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [graphCaseId, setGraphCaseId] = useState<string>(REAL_CASES[0].id);
  if (selectedCase) return <CaseDetailView caseId={selectedCase} onBack={() => setSelectedCase(null)} onAskAI={() => go('chat')} />;

  const activeCase = REAL_CASES.find(c => c.id === graphCaseId)!;
  const { nodes, edges } = activeCase;
  const getNode = (id: string) => nodes.find(n => n.id === id)!;

  return <><div className="welcome"><div><em className="gold"><Sparkles />CASE COMMAND CENTER</em><h1>Good morning, <b>Vikas.</b></h1><p>Your practice is moving. Here is what needs your attention.</p></div><button className="primary" onClick={() => flash('New case workspace created.')}><Plus />New case</button></div>
    <div className="stats">{[[Briefcase, '14', 'Active cases', 'cases'], [Bell, '03', 'Upcoming hearings', 'cases'], [Sparkles, '08', 'AI summaries', 'chat'], [FileText, '36', 'Verified documents', 'cases']].map(([I, n, t, page]: any, idx) => <div key={idx} className="stat-clickable" role="button" tabIndex={0} onClick={() => go(page)} onKeyDown={e => e.key === 'Enter' && go(page)}><I /><b>{n}</b><small>{t}</small></div>)}</div>
    <div className="split law">
      <section className="panel graph">
        <div className="title" style={{ alignItems: 'center' }}><div><h3>AI Case Visualizer</h3><p>{activeCase.graphSub}</p></div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select value={graphCaseId} onChange={e => setGraphCaseId(e.target.value)} style={{ fontSize: '10px', padding: '5px', borderRadius: '5px', border: '1px solid var(--line)', color: 'var(--ink)', background: 'var(--paper)', outline: 'none' }}>
              {REAL_CASES.map(c => <option key={c.id} value={c.id}>Case: {c.title}</option>)}
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
        {[...REAL_CASES].sort((a, b) => {
          const rank = { HIGH: 0, MEDIUM: 1, LOW: 2 } as Record<string, number>;
          return (rank[a.priority] ?? 9) - (rank[b.priority] ?? 9) || a.daysLeft - b.daysLeft;
        }).map((c) => <button key={c.id} onClick={() => setSelectedCase(c.id)}><span className={'pq-badge ' + c.priority.toLowerCase()}>{c.priority}</span><div><b>{c.title}</b><small>{c.priority === 'HIGH' ? 'Hearing in ' + c.daysLeft + ' day' + (c.daysLeft === 1 ? '' : 's') : c.priority === 'MEDIUM' ? '2 documents missing' : 'Review due Friday'}</small></div><ChevronRight /></button>)}
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
        <div className="title"><h3>Upcoming hearings</h3><button onClick={() => go('cases')}>Calendar <ArrowRight /></button></div>
        {REAL_CASES.map((c) => <div className="hearing hearing-clickable" key={c.id} onClick={() => setSelectedCase(c.id)}>
          <CalendarDays />
          <div><b>{c.title}</b><small>{c.date} · {c.court}</small><span className={'h-ipc'}>{c.ipc}</span></div>
          <span className={'h-days ' + (c.priority.toLowerCase())}>{c.daysLeft}d</span>
        </div>)}
      </section>
      <section className="panel ai"><Bot /><h3>Ask S.U.R.Y.A.</h3><p>"I can summarize evidence, find related precedents, or prepare a hearing brief."</p><button className="ask" onClick={() => go('chat')}><Search />Ask about a case<ArrowRight /></button></section>
    </div></>
}
