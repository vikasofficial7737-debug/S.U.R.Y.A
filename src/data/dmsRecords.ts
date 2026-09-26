/* Shared DMS document registry — the single source of truth that both the
   S.U.R.Y.A. DMS workspace and the S.U.R.Y.A. assistance suite read from.
   SURYA roles only ever RECEIVE read-only, explicitly shared records;
   they never get write access into the DMS core. */

export type DmsDocStatus = 'Verified' | 'Pending verification' | 'Flagged';

export type DmsRecord = {
  id: string;
  name: string;
  type: string;
  caseId: string;
  department: string;
  uploadedBy: string;
  date: string;
  status: DmsDocStatus;
  version: number;
  hash: string;
  signed: boolean;
  legalHold: boolean;
  /** Permissioned to S.U.R.Y.A. lawyer users on record for this case. */
  sharedWithSurya: boolean;
};

export const DMS_CASES = ['CR/124/2026', 'CV/081/2026', 'CY/042/2026'] as const;

export const DMS_RECORDS: DmsRecord[] = [
  { id: 'd1', name: 'FIR_124_2026.pdf', type: 'FIR', caseId: 'CR/124/2026', department: 'Jaipur Police', uploadedBy: 'SI R. Sharma', date: '19 Sep 2026 · 10:14', status: 'Verified', version: 3, hash: '7a42…b18f', signed: true, legalHold: true, sharedWithSurya: true },
  { id: 'd2', name: 'CCTV_Footage_Certificate.pdf', type: 'Electronic evidence', caseId: 'CR/124/2026', department: 'Forensic Lab', uploadedBy: 'Dr. R. Iyer', date: '19 Sep 2026 · 11:02', status: 'Verified', version: 1, hash: 'd9c0…9e31', signed: true, legalHold: true, sharedWithSurya: true },
  { id: 'd3', name: 'Forensic_Report_17.pdf', type: 'Forensic report', caseId: 'CR/124/2026', department: 'Forensic Lab', uploadedBy: 'Dr. R. Iyer', date: '19 Sep 2026 · 11:38', status: 'Verified', version: 2, hash: '4f70…0a12', signed: true, legalHold: true, sharedWithSurya: true },
  { id: 'd4', name: 'Witness_Statement_RM.pdf', type: 'Witness statement', caseId: 'CR/124/2026', department: 'Jaipur Police', uploadedBy: 'SI R. Sharma', date: '18 Sep 2026 · 16:20', status: 'Pending verification', version: 1, hash: 'c64e…ee90', signed: false, legalHold: true, sharedWithSurya: false },
  { id: 'd5', name: 'Charge_Sheet_Draft.pdf', type: 'Court filing', caseId: 'CR/124/2026', department: 'Public Prosecutor', uploadedBy: 'Adv. K. Sharma', date: '17 Sep 2026 · 15:08', status: 'Verified', version: 4, hash: 'bc19…5d08', signed: true, legalHold: true, sharedWithSurya: true },
  { id: 'd6', name: 'Notice_to_Respondent.pdf', type: 'Legal notice', caseId: 'CV/081/2026', department: 'Legal Department', uploadedBy: 'A. Gupta', date: '16 Sep 2026 · 09:42', status: 'Verified', version: 1, hash: 'ab27…2c44', signed: true, legalHold: false, sharedWithSurya: true },
];

/** Lawyer-facing case titles → DMS case IDs (cases the lawyer is on record for). */
export const SURYA_CASE_TO_DMS: Record<string, string> = {
  'state-singh': 'CR/124/2026',
  'meena-rajesh': 'CV/081/2026',
  'anita-bank': 'CY/042/2026',
};

export const dmsRecordsForSuryaCase = (suryaCaseId: string): DmsRecord[] => {
  const dmsCaseId = SURYA_CASE_TO_DMS[suryaCaseId];
  return dmsCaseId ? DMS_RECORDS.filter(r => r.caseId === dmsCaseId && r.sharedWithSurya) : [];
};
