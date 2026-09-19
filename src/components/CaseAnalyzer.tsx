import { useState } from 'react';
import { Sparkles, ShieldCheck, Check } from 'lucide-react';

export function CaseAnalyzer({ flash }: { flash: (x: string) => void }) {
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
  const cx = (n: (typeof nodes)[0]) => n.x + NODE_W / 2;
  const cy = (n: (typeof nodes)[0]) => n.y + NODE_H / 2;

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
