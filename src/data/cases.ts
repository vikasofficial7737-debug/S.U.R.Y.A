export const REAL_CASES = [
  {
    id: 'state-singh', title: 'State vs. R. Singh', ipc: 'IPC 302 – Murder', court: 'Sessions Court, Jaipur', date: '20 Sep 2026', daysLeft: 1, priority: 'HIGH', judge: 'Hon. Justice A.K. Mehta', status: 'Trial in Progress',
    description: 'The accused, Rajesh Singh, is charged under IPC Section 302 for the alleged murder of Sohan Lal on 12 January 2024. The prosecution has presented CCTV footage, a forensic report, and eyewitness testimony by Rajesh Meena. The defense claims alibi. Next hearing is for cross-examination of the forensic expert.',
    timeline: [{ label: 'FIR Filed', date: '12 Jan 2024', done: true }, { label: 'Charge Sheet', date: '5 Mar 2024', done: true }, { label: 'Witness Exam', date: '20 Apr 2026', done: true }, { label: 'Arguments', date: '10 Aug 2026', done: true }, { label: 'Next Hearing', date: '20 Sep 2026', done: false, active: true }, { label: 'Judgment', date: 'TBD', done: false }],
    evidence: ['CCTV Footage (Verified)', 'Forensic Report (Verified)', 'Eyewitness Statement – Rajesh Meena', 'Mobile Call Records', 'Site Photographs'],
    chartData: [65, 72, 58, 80, 75, 88, 70],
    graphSub: 'State vs. R. Singh · IPC 302',
    nodes: [
      { id: 'victim', label: 'Victim', sub: 'Sohan Lal', x: 50, y: 210, color: '#2e7d32', bg: '#e8f5e9' },
      { id: 'accused', label: 'Accused', sub: 'R. Singh', x: 260, y: 60, color: '#c62828', bg: '#ffebee' },
      { id: 'witness', label: 'Witness', sub: 'Rajesh Meena', x: 470, y: 210, color: '#1565c0', bg: '#e3f2fd' },
      { id: 'incident', label: '⚖ Incident', sub: '12 Jan 2024', x: 260, y: 210, color: '#8b6914', bg: '#fff8e1' },
      { id: 'evidence', label: 'Evidence', sub: '4 verified files', x: 90, y: 340, color: '#616161', bg: '#f5f5f5' },
      { id: 'court', label: 'Court', sub: '20 Sep 2026', x: 430, y: 340, color: '#7b1fa2', bg: '#f3e5f5' },
    ],
    edges: [['victim', 'incident'], ['accused', 'incident'], ['witness', 'incident'], ['incident', 'evidence'], ['incident', 'court']]
  },
  {
    id: 'meena-rajesh', title: 'Meena vs. Rajesh', ipc: 'CPC Order 39', court: 'District Court, Jaipur', date: '24 Sep 2026', daysLeft: 5, priority: 'MEDIUM', judge: 'Hon. Justice S.R. Gupta', status: 'Documents Pending',
    description: 'A civil property dispute between Ms. Meena Devi and Mr. Rajesh Kumar over a 2.4 acre land parcel in Sikar district. The plaintiff claims recorded ownership via registered sale deed (2019). The respondent disputes boundaries and alleges encroachment. 2 key documents remain unverified by the court registry.',
    timeline: [{ label: 'Plaint Filed', date: '3 Feb 2025', done: true }, { label: 'Notice Issued', date: '15 Mar 2025', done: true }, { label: 'Written Statement', date: '22 May 2025', done: true }, { label: 'Evidence Stage', date: '24 Sep 2026', done: false, active: true }, { label: 'Final Hearing', date: 'TBD', done: false }],
    evidence: ['Registered Sale Deed 2019', 'Patwari Records (Pending)', 'Survey Map (Pending)', 'Photographs of Boundary'],
    chartData: [40, 55, 50, 63, 58, 70, 65],
    graphSub: 'Meena vs. Rajesh · CPC Order 39',
    nodes: [
      { id: 'plaintiff', label: 'Plaintiff', sub: 'Meena Devi', x: 70, y: 170, color: '#2e7d32', bg: '#e8f5e9' },
      { id: 'respondent', label: 'Respondent', sub: 'Rajesh Kumar', x: 450, y: 170, color: '#c62828', bg: '#ffebee' },
      { id: 'property', label: '⚖ Property', sub: '2.4 Acres, Sikar', x: 260, y: 170, color: '#8b6914', bg: '#fff8e1' },
      { id: 'documents', label: 'Records', sub: '2 pending', x: 150, y: 320, color: '#616161', bg: '#f5f5f5' },
      { id: 'court', label: 'Court', sub: 'District Court', x: 370, y: 320, color: '#7b1fa2', bg: '#f3e5f5' },
    ],
    edges: [['plaintiff', 'property'], ['respondent', 'property'], ['property', 'documents'], ['property', 'court']]
  },
  {
    id: 'anita-citybank', title: 'Anita vs. City Bank', ipc: 'Consumer Act', court: 'Consumer Forum', date: '01 Oct 2026', daysLeft: 12, priority: 'LOW', judge: 'President, Forum', status: 'Under Review',
    description: 'Ms. Anita Sharma has filed a consumer complaint against City Bank Ltd. for unauthorized deduction of ₹48,000 from her savings account in March 2026. Despite written complaints and escalations, the bank has not refunded the amount. The case involves digital transaction records and bank correspondence.',
    timeline: [{ label: 'Complaint Filed', date: '10 Apr 2026', done: true }, { label: 'Bank Notice', date: '28 Apr 2026', done: true }, { label: 'Written Reply', date: '20 Jun 2026', done: true }, { label: 'Review', date: '01 Oct 2026', done: false, active: true }, { label: 'Order', date: 'TBD', done: false }],
    evidence: ['Bank Statement (March 2026)', 'Transaction Dispute Form', 'Email Correspondence (3 emails)', 'RBI Grievance Reference'],
    chartData: [30, 45, 38, 55, 52, 60, 58],
    graphSub: 'Anita vs. City Bank · Consumer Act',
    nodes: [
      { id: 'complainant', label: 'Complainant', sub: 'Anita Sharma', x: 80, y: 200, color: '#2e7d32', bg: '#e8f5e9' },
      { id: 'bank', label: 'Respondent', sub: 'City Bank Ltd.', x: 440, y: 200, color: '#c62828', bg: '#ffebee' },
      { id: 'dispute', label: '⚖ Dispute', sub: '₹48,000 deduction', x: 260, y: 200, color: '#8b6914', bg: '#fff8e1' },
      { id: 'digital', label: 'Evidence', sub: 'Digital Records', x: 260, y: 60, color: '#616161', bg: '#f5f5f5' },
      { id: 'forum', label: 'Court', sub: 'Consumer Forum', x: 260, y: 320, color: '#7b1fa2', bg: '#f3e5f5' },
    ],
    edges: [['complainant', 'dispute'], ['bank', 'dispute'], ['dispute', 'digital'], ['dispute', 'forum']]
  }
];
