/* Demo credentials for the NyayaVault DMS sign-in.
   Kept in a data file (not rendered anywhere in the login UI) so the
   interface keeps a formal government-portal look. Demo only — a real
   deployment authenticates against a server with hashed credentials. */

export type DmsJurisdiction = 'National' | 'Rajasthan' | 'Delhi' | 'Maharashtra' | 'Karnataka';

export type DemoAccount = {
  officerId: string;
  password: string;
  name: string;
  role: 'Investigating Officer' | 'Forensic Officer' | 'Court / Registrar Staff' | 'Legal Department Officer' | 'Records / Compliance Officer' | 'System Admin';
  jurisdiction: DmsJurisdiction;
  department: string;
};

export const DMS_ROLES = [
  'Investigating Officer',
  'Forensic Officer',
  'Court / Registrar Staff',
  'Legal Department Officer',
  'Records / Compliance Officer',
  'System Admin',
] as const;
export type DmsRoleType = (typeof DMS_ROLES)[number];

export const JURISDICTIONS: { id: DmsJurisdiction; label: string }[] = [
  { id: 'National', label: 'National (All jurisdictions)' },
  { id: 'Rajasthan', label: 'Rajasthan' },
  { id: 'Delhi', label: 'Delhi (NCT)' },
  { id: 'Maharashtra', label: 'Maharashtra' },
  { id: 'Karnataka', label: 'Karnataka' },
];

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { officerId: 'IO-2026-0142', password: 'vault@123', name: 'SI R. Sharma', role: 'Investigating Officer', jurisdiction: 'Rajasthan', department: 'Jaipur Police' },
  { officerId: 'FO-2026-0451', password: 'vault@123', name: 'Dr. R. Iyer', role: 'Forensic Officer', jurisdiction: 'Rajasthan', department: 'Forensic Science Laboratory' },
  { officerId: 'CR-2026-0087', password: 'vault@123', name: 'A. Kapoor', role: 'Court / Registrar Staff', jurisdiction: 'Rajasthan', department: 'Jaipur Registry' },
  { officerId: 'LD-2026-0210', password: 'vault@123', name: 'K. Sharma', role: 'Legal Department Officer', jurisdiction: 'National', department: 'Public Prosecutor Office' },
  { officerId: 'RC-2026-0033', password: 'vault@123', name: 'M. Thomas', role: 'Records / Compliance Officer', jurisdiction: 'National', department: 'State Records' },
  { officerId: 'AD-2026-0001', password: 'vault@123', name: 'Platform Admin', role: 'System Admin', jurisdiction: 'National', department: 'Platform Administration' },
];
