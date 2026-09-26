/* Case-centric DMS data model.
   Every document belongs to a unique case ID; every officer is assigned to a
   set of cases (their active caseload). Access to documents is case-based:
   • Officers see only documents of cases they are assigned to.
   • Documents are immutable — no edit path exists anywhere in the UI.
   • Every document open/view is written to ACCESS HISTORY (visible to admin).
   • A cross-case request flow (case ID + description) lets an officer ask the
     admin for one-time access to any other case; admin approves or rejects.
   Case metadata (graph, overview, timeline) is readable by every role; only
   the document layer is permissioned. The S.U.R.Y.A. assistance suite still
   reads only records explicitly marked sharedWithSurya — it never gains write
   access into the DMS core. */

export type DmsDocStatus = 'Verified' | 'Pending verification' | 'Flagged';

export type DmsDocument = {
  id: string;
  name: string;
  type: string;
  caseId: string;
  department: string;
  uploadedBy: string;
  uploadedAt: string;      // date + time of upload
  status: DmsDocStatus;
  version: number;
  hash: string;
  signed: boolean;
  legalHold: boolean;
  /** Permissioned to S.U.R.Y.A. lawyer users on record for this case. */
  sharedWithSurya: boolean;
};

/* ------------------------------------------------------------- cases */

export type DmsTimelineEntry = {
  label: string;
  date: string;
  done?: boolean;
  active?: boolean;
  /** What happened at this stage — surfaces in the expandable timeline. */
  summary?: string;
  /** Who was involved at this stage. */
  participants?: string[];
  outcome?: string;
};

export type DmsStatute = { name: string; note: string };
export type DmsParty = { category: 'victim' | 'witness' | 'suspect'; name: string; detail: string };

export type DmsCase = {
  caseId: string;            // unique case ID — the key of the whole system
  title: string;             // e.g. 'State vs R. Singh'
  statute: string;
  court: string;
  stage: string;             // current stage of the proceeding
  station: string;           // police station / registry of origin
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  openedOn: string;
  nextHearing: string;
  daysLeft: number;
  description: string;
  facts: string[];
  statutes: DmsStatute[];
  parties: DmsParty[];
  timeline: DmsTimelineEntry[];
  graph: { nodes: GraphNode[]; edges: GraphEdge[]; sub: string };
};

export type GraphNode = { id: string; label: string; sub?: string; x: number; y: number; role: 'incident' | 'victim' | 'witness' | 'suspect' | 'evidence' | 'location'; info?: string };
export type GraphEdge = { from: string; to: string; label?: string; suspected?: boolean };

/* ------------------------------------------------------------- caseload */

/** Which officer (by DMS role string) is assigned to which case. */
export const CASE_ASSIGNMENTS: Record<string, string[]> = {
  'Investigating Officer': ['CR/124/2026'],
  'Forensic Officer': ['CR/124/2026'],
  'Court / Registrar Staff': ['CR/124/2026', 'CV/081/2026'],
  'Legal Department Officer': ['CR/124/2026', 'CY/042/2026'],
  'Records / Compliance Officer': ['CR/124/2026', 'CV/081/2026', 'CY/042/2026'],
  'System Admin': ['CR/124/2026', 'CV/081/2026', 'CY/042/2026'],
};

/* ------------------------------------------------------------- seed cases */

