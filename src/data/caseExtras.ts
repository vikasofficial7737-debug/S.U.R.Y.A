import type { CaseExtra } from './clientRequests';

/* Deep-dive content per demo case. New cases created from the form get a
   generic starter set (see buildStarterExtras). */

export const CASE_EXTRAS: Record<string, CaseExtra> = {
  'state-singh': {
    facts: [
      'Accused Rajesh Singh and the deceased Sohan Lal were neighbours in the same locality for over six years.',
      'The incident occurred on the night of 12 Jan 2024 near the rear lane of the accused’s residence.',
      'CCTV from a neighbouring shop recorded a person matching the accused’s build at 21:14 hrs.',
      'The post-mortem (AIIMS Jaipur panel) lists the cause of death as blunt-force injury; time of death estimated between 20:30 and 22:00.',
      'The accused claims he was at a relative’s house across town when the incident occurred (alibi).',
    ],
    victims: [
      { name: 'Sohan Lal', detail: 'Deceased, 46. Daily-wage worker. Survived by spouse and two children. Family has been provided compensation under the Rajasthan Victim Compensation Scheme (interim). The complainant in the FIR is the victim’s brother.' },
    ],
    witnesses: [
      { name: 'Rajesh Meena', role: 'Eyewitness', status: 'Examined 20 Apr 2026; cross-examination pending' },
      { name: 'Dr. S. Kaul', role: 'Autopsy surgeon', status: 'Report on record; to be cross-examined at next hearing' },
      { name: 'Const. B. Sharma', role: 'Investigating officer witness', status: 'Documents seized under memo dated 14 Jan 2024' },
    ],
    detailedTimeline: [
      { label: 'FIR registered', date: '12 Jan 2024', done: true, summary: 'FIR No. 22/2024 at PS Jhotwara under IPC 302, based on the brother’s complaint lodged at 23:40.', participants: ['Complainant (brother of deceased)', 'IO Const. B. Sharma'], outcome: 'Case registered; scene secured.' },
      { label: 'Accused arrested', date: '16 Jan 2024', done: true, summary: 'Arrest from the accused’s residence; personal effects seized including footwear matching scene impressions.', participants: ['Accused', 'IO team'], outcome: 'Produced before Magistrate within 24 hrs; 3-day PC remand.' },
      { label: 'Charge sheet filed', date: '5 Mar 2024', done: true, summary: 'Charge sheet with 31 witnesses and 9 documents. Court took cognizance under IPC 302.', participants: ['Prosecution'], outcome: 'Charges framed 18 Mar 2024; accused pleaded not guilty.' },
      { label: 'Witness examined', date: '20 Apr 2026', done: true, summary: 'PW-1 Rajesh Meena supported the prosecution on identification and timing. Defence suggested a delay in the FIR and shifting statements.', participants: ['PW-1 Rajesh Meena', 'PP', 'Defence counsel'], outcome: 'Examination-in-chief recorded; cross deferred.' },
      { label: 'Arguments (first)', date: '10 Aug 2026', done: true, summary: 'Court heard interim applications including defence prayer for CCTV authentication certificate under Section 65B.', participants: ['PP', 'Defence counsel'], outcome: 'Direction to produce 65B certificate by next hearing.' },
      { label: 'Cross-examination of forensic expert', date: '20 Sep 2026', active: true, summary: 'Dr. Kaul to be cross-examined on chain-of-custody and injury-to-weapon consistency. Defence expected to press the alibi and the 65B objection.', participants: ['Dr. S. Kaul (PW)', 'PP', 'Defence counsel'], outcome: 'Listed as the next substantive hearing.' },
      { label: 'Final arguments', date: 'TBD', summary: 'To be scheduled after the remaining prosecution witnesses.' },
      { label: 'Judgment', date: 'TBD', summary: 'Reserved for pronouncement after final arguments.' },
    ],
    caseFile: [
      { id: 'cf1', name: 'CCTV footage (shop camera) — 12 Jan 21:00–21:40', kind: 'video', source: 'IO memo, 14 Jan 2024', added: '14 Jan 2024', note: '65B certificate pending — flagged for next hearing.' },
      { id: 'cf2', name: 'Post-mortem report', kind: 'document', source: 'AIIMS Jaipur panel', added: '18 Jan 2024', note: 'Cause of death: blunt-force injury.' },
      { id: 'cf3', name: 'Eyewitness statement — Rajesh Meena (PW-1)', kind: 'document', source: 'Recorded u/s 161 CrPC', added: '13 Jan 2024' },
      { id: 'cf4', name: 'Mobile call records — accused', kind: 'document', source: 'Service provider (court-directed)', added: '2 Feb 2024', note: 'Tower dump shows device 4.2 km from scene at 21:10 — supports alibi review.' },
      { id: 'cf5', name: 'Scene photographs (9)', kind: 'image', source: 'Forensic team', added: '13 Jan 2024' },
      { id: 'cf6', name: 'Seizure memo (footwear, weapon suspect)', kind: 'document', source: 'IO', added: '16 Jan 2024' },
    ],
    statuteNotes: [
      { section: 'IPC 302', note: 'Punishment for murder. Charge framed 18 Mar 2024.' },
      { section: 'Sec 65B, Evidence Act', note: 'CCTV certificate requirement — defence objection pending.' },
      { section: 'Sec 161 CrPC', note: 'Three material witnesses recorded; two ran back from earlier statements.' },
    ],
  },

  'meena-rajesh': {
    facts: [
      'The suit parcel measures 2.4 acres in Sikar district, recorded in the plaintiff’s name via a registered sale deed dated 2019.',
      'The respondent claims the boundary stone was moved and asserts occupation over the northern 0.3 acres.',
      'Patwari records and the 2023 survey map remain unverified by the court registry.',
      'Both parties conducted private demarcation; the reports conflict on the stone position.',
    ],
    victims: [
      { name: 'Meena Devi', detail: 'Plaintiff. Claims recorded title since 2019 and peaceful possession. Seeks permanent injunction against the disputed strip.' },
    ],
    witnesses: [
      { name: 'Patwari (Sikar)', role: 'Revenue records witness', status: 'Summons to issue after document verification' },
      { name: 'Ramesh Saini', role: 'Neighbouring owner', status: 'Cited by respondent for boundary history' },
    ],
    detailedTimeline: [
      { label: 'Plaint filed', date: '3 Feb 2025', done: true, summary: 'Suit for declaration and permanent injunction with the 2019 sale deed as Ex-A1.', participants: ['Plaintiff', 'Counsel'], outcome: 'Registry objections raised on court fees.' },
      { label: 'Notice issued', date: '15 Mar 2025', done: true, summary: 'Summons issued to respondent with a copy of the plaint and Ex-A1.', participants: ['Court', 'Respondent'], outcome: 'Service completed 27 Mar 2025.' },
      { label: 'Written statement', date: '22 May 2025', done: true, summary: 'Respondent denies encroachment; asserts a 1998 family arrangement and pleads adverse possession in the alternative.', participants: ['Respondent', 'Counsel'], outcome: 'Issues framed on title, boundary and limitation.' },
      { label: 'Evidence stage', date: '24 Sep 2026', active: true, summary: 'Registry verification of patwari records and survey map is the gating item. Both sides to produce demarcation reports.', participants: ['Registry', 'Both parties'], outcome: 'Two documents pending verification.' },
      { label: 'Commission of local survey', date: 'TBD', summary: 'Likely direction if the survey map dispute persists.' },
      { label: 'Final hearing', date: 'TBD', summary: 'To be scheduled after evidence closes.' },
    ],
    caseFile: [
      { id: 'cf1', name: 'Registered sale deed (2019) — Ex-A1', kind: 'document', source: 'Sub-registrar, Sikar', added: '3 Feb 2025', note: 'Verified.' },
      { id: 'cf2', name: 'Patwari record extract', kind: 'document', source: 'Tehsil office', added: '10 Feb 2025', note: 'Verification pending at registry.' },
      { id: 'cf3', name: 'Survey map (2023 demarcation)', kind: 'image', source: 'Private surveyor', added: '12 Feb 2025', note: 'Verification pending at registry.' },
      { id: 'cf4', name: 'Boundary photographs (6)', kind: 'image', source: 'Plaintiff', added: '3 Feb 2025' },
      { id: 'cf5', name: 'Respondent’s private demarcation report', kind: 'document', source: 'Respondent', added: '22 May 2025', note: 'Conflicts with Ex-A2 on stone position.' },
    ],
    statuteNotes: [
      { section: 'CPC Order 39', note: 'Interim injunction application pending; listed with evidence stage.' },
      { section: 'Sec 34, Specific Relief Act', note: 'Declaration of title is the principal relief sought.' },
      { section: 'Limitation Act, Art. 65', note: 'Limitation plea raised by respondent; to be argued at final hearing.' },
    ],
  },

  'anita-citybank': {
    facts: [
      '₹48,000 was debited from the complainant’s savings account on 4 Mar 2026 in two transactions.',
      'The complainant’s debit card was in her possession; OTP-based authentication is shown in the bank’s log.',
      'Three written escalation emails were sent in March–April; the bank replied once, citing “authorized transaction”.',
      'An RBI ombudsman reference was taken before filing before the Consumer Forum.',
    ],
    victims: [
      { name: 'Anita Sharma', detail: 'Complainant/account holder. Salary account holder with the same bank since 2016; no prior disputes.' },
    ],
    witnesses: [
      { name: 'Bank Nodal Officer', role: 'Respondent representative', status: 'Reply letter dated 20 Jun 2026 on record' },
      { name: 'Mr. D. Shah', role: 'Fraud analyst (bank)', status: 'Expected to produce transaction logs at review' },
    ],
    detailedTimeline: [
      { label: 'Unauthorized debits', date: '4 Mar 2026', done: true, summary: 'Two debits totalling ₹48,000 from the savings account within 40 minutes.', participants: ['Unknown'], outcome: 'Complainant blocked the card the same day.' },
      { label: 'Complaint to bank', date: '5 Mar 2026', done: true, summary: 'Immediate written complaint and card freeze confirmation.', participants: ['Complainant', 'Bank'], outcome: 'Ticket raised; no provisional credit.' },
      { label: 'Notice to bank', date: '28 Apr 2026', done: true, summary: 'Legal notice seeking refund and compensation for deficiency in service.', participants: ['Counsel', 'Bank'], outcome: 'Bank replied denying liability.' },
      { label: 'Written reply received', date: '20 Jun 2026', done: true, summary: 'Bank’s reply relies on OTP authentication and its terms of service.', participants: ['Bank Nodal Officer'], outcome: 'Reply letter in the forum record.' },
      { label: 'Forum review', date: '01 Oct 2026', active: true, summary: 'Review of pleadings and marking of exhibits; transaction logs expected from the bank.', participants: ['Forum', 'Both parties'], outcome: 'Listed for review.' },
      { label: 'Evidence and arguments', date: 'TBD', summary: 'Affidavit of evidence and written arguments to follow.' },
    ],
    caseFile: [
      { id: 'cf1', name: 'Bank statement (March 2026)', kind: 'document', source: 'Bank', added: '6 Mar 2026', note: 'Marks both debits.' },
      { id: 'cf2', name: 'Transaction dispute form', kind: 'document', source: 'Complainant', added: '5 Mar 2026' },
      { id: 'cf3', name: 'Escalation emails (3)', kind: 'document', source: 'Complainant', added: '28 Apr 2026' },
      { id: 'cf4', name: 'Bank reply letter', kind: 'document', source: 'Bank Nodal Officer', added: '20 Jun 2026', note: 'Denies liability citing OTP authentication.' },
      { id: 'cf5', name: 'RBI ombudsman reference', kind: 'document', source: 'RBI CMS portal', added: '2 May 2026' },
    ],
    statuteNotes: [
      { section: 'Consumer Protection Act, 2019', note: 'Deficiency in service and unfair trade practice are the twin pleas.' },
      { section: 'RBI circular on customer liability', note: 'Zero-liability in third-party breach with limited customer contribution — key for the OTP argument.' },
    ],
  },
};

/** Starter deep-dive content for a case created from the New case form. */
export function buildStarterExtras(title: string, description: string, nextHearing: string, priority: string): CaseExtra {
  return {
    facts: [
      description || 'Facts are being compiled. Update this list as the matter develops.',
    ],
    victims: [
      { name: 'Primary party', detail: 'Details of the affected party are being compiled for this new matter.' },
    ],
    witnesses: [],
    detailedTimeline: [
      { label: 'Case opened', date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), done: true, summary: `Workspace created for ${title}.`, participants: ['Counsel'], outcome: 'Intake notes drafted.' },
      { label: 'Fact verification', date: 'TBD', summary: 'Verify the client instructions against documents received.' },
      { label: 'Next hearing', date: nextHearing, active: true, summary: `Matter listed (${priority} priority).`, outcome: 'To be updated after the hearing.' },
    ],
    caseFile: [
      { id: 'cf1', name: 'Intake notes (draft)', kind: 'document', source: 'Client instructions', added: 'On creation', note: 'Draft — verify before use.' },
      { id: 'cf2', name: 'Client instructions memo', kind: 'document', source: 'Client', added: 'On creation' },
    ],
    statuteNotes: [],
  };
}
