export type CaseNode = {
  id: string;
  label: string;
  sub?: string;
  x: number;
  y: number;
  role?: 'incident' | 'victim' | 'witness' | 'suspect' | 'evidence' | 'location';
  info?: string;
};

export type CaseEdge = { from: string; to: string; label?: string; suspected?: boolean };

export type CaseRecord = {
  id: string;
  title: string;
  ipc: string;
  court: string;
  date: string;
  daysLeft: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  judge: string;
  status: string;
  description: string;
  timeline: { label: string; date: string; done?: boolean; active?: boolean }[];
  evidence: string[];
  chartData: number[];
  graphSub: string;
  nodes: CaseNode[];
  edges: CaseEdge[];
  graphTimeline: { date: string; label: string }[];
};