export const DMS_CASES: DmsCase[] = [
  {
    caseId: 'CR/124/2026',
    title: 'State vs R. Singh',
    statute: 'IPC 302 · 34',
    court: 'Sessions Court, Jaipur',
    stage: 'Trial — cross-examination',
    station: 'Sardarpura PS, Jaipur',
    priority: 'HIGH',
    openedOn: '12 Jan 2026',
    nextHearing: '20 Sep 2026',
    daysLeft: 1,
    description:
      'The accused, Rajesh Singh, is charged under IPC §302 for the alleged murder of Sohan Lal on 12 Jan 2026. CCTV footage from the adjoining shop and a signed forensic report place the accused at the scene. A key eyewitness, Rajesh Meena, has recorded his statement under §161 CrPC; cross-examination is listed next. The defense claims alibi. The 65B certificate for the CCTV clip is pending and has been flagged for the next hearing.',
    facts: [
      'Accused Rajesh Singh and the deceased Sohan Lal were neighbours in the same locality for over six years.',
      'The incident occurred on the night of 12 Jan 2026 near the rear lane of the accused’s residence.',
      'CCTV from a neighbouring shop recorded a person matching the accused’s build at 21:14 hrs.',
      'The post-mortem (SMS Hospital, Jaipur panel) lists the cause of death as blunt-force injury; time of death estimated between 20:30 and 22:00.',
      'The accused claims he was at a relative’s house across town when the incident occurred (alibi).',
    ],
    statutes: [
      { name: 'IPC 302', note: 'Punishment for murder. Charge framed 18 Mar 2026.' },
      { name: 'Sec 65B, Evidence Act', note: 'CCTV certificate requirement — defence objection pending; flagged for next hearing.' },
      { name: 'Sec 161 CrPC', note: 'Eyewitness statement recorded at Sardarpura PS; copy supplied to the defence.' },
    ],
    parties: [
      { category: 'victim', name: 'Sohan Lal', detail: 'Deceased, 46, daily-wage worker. Survived by spouse and two children. Family has been provided interim compensation under the Rajasthan Victim Compensation Scheme. The complainant in the FIR is the victim’s brother.' },
      { category: 'suspect', name: 'Rajesh Singh', detail: 'Charged under IPC §302; in judicial custody. Pleads alibi — claims to have been at a relative’s house across town.' },
      { category: 'witness', name: 'Rajesh Meena', detail: 'Eyewitness · examined under §161 CrPC; cross-examination listed for 20 Sep 2026.' },
      { category: 'witness', name: 'Dr. S. Kaul', detail: 'Autopsy surgeon · post-mortem report on record; to be cross-examined at the next hearing.' },
      { category: 'witness', name: 'Const. B. Sharma', detail: 'Investigating officer witness · seizure memos dated 12–14 Jan 2026.' },
    ],
    timeline: [
      { label: 'FIR registered', date: '12 Jan 2026 · 10:14', done: true, summary: 'FIR No. 124/2026 registered at Sardarpura PS on the complaint of the victim’s brother under IPC §§302, 34.', participants: ['SI R. Sharma', 'Complainant (victim’s brother)'], outcome: 'Case opened; scene team dispatched the same morning.' },
      { label: 'Scene inspection & evidence seizure', date: '12 Jan 2026 · 12:10', done: true, summary: 'Rear lane examined; the shop’s CCTV hard drive and the accused’s handset seized under an attested memo.', participants: ['SI R. Sharma', 'Const. B. Sharma'], outcome: 'Three exhibits registered (EV-2026-00312…00314).' },
      { label: 'Accused produced before court', date: '15 Jan 2026', done: true, summary: 'Accused produced within 24 hours of arrest; three days’ police custody requested and granted for recovery of the alleged weapon.', participants: ['SI R. Sharma', 'PP Adv. K. Sharma'], outcome: 'Remanded to judicial custody, Jaipur Central Jail.' },
      { label: 'Charge sheet filed', date: '05 Mar 2026', done: true, summary: 'Charge sheet filed with 14 witness statements and three exhibit memos before the Sessions Court.', participants: ['SI R. Sharma', 'PP Adv. K. Sharma'], outcome: 'Charges framed on 18 Mar 2026 under IPC §302 read with §34.' },
      { label: 'Forensic report received (signed)', date: '19 Sep 2026 · 11:38', done: true, summary: 'FSL confirms blunt-force injury consistent with the alleged weapon; handset location data places the accused within 400 m of the scene.', participants: ['Dr. R. Iyer', 'FSL Jaipur'], outcome: 'Report digitally signed and anchored to the integrity ledger.' },
      { label: 'Cross-examination of PW', date: '20 Sep 2026', active: true, summary: 'Eyewitness Rajesh Meena to be cross-examined; the defence is expected to probe the pending 65B certificate for the CCTV clip.', participants: ['Rajesh Meena', 'PP Adv. K. Sharma', 'Defence counsel'] },
      { label: 'Final arguments', date: 'TBD', done: false },
    ],
    graph: {
      sub: 'State vs R. Singh · IPC 302',
      nodes: [
        { id: 'victim', label: 'Victim', sub: 'Sohan Lal', x: 90, y: 150, role: 'victim', info: 'Deceased; last seen near his residence on the evening of 12 Jan 2026.' },
        { id: 'accused', label: 'Accused', sub: 'R. Singh', x: 320, y: 80, role: 'suspect', info: 'Charged under IPC §302. The defense claims an alibi for the night of the incident.' },
        { id: 'witness', label: 'Witness', sub: 'Rajesh Meena', x: 550, y: 155, role: 'witness', info: 'Eyewitness testimony places the accused at the scene; cross-examination is pending.' },
        { id: 'incident', label: 'Incident', sub: '12 Jan 2026', x: 320, y: 240, role: 'incident', info: 'Alleged murder on 12 Jan 2026 — the basis of the IPC §302 charge.' },
        { id: 'evidence', label: 'Evidence', sub: '5 files in DMS', x: 105, y: 335, role: 'evidence', info: 'CCTV footage and the forensic report are verified; the 65B certificate is still pending.' },
        { id: 'court', label: 'Court', sub: '20 Sep 2026', x: 450, y: 350, role: 'location', info: 'Sessions Court, Jaipur. Next hearing: cross-examination of the eyewitness.' },
        { id: 'cctv', label: 'CCTV clip', sub: 'Shop camera', x: 505, y: 62, role: 'evidence', info: 'Shop-camera footage recorded a person matching the accused’s build at 21:14 hrs. 65B certificate pending.' },
        { id: 'statement', label: 'PW statement', sub: 'u/s 161 CrPC', x: 585, y: 262, role: 'evidence', info: 'Rajesh Meena’s statement recorded under §161 CrPC; cross-examination pending at the next hearing.' },
        { id: 'fsl', label: 'FSL team', sub: 'Dr. R. Iyer', x: 150, y: 55, role: 'witness', info: 'Forensic Science Laboratory — examined the seized handset and CCTV drive; report signed.' },
      ],
      edges: [
        { from: 'victim', to: 'incident', label: 'victim of' },
        { from: 'accused', to: 'incident', label: 'charged with' },
        { from: 'witness', to: 'incident', label: 'saw' },
        { from: 'incident', to: 'evidence', label: 'supported by' },
        { from: 'incident', to: 'court', label: 'listed at' },
        { from: 'witness', to: 'statement', label: 'gave' },
        { from: 'witness', to: 'accused', label: 'identified' },
        { from: 'cctv', to: 'incident', label: 'recorded' },
        { from: 'cctv', to: 'accused', label: 'places at scene' },
        { from: 'accused', to: 'victim', label: 'prior enmity alleged', suspected: true },
        { from: 'evidence', to: 'court', label: 'filed with' },
        { from: 'accused', to: 'court', label: 'produced before' },
        { from: 'fsl', to: 'evidence', label: 'examined' },
        { from: 'fsl', to: 'cctv', label: 'certifying' },
      ],
    },
  },
  {
    caseId: 'CV/081/2026',
    title: 'Meena vs Rajesh',
    statute: 'CPC Order 39',
    court: 'District Court, Jaipur',
    stage: 'Evidence stage',
    station: 'Sikar circle registry',
    priority: 'MEDIUM',
    openedOn: '03 Feb 2026',
    nextHearing: '24 Sep 2026',
    daysLeft: 5,
    description:
      'A civil property dispute between Ms. Meena Devi and Mr. Rajesh Kumar over a 2.4-acre land parcel in Sikar district. The plaintiff claims recorded ownership via a registered sale deed (2019). The respondent disputes the boundaries and alleges encroachment. Two key documents — patwari records and the 2023 demarcation survey map — remain unverified by the court registry and are the subject of the next hearing.',
    facts: [
      'The 2.4-acre parcel in Sikar district stands recorded in the plaintiff’s name via a registered sale deed of 2019.',
      'The respondent claims boundary stone no. 7 was shifted during fencing work in 2022 and alleges encroachment of roughly 0.2 acres.',
      'The 2023 private demarcation map conflicts with the respondent’s own report on the stone’s position.',
      'A court commission demarcated the parcel on 18 Jul 2026; a boundary-stone sample was sealed and deposited with the registry.',
    ],
    statutes: [
      { name: 'CPC Order 39, Rules 1 & 2', note: 'Temporary injunction application pending; status-quo direction in force since Mar 2026.' },
      { name: 'Registration Act 1908 · §17', note: 'Sale deed of 2019 duly registered at the Sikar Sub-Registrar office.' },
      { name: 'Rajasthan Land Revenue Act 1956 · §142', note: 'Patwari record-of-rights to be summoned after document verification.' },
    ],
    parties: [
      { category: 'victim', name: 'Meena Devi', detail: 'Plaintiff · agriculturalist, Sikar. Claims recorded ownership of the 2.4-acre parcel; seeks declaration and permanent injunction.' },
      { category: 'suspect', name: 'Rajesh Kumar', detail: 'Respondent · adjoining landowner disputing the boundary; relies on the 2023 private demarcation map.' },
      { category: 'witness', name: 'Patwari Singhvi', detail: 'Revenue officer, Sikar circle · maintains the record-of-rights; summons to issue after document verification.' },
      { category: 'witness', name: 'Adv. P. Jain', detail: 'Court commissioner · conducted the 18 Jul 2026 demarcation; report and sealed sample deposited with the registry.' },
    ],
    timeline: [
      { label: 'Plaint filed', date: '03 Feb 2026 · 09:42', done: true, summary: 'Suit for declaration and permanent injunction filed with eleven document exhibits.', participants: ['Adv. A. Gupta', 'Meena Devi'], outcome: 'Registry scrutiny passed; summons issued.' },
      { label: 'Notice issued to respondent', date: '15 Mar 2026', done: true, summary: 'Respondent served; the court directed maintenance of status quo on the parcel until further orders.', outcome: 'Status-quo direction in force.' },
      { label: 'Written statement received', date: '22 May 2026', done: true, summary: 'Respondent denies the boundary claim and files a counter-claim alleging encroachment by the plaintiff.', outcome: 'Replication filed 05 Jun 2026.' },
      { label: 'Court commission for demarcation', date: '18 Jul 2026', done: true, summary: 'Local demarcation conducted by a court-appointed commissioner; the contested boundary-stone sample was sealed.', participants: ['Adv. P. Jain', 'Registrar A. Kapoor'], outcome: 'Report and sample deposited in registry custody.' },
      { label: 'Evidence stage hearing', date: '24 Sep 2026', active: true, summary: 'Verification of the patwari record and the 2023 survey map listed; two registry documents remain unverified.' },
      { label: 'Final hearing', date: 'TBD', done: false },
    ],
    graph: {
      sub: 'Meena vs Rajesh · CPC Order 39',
      nodes: [
        { id: 'plaintiff', label: 'Plaintiff', sub: 'Meena Devi', x: 95, y: 130, role: 'victim', info: 'Claims recorded ownership of the 2.4-acre parcel via a registered 2019 sale deed.' },
        { id: 'respondent', label: 'Respondent', sub: 'Rajesh Kumar', x: 540, y: 130, role: 'suspect', info: 'Disputes the recorded boundaries and alleges encroachment on the parcel.' },
        { id: 'property', label: 'Property', sub: '2.4 acres, Sikar', x: 318, y: 155, role: 'incident', info: 'Subject land parcel; boundaries are contested between the parties.' },
        { id: 'documents', label: 'Records', sub: '2 pending', x: 130, y: 330, role: 'evidence', info: 'Patwari records and the survey map remain unverified by the court registry.' },
        { id: 'court', label: 'Court', sub: 'District Court', x: 475, y: 340, role: 'location', info: 'District Court, Jaipur. The matter is at the evidence stage.' },
        { id: 'patwari', label: 'Patwari', sub: 'Sikar circle', x: 150, y: 45, role: 'witness', info: 'Revenue officer who maintains the land records; summons to issue after document verification.' },
        { id: 'survey', label: 'Survey map', sub: '2023 demarcation', x: 500, y: 45, role: 'evidence', info: 'Private demarcation map; conflicts with the respondent’s report on the boundary stone position.' },
      ],
      edges: [
        { from: 'plaintiff', to: 'property', label: 'claims' },
        { from: 'respondent', to: 'property', label: 'disputes' },
        { from: 'property', to: 'documents', label: 'recorded in' },
        { from: 'property', to: 'court', label: 'listed at' },
        { from: 'patwari', to: 'documents', label: 'maintains' },
        { from: 'patwari', to: 'property', label: 'measured' },
        { from: 'survey', to: 'property', label: 'demarcates' },
        { from: 'survey', to: 'court', label: 'filed with' },
        { from: 'respondent', to: 'survey', label: 'relies on', suspected: true },
        { from: 'plaintiff', to: 'respondent', label: 'boundary dispute with', suspected: true },
        { from: 'plaintiff', to: 'court', label: 'filed plaint at' },
        { from: 'respondent', to: 'court', label: 'summoned by' },
      ],
    },
  },
  {
    caseId: 'CY/042/2026',
    title: 'Anita vs City Bank',
    statute: 'Consumer Protection Act 2019',
    court: 'Consumer Forum, Jaipur',
    stage: 'Under review',
    station: 'Cyber PS (orig. complaint)',
    priority: 'LOW',
    openedOn: '10 Apr 2026',
    nextHearing: '01 Oct 2026',
    daysLeft: 12,
    description:
      'Ms. Anita Sharma filed a consumer complaint against City Bank Ltd. for an unauthorized deduction of ₹48,000 from her savings account in March 2026. Despite written complaints and an RBI Ombudsman escalation, the bank has not refunded the amount. The case involves digital transaction records and bank correspondence; the forum review is listed for October.',
    facts: [
      '₹48,000 was debited from the complainant’s savings account on 07 Mar 2026 in three transactions she never initiated.',
      'Written complaints were escalated to the bank three times between Mar and Apr 2026; the bank replied once, denying liability.',
      'The complaint was escalated to the RBI Integrated Ombudsman on 02 Aug 2026 before approaching the forum.',
      'The bank statement and dispute form establish the debits; the bank has not produced the OTP or device trail.',
    ],
    statutes: [
      { name: 'CPA 2019 · §35', note: 'Consumer complaint filed before the District Commission, Jaipur — refund, interest and costs claimed.' },
      { name: 'RBI Integrated Ombudsman Scheme 2021', note: 'Escalation completed; reference number on record, deemed unresolved after 30 days.' },
      { name: 'Evidence Act · §65B', note: 'Certified bank statement pending from the City Bank nodal officer.' },
    ],
    parties: [
      { category: 'victim', name: 'Anita Sharma', detail: 'Complainant · salaried account holder. Seeking refund of ₹48,000, interest, and ₹25,000 towards litigation cost.' },
      { category: 'suspect', name: 'City Bank Ltd.', detail: 'Respondent · has not produced the transaction device trail; denied liability in a single written reply.' },
      { category: 'witness', name: 'Nodal Officer, City Bank', detail: 'Represented the bank in ombudsman proceedings; summons for production of records.' },
      { category: 'witness', name: 'RBI Ombudsman Office', detail: 'Reference No. RBI/IO/2026-27/1143 · deemed unresolved, enabling the forum route.' },
    ],
    timeline: [
      { label: 'Complaint filed', date: '10 Apr 2026 · 11:20', done: true, summary: 'Complaint filed before the District Consumer Commission, Jaipur claiming refund, interest and compensation.', participants: ['Anita Sharma', 'Adv. on record'], outcome: 'Case number assigned; admissibility cleared.' },
      { label: 'Notice to bank', date: '28 Apr 2026', done: true, summary: 'Bank served with the complaint and a 30-day written-reply window.', outcome: 'Acknowledgment received from the bank’s legal cell.' },
      { label: 'Bank written reply (denial)', date: '20 Jun 2026', done: true, summary: 'Bank denies liability citing “authorised 3D-Secure usage”; no device or OTP evidence enclosed.', outcome: 'Complainant filed a rejoinder 02 Jul 2026.' },
      { label: 'RBI Ombudsman escalation', date: '02 Aug 2026', done: true, summary: 'Escalated to the RBI Integrated Ombudsman after non-resolution; reference taken and 30-day window expired.', outcome: 'Deemed unresolved — forum route cleared.' },
      { label: 'Forum review', date: '01 Oct 2026', active: true, summary: 'Admission and interim hearing listed; the bank is directed to produce the transaction device trail.' },
      { label: 'Order', date: 'TBD', done: false },
    ],
    graph: {
      sub: 'Anita vs City Bank · CPA 2019',
      nodes: [
        { id: 'complainant', label: 'Complainant', sub: 'Anita Sharma', x: 90, y: 150, role: 'victim', info: 'Account holder disputing an unauthorized deduction of ₹48,000 in March 2026.' },
        { id: 'bank', label: 'Respondent', sub: 'City Bank Ltd.', x: 545, y: 150, role: 'suspect', info: 'Has not refunded the amount despite written complaints and escalations.' },
        { id: 'dispute', label: 'Dispute', sub: '₹48,000 deduction', x: 318, y: 240, role: 'incident', info: 'Unauthorized deduction from the savings account, raised as a consumer complaint.' },
        { id: 'digital', label: 'Evidence', sub: 'Digital records', x: 320, y: 75, role: 'evidence', info: 'Bank statements and the transaction dispute form establish the deduction.' },
        { id: 'forum', label: 'Forum', sub: 'Consumer Forum', x: 318, y: 360, role: 'location', info: 'Consumer Forum, Jaipur. The complaint is under review; order is pending.' },
        { id: 'ombudsman', label: 'RBI Ombudsman', sub: 'Reference taken', x: 100, y: 58, role: 'location', info: 'Complaint escalated to the RBI Integrated Ombudsman before approaching the Consumer Forum.' },
        { id: 'emails', label: 'Email trail', sub: '3 escalations', x: 560, y: 58, role: 'evidence', info: 'Three written escalation emails from March–April; the bank replied once denying liability.' },
      ],
      edges: [
        { from: 'complainant', to: 'dispute', label: 'filed' },
        { from: 'bank', to: 'dispute', label: 'respondent in' },
        { from: 'dispute', to: 'digital', label: 'proven by' },
        { from: 'dispute', to: 'forum', label: 'listed at' },
        { from: 'dispute', to: 'ombudsman', label: 'escalated via' },
        { from: 'complainant', to: 'emails', label: 'wrote' },
        { from: 'emails', to: 'bank', label: 'notice to' },
        { from: 'digital', to: 'bank', label: 'issued by' },
        { from: 'digital', to: 'complainant', label: 'provided by' },
        { from: 'bank', to: 'forum', label: 'reply on record' },
        { from: 'complainant', to: 'ombudsman', label: 'reference taken' },
      ],
    },
  },
];

