/* -------------------------------------------------------------
   Collaborative case workspace — data model.

   Three primitives back the three features:
   1. ROLE CASE SCOPING  → which active cases an officer may pick when
      uploading a document. Scoping varies by role:
        • Investigating Officer        → cases from own/linked police stations
        • Forensic Officer             → matters with forensic examination links
        • Court / Registrar Staff      → the full platform docket (registry)
        • Legal Department Officer     → matters with IPC / CrPC / CPC filings
        • Records / Compliance Officer → cross-department oversight (all)
        • System Admin                 → platform-wide (all)
   2. DOCUMENT EVENTS     → the per-document history ("who did what, when"),
      merged with each document's immutable upload record.
   3. COLLABORATION       → one shared workspace per case: collaborator
      invitations (unique employee ID + role), the invitee's notification,
      accept/decline, and the case-level chat channel.

   The demo persists invites / chat / notifications / doc events in
   localStorage so the invite → switch user → accept flow works in one
   browser. In production these rows live in Postgres (see
   case_collaborators / case_messages / dms_notifications / document_events
   in supabase/schema-complete.sql) with RLS enforcing exactly this scoping.
------------------------------------------------------------- */

import { DMS_CASES } from './dmsCases';

export type DmsRoleKey =
  | 'Investigating Officer'
  | 'Forensic Officer'
  | 'Court / Registrar Staff'
  | 'Legal Department Officer'
  | 'Records / Compliance Officer'
  | 'System Admin';

/* ------------------------------------------------ caseload scoping -- */

/** Why this role sees the cases it sees — shown under the upload selector. */
export const SCOPE_NOTE: Record<DmsRoleKey, string> = {
  'Investigating Officer': 'Your caseload: cases originating from your police station or carrying field-investigation links (scene seizure, custody, recovery).',
  'Forensic Officer': 'Your lab docket: matters with forensic examination links — FSL examination of digital, electronic or physical exhibits.',
  'Court / Registrar Staff': 'Registry docket: every matter on the platform docket is indexed by the registry for filings, summons and certified copies.',
  'Legal Department Officer': 'Prosecution docket: matters with statutory filings under IPC / CrPC / CPC where the department appears on record.',
  'Records / Compliance Officer': 'Cross-department oversight: all platform cases are visible for retention, legal-hold and compliance review.',
  'System Admin': 'Platform-wide: all cases across every department are selectable.',
};

/**
 * Role-scoped active cases for the upload selector. This is deliberately
 * rule-based over real case metadata (station of origin, graph links,
 * statute) rather than a hardcoded list — the same rules a Postgres RLS
 * policy would evaluate server-side.
 */
export function scopedCaseIds(role: string): string[] {
  const nodeText = (c: (typeof DMS_CASES)[number]) =>
    c.graph.nodes.map(n => `${n.label} ${n.sub ?? ''} ${n.info ?? ''}`).join(' ');
  switch (role) {
    case 'Investigating Officer':
      return DMS_CASES.filter(c => c.station.includes('PS') || /police|seizure|custody/i.test(nodeText(c))).map(c => c.caseId);
    case 'Forensic Officer':
      return DMS_CASES.filter(c => /fsl|forensic/i.test(nodeText(c))).map(c => c.caseId);
    case 'Court / Registrar Staff':
      return DMS_CASES.map(c => c.caseId);
    case 'Legal Department Officer':
      return DMS_CASES.filter(c => /IPC|CPC|CrPC/i.test(c.statute)).map(c => c.caseId);
    case 'Records / Compliance Officer':
    case 'System Admin':
      return DMS_CASES.map(c => c.caseId);
    default:
      return DMS_CASES.map(c => c.caseId);
  }
}

/* ------------------------------------------------ officer directory -- */

export type DirectoryOfficer = { empId: string; name: string; role: DmsRoleKey; department: string; status: 'Active' | 'Suspended' };

/** Provisioned officers — the directory an inviter resolves employee IDs against. */
export const OFFICER_DIRECTORY: DirectoryOfficer[] = [
  { empId: 'IO-2026-0142', name: 'SI R. Sharma', role: 'Investigating Officer', department: 'Jaipur Police', status: 'Active' },
  { empId: 'FO-2026-0451', name: 'Dr. R. Iyer', role: 'Forensic Officer', department: 'Forensic Science Laboratory', status: 'Active' },
  { empId: 'CR-2026-0087', name: 'Registrar A. Kapoor', role: 'Court / Registrar Staff', department: 'Sessions Court, Jaipur', status: 'Active' },
  { empId: 'LO-2026-0219', name: 'Adv. K. Sharma', role: 'Legal Department Officer', department: 'Public Prosecutor Office', status: 'Active' },
  { empId: 'RC-2026-0104', name: 'M. Thomas', role: 'Records / Compliance Officer', department: 'State Records & Compliance Cell', status: 'Active' },
  { empId: 'SA-2026-0001', name: 'Adv. Meera Bhatt', role: 'System Admin', department: 'NIC Platform Administration', status: 'Active' },
  { empId: 'IO-2026-0290', name: 'SI P. Choudhary', role: 'Investigating Officer', department: 'Jaipur Police', status: 'Active' },
  { empId: 'IO-2026-0177', name: 'S. Verma', role: 'Investigating Officer', department: 'Jaipur Police', status: 'Suspended' },
];

