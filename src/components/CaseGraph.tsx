import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { RotateCcw, Sparkles, X } from 'lucide-react';
import { explainCaseNetwork } from '../lib/gemini';

/* ---------- Types ---------- */

export type GraphNodeKind = 'incident' | 'victim' | 'witness' | 'suspect' | 'evidence' | 'location';

export type GraphNodeInput = {
  id: string;
  label: string;
  sub?: string;
  x: number;
  y: number;
  role?: GraphNodeKind;
  info?: string;
};

export type GraphEdgeInput = { from: string; to: string; label?: string; suspected?: boolean };

export type GraphTimelineEntry = { label: string; date: string };

export type GraphCase = {
  id: string;
  title: string;
  description?: string;
  nodes: GraphNodeInput[];
  edges: GraphEdgeInput[];
  timeline: GraphTimelineEntry[];
};

type Pos = { x: number; y: number };

/* ---------- Visual vocabulary (matches the legend chips) ---------- */

const KIND_META: Record<GraphNodeKind, { legend: string; fill: string; stroke: string }> = {
  incident: { legend: 'Incident or event', fill: '#a06d10', stroke: '#e2a93b' },
  victim: { legend: 'Victim or complainant', fill: '#1e56c4', stroke: '#6f9ff0' },
  evidence: { legend: 'Evidence or document', fill: '#4c5560', stroke: '#8d9aa8' },
  location: { legend: 'Location', fill: '#4f46c8', stroke: '#8d86ee' },
  witness: { legend: 'Witness or other party', fill: '#0e7566', stroke: '#3fae9d' },
  suspect: { legend: 'Suspect or accused', fill: '#a93636', stroke: '#e06c6c' },
};

const KIND_ORDER: GraphNodeKind[] = ['incident', 'victim', 'evidence', 'location', 'witness', 'suspect'];

function inferRole(label: string): GraphNodeKind {
  const l = label.toLowerCase();
  if (l.includes('incident') || l.includes('dispute') || l.includes('matter') || l.includes('⚖') || l.includes('case')) return 'incident';
  if (l.includes('victim') || l.includes('complainant') || l.includes('plaintiff') || l.includes('party')) return 'victim';
  if (l.includes('witness') || l.includes('counsel')) return 'witness';
  if (l.includes('accused') || l.includes('respondent') || l.includes('suspect') || l.includes('bank')) return 'suspect';
  if (l.includes('evidence') || l.includes('record') || l.includes('document') || l.includes('digital')) return 'evidence';
  return 'location';
}

const VW = 640;
const VH = 430;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/* ---------- Component ---------- */

