/* ============================================================================
   Identity bindings — mirrors supabase/schema.sql seed rows.
   Used as the demo-mode store AND as the source of truth for what the
   live backend must contain. Credentials sheet: docs/demo-credentials.md
   (never rendered in the UI).
   ========================================================================== */

export type DmsRoleType =
  | 'super_admin' | 'department_admin' | 'investigating_officer' | 'forensic_officer'
  | 'legal_officer' | 'court_registrar' | 'records_compliance';

export type SuiteRole = 'citizen' | 'lawyer' | 'student';

export type DigiIdentity = {
  phone: string;          // canonical: 91XXXXXXXXXX
  digilockerRef: string;
  fullName: string;
  dob: string;
};

export type OfficerRecord = {
  uniqueId: string;
  phone: string;
  role: DmsRoleType;
  fullName: string;
  department: string;
  unit?: string | null;
  policeStation?: string | null;
  jurisdiction: string;
  clearance: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  badgeNo?: string | null;
  rank?: string | null;
  joinedOn?: string | null;
  active: boolean;
};

export type AdvocateRecord = {
  barEnrollmentId: string;   // STATE/NUMBER/YEAR
  phone: string;
  fullName: string;
  stateBarCouncil: string;
  enrollmentYear: number;
  practiceAreas: string[];
  copVerified: boolean;
};

export type SuiteUserRecord = {
  phone: string;
  suiteRole: SuiteRole;
  fullName: string;
  city?: string;
  state?: string;
};

/* ------------------------------------------------------------- seed (demo) */

export const DIGI_IDENTITIES: DigiIdentity[] = [
  { phone: '919876500001', digilockerRef: 'DL-2231-8845-01', fullName: 'Rajesh Kumar Sharma', dob: '1985-03-14' },
  { phone: '919876500002', digilockerRef: 'DL-2231-8845-02', fullName: 'Dr. Rohan Iyer',      dob: '1979-11-02' },
  { phone: '919876500003', digilockerRef: 'DL-2231-8845-03', fullName: 'Anita Desai',         dob: '1990-07-21' },
  { phone: '919876500004', digilockerRef: 'DL-2231-8845-04', fullName: 'Vikram Rao',          dob: '1988-01-30' },
  { phone: '919876500005', digilockerRef: 'DL-2231-8845-05', fullName: 'Sneha Kulkarni',      dob: '1995-09-12' },
  { phone: '919876500006', digilockerRef: 'DL-2231-8845-06', fullName: 'Adv. Meera Bhatt',    dob: '1987-05-19' },
  { phone: '919876500007', digilockerRef: 'DL-2231-8845-07', fullName: 'Karan Malhotra',      dob: '1992-02-08' },
];

export const DMS_OFFICERS: OfficerRecord[] = [
  { uniqueId: 'IO-2026-0142', phone: '919876500001', role: 'investigating_officer', fullName: 'Rajesh Kumar Sharma', department: 'Jaipur Police', unit: 'Crime Branch', policeStation: 'Sardarpura PS', jurisdiction: 'Rajasthan', clearance: 'RESTRICTED', badgeNo: 'RJ-44821', rank: 'Sub-Inspector', joinedOn: '2016-06-15', active: true },
  { uniqueId: 'FO-2026-0451', phone: '919876500002', role: 'forensic_officer',      fullName: 'Dr. Rohan Iyer',      department: 'Forensic Science Laboratory', unit: 'DNA & Digital Division', policeStation: null, jurisdiction: 'National', clearance: 'RESTRICTED', badgeNo: 'FSL-2210', rank: 'Senior Scientific Officer', joinedOn: '2012-01-09', active: true },
  { uniqueId: 'CR-2026-0087', phone: '919876500003', role: 'court_registrar',       fullName: 'Anita Desai',         department: 'Sessions Court Jaipur', unit: 'Registry', policeStation: null, jurisdiction: 'Rajasthan', clearance: 'CONFIDENTIAL', badgeNo: null, rank: 'Senior Registrar', joinedOn: '2014-08-01', active: true },
  { uniqueId: 'LO-2026-0219', phone: '919876500004', role: 'legal_officer',         fullName: 'Vikram Rao',          department: 'Public Prosecutor Office', unit: 'Trial Division', policeStation: null, jurisdiction: 'Rajasthan', clearance: 'CONFIDENTIAL', badgeNo: null, rank: 'Additional Public Prosecutor', joinedOn: '2015-03-20', active: true },
  { uniqueId: 'RC-2026-0104', phone: '919876500005', role: 'records_compliance',    fullName: 'Sneha Kulkarni',      department: 'State Records & Compliance Cell', unit: 'Audit Wing', policeStation: null, jurisdiction: 'National', clearance: 'INTERNAL', badgeNo: null, rank: 'Compliance Officer', joinedOn: '2018-11-11', active: true },
  { uniqueId: 'SA-2026-0001', phone: '919876500006', role: 'super_admin',           fullName: 'Adv. Meera Bhatt',    department: 'NIC Platform Administration', unit: 'Platform Ops', policeStation: null, jurisdiction: 'National', clearance: 'RESTRICTED', badgeNo: 'SA-001', rank: 'System Administrator', joinedOn: '2010-04-05', active: true },
];

export const ADVOCATES: AdvocateRecord[] = [
  { barEnrollmentId: 'RAJ/1823/2019', phone: '919876500004', fullName: 'Vikram Rao',     stateBarCouncil: 'Bar Council of Rajasthan', enrollmentYear: 2019, practiceAreas: ['Criminal', 'Property'], copVerified: true },
  { barEnrollmentId: 'DEL/0917/2016', phone: '919876500007', fullName: 'Karan Malhotra', stateBarCouncil: 'Bar Council of Delhi',     enrollmentYear: 2016, practiceAreas: ['Cyber', 'Corporate'],   copVerified: true },
];

export const SUITE_USERS: SuiteUserRecord[] = [
  { phone: '919876500001', suiteRole: 'citizen', fullName: 'Rajesh Kumar Sharma', city: 'Jaipur',   state: 'Rajasthan' },
  { phone: '919876500005', suiteRole: 'citizen', fullName: 'Sneha Kulkarni',      city: 'Pune',     state: 'Maharashtra' },
  { phone: '919876500007', suiteRole: 'student', fullName: 'Karan Malhotra',      city: 'New Delhi', state: 'Delhi' },
];

/* ------------------------------------------------------------- helpers */

export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10) return '91' + digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  return digits;
}

export function prettyPhone(phone: string): string {
  const ten = phone.length === 12 ? phone.slice(2) : phone;
  return ten.replace(/(\d{5})(\d{5})/, '$1 $2');
}

export const ROLE_LABELS: Record<DmsRoleType, string> = {
  super_admin: 'System Administrator',
  department_admin: 'Department Admin',
  investigating_officer: 'Investigating Officer',
  forensic_officer: 'Forensic Officer',
  legal_officer: 'Legal Officer / Prosecutor',
  court_registrar: 'Court / Registrar',
  records_compliance: 'Records / Compliance Officer',
};