export const findOfficer = (empId: string) => OFFICER_DIRECTORY.find(o => o.empId === empId.trim().toUpperCase());

/** Best-effort role for a display name (used to attribute seed upload events).
    Fuzzy: suite sessions may shorten "Dr. R. Iyer" to "R. Iyer". */
export function roleForName(name: string): string {
  const norm = (s: string) => s.replace(/^Dr\.\s*/i, '').trim().toLowerCase();
  const off = OFFICER_DIRECTORY.find(o => norm(o.name) === norm(name) || o.name.includes(name) || name.includes(o.name.replace(/^Dr\.\s*/i, '')));
  return off?.role ?? 'Department user';
}

/* ------------------------------------------------ document history -- */

export type DocEventAction = 'uploaded' | 'opened' | 'verified' | 'shared' | 'version' | 'legal-hold' | 'access-requested';

export type DocEvent = {
  id: string;
  docId: string;
  docName: string;
  caseId: string;
  at: string;          // "19 Sep 2026 · 14:05"
  by: string;          // display name of the actor
  byRole: string;
  action: DocEventAction;
  detail?: string;
};

/* ------------------------------------------------ collaboration ---- */

export type Collaborator = {
  id: string;
  caseId: string;
  empId: string;         // invitee unique employee ID
  name: string;
  role: DmsRoleKey;      // invitee platform role
  department: string;
  invitedBy: string;
  invitedById: string;
  invitedAt: string;
  status: 'pending' | 'accepted' | 'declined';
  respondedAt?: string;
};

export type ChatMessage = {
  id: string;
  caseId: string;
  from: string;          // display name; system messages use 'System'
  fromRole: string;
  fromId: string;
  text: string;
  at: string;
  system?: boolean;      // join/leave notices — not attributable to a person
};

export type DmsNotification = {
  id: string;
  kind: 'colab-request' | 'colab-accepted' | 'colab-declined' | 'system';
  title: string;
  body: string;
  at: string;
  read: boolean;
  caseId?: string;
  collaboratorId?: string; // for colab-request actions
  forEmpId?: string;       // demo: addressed officer (bell shows all in-browser)
};

/* ------------------------------------------------ persistence ------ */

export type CollabStore = {
  collaborators: Collaborator[];
  messages: ChatMessage[];
  notifications: DmsNotification[];
  docEvents: DocEvent[];
};

export const COLLAB_KEY = 'surya-dms-collab-v1';

export const emptyCollabStore = (): CollabStore => ({ collaborators: [], messages: [], notifications: [], docEvents: [] });

export function loadCollabStore(): CollabStore {
  try {
    const raw = localStorage.getItem(COLLAB_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        collaborators: Array.isArray(p.collaborators) ? p.collaborators : [],
        messages: Array.isArray(p.messages) ? p.messages : [],
        notifications: Array.isArray(p.notifications) ? p.notifications : [],
        docEvents: Array.isArray(p.docEvents) ? p.docEvents : [],
      };
    }
  } catch { /* corrupted store — fall through to a fresh one */ }
  return emptyCollabStore();
}

export function saveCollabStore(s: CollabStore) {
  try { localStorage.setItem(COLLAB_KEY, JSON.stringify(s)); } catch { /* storage full/blocked — demo continues in-memory */ }
  broadcastCollabChange();
}

/* Cross-tab live sync: an invite sent in one tab appears in the invited
   officer's bell in another tab without a reload (BroadcastChannel does not
   echo to the sender, so this cannot loop). */
let channel: BroadcastChannel | null = null;
function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  try { channel = channel || new BroadcastChannel('surya-dms-collab'); return channel; } catch { return null; }
}
export function broadcastCollabChange() { getChannel()?.postMessage('changed'); }
export function onCollabChange(cb: () => void) { const ch = getChannel(); if (ch) ch.onmessage = () => cb(); }

export const nowStamp = () =>
  new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