/* ------------------------------------------------------------- documents */

export const DMS_DOCUMENTS: DmsDocument[] = [
  { id: 'd1', name: 'FIR_124_2026.pdf', type: 'FIR', caseId: 'CR/124/2026', department: 'Jaipur Police', uploadedBy: 'SI R. Sharma', uploadedAt: '19 Sep 2026 · 10:14', status: 'Verified', version: 3, hash: '7a42…b18f', signed: true, legalHold: true, sharedWithSurya: true },
  { id: 'd2', name: 'CCTV_65B_Certificate_DRAFT.pdf', type: 'Electronic evidence', caseId: 'CR/124/2026', department: 'Forensic Lab', uploadedBy: 'Dr. R. Iyer', uploadedAt: '19 Sep 2026 · 11:02', status: 'Flagged', version: 1, hash: 'd9c0…9e31', signed: false, legalHold: true, sharedWithSurya: false },
  { id: 'd2b', name: 'CCTV_Footage_Certificate.pdf', type: 'Electronic evidence', caseId: 'CR/124/2026', department: 'Forensic Lab', uploadedBy: 'Dr. R. Iyer', uploadedAt: '19 Sep 2026 · 11:02', status: 'Verified', version: 1, hash: 'd9c0…9e31', signed: true, legalHold: true, sharedWithSurya: true },
  { id: 'd3', name: 'Forensic_Report_17.pdf', type: 'Forensic report', caseId: 'CR/124/2026', department: 'Forensic Lab', uploadedBy: 'Dr. R. Iyer', uploadedAt: '19 Sep 2026 · 11:38', status: 'Verified', version: 2, hash: '4f70…0a12', signed: true, legalHold: true, sharedWithSurya: true },
  { id: 'd4', name: 'Witness_Statement_RM_161.pdf', type: 'Witness statement', caseId: 'CR/124/2026', department: 'Jaipur Police', uploadedBy: 'SI R. Sharma', uploadedAt: '18 Sep 2026 · 16:20', status: 'Pending verification', version: 1, hash: 'c64e…ee90', signed: false, legalHold: true, sharedWithSurya: false },
  { id: 'd5', name: 'Charge_Sheet_Draft.pdf', type: 'Court filing', caseId: 'CR/124/2026', department: 'Public Prosecutor', uploadedBy: 'Adv. K. Sharma', uploadedAt: '17 Sep 2026 · 15:08', status: 'Verified', version: 4, hash: 'bc19…5d08', signed: true, legalHold: true, sharedWithSurya: true },
  { id: 'd6', name: 'Notice_to_Respondent.pdf', type: 'Legal notice', caseId: 'CV/081/2026', department: 'Legal Department', uploadedBy: 'A. Gupta', uploadedAt: '16 Sep 2026 · 09:42', status: 'Verified', version: 1, hash: 'ab27…2c44', signed: true, legalHold: false, sharedWithSurya: true },
  { id: 'd7', name: 'Registered_Sale_Deed_2019.pdf', type: 'Title record', caseId: 'CV/081/2026', department: 'Sub-Registrar Sikar', uploadedBy: 'A. Gupta', uploadedAt: '15 Sep 2026 · 14:05', status: 'Verified', version: 1, hash: '33de…91aa', signed: true, legalHold: false, sharedWithSurya: true },
  { id: 'd8', name: 'Survey_Demarcation_2023.pdf', type: 'Survey record', caseId: 'CV/081/2026', department: 'Revenue Department', uploadedBy: 'Patwari Singhvi', uploadedAt: '14 Sep 2026 · 12:30', status: 'Pending verification', version: 1, hash: '5b8f…77d2', signed: false, legalHold: false, sharedWithSurya: false },
  { id: 'd9', name: 'Bank_Statement_Mar2026.pdf', type: 'Electronic record', caseId: 'CY/042/2026', department: 'City Bank Nodal', uploadedBy: 'Complainant (via forum)', uploadedAt: '12 Sep 2026 · 10:55', status: 'Verified', version: 1, hash: '88c1…4402', signed: true, legalHold: false, sharedWithSurya: true },
  { id: 'd10', name: 'Transaction_Dispute_Form.pdf', type: 'Consumer filing', caseId: 'CY/042/2026', department: 'Consumer Forum', uploadedBy: 'Forum Registry', uploadedAt: '11 Sep 2026 · 16:40', status: 'Verified', version: 1, hash: 'a1f4…c887', signed: true, legalHold: false, sharedWithSurya: true },
  { id: 'd11', name: 'RBI_Ombudsman_Reference.pdf', type: 'Grievance record', caseId: 'CY/042/2026', department: 'RBI Ombudsman', uploadedBy: 'Forum Registry', uploadedAt: '10 Sep 2026 · 09:15', status: 'Verified', version: 1, hash: '7d20…b5c3', signed: true, legalHold: false, sharedWithSurya: false },
  { id: 'd12', name: 'Scene_Photographs_Set1.zip', type: 'Photographic evidence', caseId: 'CR/124/2026', department: 'Jaipur Police', uploadedBy: 'SI R. Sharma', uploadedAt: '12 Jan 2026 · 12:40', status: 'Verified', version: 1, hash: '0f3e…21b7', signed: true, legalHold: true, sharedWithSurya: false },
];