export function CaseGraph({ caseData }: { caseData: GraphCase }) {
  const [layout, setLayout] = useState<Record<string, Record<string, Pos>>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<GraphNodeKind | null>(null);
  const [aiFinding, setAiFinding] = useState('');
  const [aiState, setAiState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [aiError, setAiError] = useState('');
  const dragRef = useRef<{ id: string; dx: number; dy: number; moved: boolean } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const summaryRef = useRef<HTMLDivElement | null>(null);

  const nodes = useMemo(
    () => caseData.nodes.map(n => ({ ...n, role: n.role ?? inferRole(n.label) })),
    [caseData],
  );
  const nodeById = useMemo(() => Object.fromEntries(nodes.map(n => [n.id, n])), [nodes]);
  const edges = useMemo(
    () => caseData.edges.filter(e => nodeById[e.from] && nodeById[e.to]),
    [caseData, nodeById],
  );
  const defaults = useMemo(
    () => Object.fromEntries(nodes.map(n => [n.id, { x: n.x, y: n.y }])) as Record<string, Pos>,
    [nodes],
  );
  const positions = { ...defaults, ...layout[caseData.id] };

  const neighbors = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    nodes.forEach(n => { map[n.id] = new Set(); });
    edges.forEach(e => { map[e.from]?.add(e.to); map[e.to]?.add(e.from); });
    return map;
  }, [nodes, edges]);

  const selectedNode = selected ? nodeById[selected] : undefined;

  const hub = [...nodes].sort((a, b) => (neighbors[b.id]?.size ?? 0) - (neighbors[a.id]?.size ?? 0))[0];
  const suspectedCount = edges.filter(e => e.suspected).length;
  const baseFinding = hub
    ? `${nodes.length} elements linked by ${edges.length} connections — ${edges.length - suspectedCount} confirmed, ${suspectedCount} suspected. “${hub.label}” is the hub of this network${suspectedCount ? '; verify the suspected links before relying on them.' : '.'}`
    : 'No relationships have been mapped for this case yet.';

  const toSvg = (clientX: number, clientY: number): Pos => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  };

  const startDrag = (id: string, e: ReactPointerEvent<SVGGElement>) => {
    e.preventDefault();
    const p = toSvg(e.clientX, e.clientY);
    const cur = positions[id] ?? { x: 0, y: 0 };
    dragRef.current = { id, dx: cur.x - p.x, dy: cur.y - p.y, moved: false };
    try { svgRef.current?.setPointerCapture(e.pointerId); } catch { /* no active pointer (e.g. programmatic events) */ }
  };

  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const p = toSvg(e.clientX, e.clientY);
    const nx = clamp(p.x + d.dx, 32, VW - 32);
    const ny = clamp(p.y + d.dy, 32, VH - 34);
    const prev = positions[d.id];
    if (!prev || Math.abs(prev.x - nx) > 1.5 || Math.abs(prev.y - ny) > 1.5) d.moved = true;
    setLayout(prevLayout => ({
      ...prevLayout,
      [caseData.id]: { ...(prevLayout[caseData.id] || {}), [d.id]: { x: nx, y: ny } },
    }));
  };

  const onPointerUp = () => {
    const d = dragRef.current;
    if (d && !d.moved) setSelected(cur => (cur === d.id ? null : d.id));
    dragRef.current = null;
  };

  const resetLayout = () => {
    setLayout(prev => ({ ...prev, [caseData.id]: {} }));
    setKindFilter(null);
  };

  const askAI = async () => {
    if (aiState === 'loading') return;
    setAiState('loading');
    setAiError('');
    try {
      const answer = await explainCaseNetwork(
        caseData.title,
        nodes.map(n => ({ label: n.label, role: KIND_META[n.role].legend, sub: n.sub })),
        edges.map(e => ({
          from: nodeById[e.from]?.label ?? e.from,
          to: nodeById[e.to]?.label ?? e.to,
          label: e.label,
          suspected: e.suspected,
        })),
      );
      setAiFinding(answer);
      setAiState('idle');
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Unable to explain the network right now.');
      setAiState('error');
    }
  };

  const isDimmedByFilter = (role: GraphNodeKind) => kindFilter !== null && role !== kindFilter;
  const isDimmedBySelection = (id: string) =>
    selected !== null && id !== selected && !neighbors[selected]?.has(id);
  const nodeOpacity = (id: string, role: GraphNodeKind) =>
    isDimmedByFilter(role) || isDimmedBySelection(id) ? 0.16 : 1;
  const edgeOpacity = (e: GraphEdgeInput) => {
    const ra = nodeById[e.from]?.role, rb = nodeById[e.to]?.role;
    if (kindFilter !== null && ra !== kindFilter && rb !== kindFilter) return 0.08;
    if (selected !== null && e.from !== selected && e.to !== selected) return 0.14;
    return e.suspected ? 0.85 : 1;
  };

  return (
    <div>
      <div className="cg-stage">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VW} ${VH}`}
          className="cg-svg"
          role="img"
          aria-label={`Relationship graph for ${caseData.title}`}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* Edges (drawn first so nodes sit on top) */}
          {edges.map((e, i) => {
            const a = positions[e.from], b = positions[e.to];
            if (!a || !b) return null;
            const hot = selected !== null && (e.from === selected || e.to === selected);
            return (
              <line
                key={`${e.from}-${e.to}-${i}`}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                className={'cg-conn' + (e.suspected ? ' dashed' : '') + (hot ? ' hot' : '')}
                opacity={edgeOpacity(e)}
              />
            );
          })}

          {/* Suspected-link labels */}
          {edges.map((e, i) => {
            if (!e.suspected || !e.label) return null;
            const a = positions[e.from], b = positions[e.to];
            if (!a || !b) return null;
            const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
            const w = e.label.length * 4.9 + 16;
            const dim = edgeOpacity(e) < 0.3;
            return (
              <g key={`lbl-${i}`} opacity={dim ? 0.15 : 1}>
                <rect x={mx - w / 2} y={my - 10} width={w} height={20} rx={10} fill="#13273e" stroke="#33507a" />
                <text x={mx} y={my + 3.5} textAnchor="middle" fontSize="9" fill="#c9d8ea">{e.label}</text>
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map(n => {
            const p = positions[n.id] ?? { x: n.x, y: n.y };
            const meta = KIND_META[n.role];
            const isSel = selected === n.id;
            return (
              <g
                key={n.id}
                className="cg-node"
                transform={`translate(${p.x}, ${p.y})`}
                opacity={nodeOpacity(n.id, n.role)}
                onPointerDown={e => startDrag(n.id, e)}
              >
                <title>{`${n.label}${n.sub ? ` — ${n.sub}` : ''} (drag to move, click for details)`}</title>
                {isSel && <NodeHalo role={n.role} />}
                <NodeShape role={n.role} fill={meta.fill} stroke={isSel ? '#eef5fd' : meta.stroke} />
                <text className="cg-label" y={labelOffset(n.role)} textAnchor="middle">{n.label}</text>
              </g>
            );
          })}
        </svg>

        {/* Selected-node info card */}
        {selectedNode && (
          <div className="cg-card">
            <div className="cg-card-head">
              <span className="cg-dot" style={{ background: KIND_META[selectedNode.role].stroke }} />
              <b>{selectedNode.label}</b>
              <button className="cg-card-x" onClick={() => setSelected(null)} aria-label="Close details"><X /></button>
            </div>
            {selectedNode.sub && <small>{selectedNode.sub}</small>}
            <p>{selectedNode.info || `${selectedNode.label}: part of the ${caseData.title} network. Connections listed below.`}</p>
            <em>Connections</em>
            <div className="cg-card-links">
              {Array.from(neighbors[selectedNode.id] ?? []).map(id => {
                const nb = nodeById[id];
                if (!nb) return null;
                return (
                  <button key={id} onClick={() => setSelected(id)}>
                    <span className="cg-dot" style={{ background: KIND_META[nb.role].stroke }} />
                    {nb.label}
                  </button>
                );
              })}
              {(neighbors[selectedNode.id]?.size ?? 0) === 0 && <span className="cg-none">No direct links</span>}
            </div>
          </div>
        )}

        <button className="cg-scroll" onClick={() => summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })} aria-label="Jump to summary">↓</button>
      </div>

      {/* Legend chips + reset */}
      <div className="cg-legend">
        {KIND_ORDER.map(kind => (
          <button
            key={kind}
            className={'cg-chip' + (kindFilter === kind ? ' on' : '')}
            onClick={() => setKindFilter(cur => (cur === kind ? null : kind))}
            title={kindFilter === kind ? 'Show all node types' : `Highlight ${KIND_META[kind].legend.toLowerCase()}`}
          >
            <span className={`cg-ico cg-ico-${kind}`} />
            {KIND_META[kind].legend}
          </button>
        ))}
        <button className="cg-reset" onClick={resetLayout}><RotateCcw />Reset layout</button>
      </div>
      <p className="cg-hint">Solid line: confirmed link. Dashed line: suspected or AI-suggested link. Drag a node to rearrange, select it to see its connections.</p>

      {/* Key finding + AI summarizer + timeline */}
      <div className="cg-summary" ref={summaryRef}>
        <div className="cg-keyfinding">
          <em>Key finding</em>
          {aiState === 'loading' ? (
            <p className="cg-ai-loading"><Sparkles /> S.U.R.Y.A. is reading the network…</p>
          ) : (
            <p>
              {aiFinding || baseFinding}
              {aiState === 'error' && <span className="cg-ai-error"> {aiError}</span>}
            </p>
          )}
          <button className="cg-ask" onClick={askAI} disabled={aiState === 'loading'}>
            Ask AI to explain this network <span aria-hidden>↗</span>
          </button>
        </div>

        {caseData.timeline.length > 0 && (
          <div className="cg-timeline">
            <em>Timeline</em>
            {caseData.timeline.map((t, i) => (
              <div className="cg-tl-row" key={i}>
                <span className="cg-tl-date">{t.date}</span>
                <span className="cg-tl-desc">{t.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- SVG pieces ---------- */

function NodeShape({ role, fill, stroke }: { role: GraphNodeKind; fill: string; stroke: string }) {
  switch (role) {
    case 'incident':
      return <polygon points="0,-19 32,0 0,19 -32,0" fill={fill} stroke={stroke} strokeWidth={2} />;
    case 'victim':
    case 'witness':
    case 'suspect':
      return <circle r={16} fill={fill} stroke={stroke} strokeWidth={2} />;
    case 'evidence':
      return <rect x={-14} y={-14} width={28} height={28} rx={3} fill={fill} stroke={stroke} strokeWidth={2} />;
    case 'location':
      return <rect x={-21} y={-13} width={42} height={26} rx={6} fill={fill} stroke={stroke} strokeWidth={2} />;
  }
}

function NodeHalo({ role }: { role: GraphNodeKind }) {
  const style = { fill: 'none', stroke: 'rgba(238,245,253,.45)', strokeWidth: 5 } as const;
  switch (role) {
    case 'incident':
      return <polygon points="0,-26 43,0 0,26 -43,0" {...style} />;
    case 'victim':
    case 'witness':
    case 'suspect':
      return <circle r={23} {...style} />;
    case 'evidence':
      return <rect x={-20} y={-20} width={40} height={40} rx={5} {...style} />;
    case 'location':
      return <rect x={-27} y={-19} width={54} height={38} rx={9} {...style} />;
  }
}

function labelOffset(role: GraphNodeKind) {
  switch (role) {
    case 'incident': return 34;
    case 'victim':
    case 'witness':
    case 'suspect': return 32;
    case 'evidence': return 30;
    case 'location': return 29;
  }
}
