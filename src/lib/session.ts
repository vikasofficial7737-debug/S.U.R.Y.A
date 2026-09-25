/* Unified platform session — persisted across refreshes. */

import type { DmsRoleType, SuiteRole } from '../data/identityBindings';

export type DmsSessionV2 = {
  kind: 'dms';
  phone: string;
  digilockerRef: string;
  officerId: string;
  role: DmsRoleType;
  fullName: string;
  department: string;
  unit?: string | null;
  policeStation?: string | null;
  jurisdiction: string;
  clearance: string;
  rank?: string | null;
};

export type SuiteSession = {
  kind: 'suite';
  phone: string;
  digilockerRef: string;
  suiteRole: SuiteRole;
  fullName: string;
  barEnrollmentId?: string;   // lawyers only (after Bar-ID layer)
  stateBarCouncil?: string;
};

export type PlatformSession = DmsSessionV2 | SuiteSession;

const KEY = 'surya-session-v2';

export function loadSession(): PlatformSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (s && (s.kind === 'dms' || s.kind === 'suite')) return s;
    return null;
  } catch { return null; }
}

export function saveSession(s: PlatformSession | null): void {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch { /* storage unavailable */ }
}