/* ------------------------------------------------------------- access requests */

export type AccessRequest = {
  id: string;
  requester: string;          // officer name
  requesterId: string;        // officer unique ID
  requesterRole: string;
  caseId: string;             // requested case
  reason: string;             // description
  status: 'pending' | 'approved' | 'rejected';
  at: string;
  decidedBy?: string;
  decidedAt?: string;
};

export const SEED_ACCESS_REQUESTS: AccessRequest[] = [
  {
    id: 'ar1',
    requester: 'Dr. R. Iyer',
    requesterId: 'FO-2026-0451',
    requesterRole: 'Forensic Officer',
    caseId: 'CV/081/2026',
    reason: 'Soil sample comparison from the Sikar parcel may connect with exhibits seized in CR/124/2026; need the demarcation survey map.',
    status: 'pending',
    at: '19 Sep 2026 · 12:05',
  },
];

/* ------------------------------------------------------------- access history */

export type AccessEvent = {
  id: string;
  at: string;
  actor: string;
  actorRole: string;
  caseId: string;
  document: string;
  action: 'opened' | 'verified' | 'shared' | 'requested';
  detail?: string;
};

export const SEED_ACCESS_EVENTS: AccessEvent[] = [
  { id: 'h1', at: '19 Sep 2026 · 11:52', actor: 'Registrar A. Kapoor', actorRole: 'Court / Registrar Staff', caseId: 'CR/124/2026', document: 'Charge_Sheet_Draft.pdf', action: 'opened' },
  { id: 'h2', at: '19 Sep 2026 · 11:41', actor: 'Dr. R. Iyer', actorRole: 'Forensic Officer', caseId: 'CR/124/2026', document: 'Forensic_Report_17.pdf', action: 'opened' },
  { id: 'h3', at: '19 Sep 2026 · 11:38', actor: 'Adv. K. Sharma', actorRole: 'Public Prosecutor', caseId: 'CR/124/2026', document: 'FIR_124_2026.pdf', action: 'verified' },
  { id: 'h4', at: '19 Sep 2026 · 10:20', actor: 'SI R. Sharma', actorRole: 'Investigating Officer', caseId: 'CR/124/2026', document: 'FIR_124_2026.pdf', action: 'opened' },
  { id: 'h5', at: '18 Sep 2026 · 17:02', actor: 'Adv. Vikram Rao', actorRole: 'S.U.R.Y.A. lawyer (read-only)', caseId: 'CR/124/2026', document: 'Charge_Sheet_Draft.pdf', action: 'opened', detail: 'Permissioned cross-system read via Assistance Suite' },
];

/* ------------------------------------------------------------- helpers */

export const docsForCase = (caseId: string): DmsDocument[] => DMS_DOCUMENTS.filter(d => d.caseId === caseId);
export const caseById = (caseId: string): DmsCase | undefined => DMS_CASES.find(c => c.caseId === caseId);
