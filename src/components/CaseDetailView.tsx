import { Check, Bot, Search, ArrowRight } from 'lucide-react';
import { REAL_CASES } from '../data/cases';

export function CaseDetailView({ caseId, onBack, onAskAI }: { caseId: string, onBack: () => void, onAskAI?: () => void }) {
  const c = REAL_CASES.find(x => x.id === caseId)!;
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
