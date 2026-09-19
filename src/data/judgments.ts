export type Judgment = {
  id: string;
  title: string;
  shortTitle: string;
  citation: string;
  court: string;
  year: number;
  date: string;
  bench: string;
  area: string;
  tags: string[];
  summary: string;
  facts: string;
  issues: string[];
  holding: string;
  ratio: string;
  significance: string;
  statutes: string[];
  sourceUrl: string;
};

/** Real landmark Indian judgments — summaries for research/education only. */
export const JUDGMENTS: Judgment[] = [
  {
    id: 'praful-desai',
    title: 'State of Maharashtra v. Dr. Praful B. Desai',
    shortTitle: 'State of Maharashtra v. Praful Desai',
    citation: '(2003) 4 SCC 601',
    court: 'Supreme Court of India',
    year: 2003,
    date: '1 April 2003',
    bench: 'S.N. Variava, B.N. Agrawal, JJ.',
    area: 'Criminal Procedure · Evidence',
    tags: ['video conferencing', 'evidence', 'section 273 crpc', 'criminal trial', 'witness'],
    summary: 'The Supreme Court held that evidence in a criminal trial may be recorded by video conferencing. Such recording satisfies the requirement of the accused’s presence under Section 273 of the Code of Criminal Procedure when proper safeguards are followed.',
    facts: 'In a criminal prosecution, the prosecution sought to examine a witness (a doctor based abroad) through video conferencing. The Bombay High Court held that Section 273 CrPC required the physical presence of the accused when evidence is recorded and therefore barred video-conferencing. Appeals were filed before the Supreme Court.',
    issues: [
      'Whether evidence in a criminal trial can be recorded by video conferencing.',
      'Whether video-conferenced testimony satisfies the accused’s right to be present under Section 273 CrPC.',
    ],
    holding: 'Evidence may be recorded by video conferencing. Presence of the accused under Section 273 CrPC need not mean physical presence in the same room if the accused can see, hear, and cross-examine the witness through electronic means under court-supervised arrangements.',
    ratio: 'Criminal procedure must be interpreted purposively. Advances in technology that enable effective presence, confrontation, and cross-examination without compromising fairness are consistent with Section 273 CrPC.',
    significance: 'Opened the path for remote recording of evidence in Indian criminal trials and is frequently cited for virtual court processes and examination of overseas witnesses.',
    statutes: ['Code of Criminal Procedure, 1973 — Section 273', 'Indian Evidence Act, 1872'],
    sourceUrl: 'https://indiankanoon.org/doc/560467/',
  },
  {
    id: 'puttaswamy',
    title: 'Justice K.S. Puttaswamy (Retd.) & Anr. v. Union of India & Ors.',
    shortTitle: 'K.S. Puttaswamy v. Union of India',
    citation: '(2017) 10 SCC 1',
    court: 'Supreme Court of India',
    year: 2017,
    date: '24 August 2017',
    bench: 'Nine-Judge Bench (J.S. Khehar, C.J. and others)',
    area: 'Constitutional Law · Privacy',
    tags: ['privacy', 'article 21', 'fundamental rights', 'aadhaar', 'personal liberty'],
    summary: 'A nine-judge Bench unanimously held that the right to privacy is a fundamental right protected under Articles 14, 19 and 21 of the Constitution of India, overruling earlier contrary holdings.',
    facts: 'Challenges relating to the Aadhaar programme raised the question whether privacy is a constitutionally protected right. Earlier decisions in M.P. Sharma and Kharak Singh had been read to deny a fundamental right to privacy. The matter was referred to a nine-judge Bench.',
    issues: [
      'Whether privacy is a fundamental right under the Constitution of India.',
      'What is the constitutional basis and contours of such a right?',
    ],
    holding: 'Privacy is an intrinsic part of life and personal liberty under Article 21 and of the freedoms in Part III. Any State restriction must satisfy legality, a legitimate aim, and proportionality.',
    ratio: 'Dignity, autonomy and liberty are inseparable from privacy. Constitutional silence does not defeat an essential facet of personal liberty in a democratic republic.',
    significance: 'Foundational privacy judgment of India; shapes data protection, surveillance review, bodily autonomy, and later decisions including challenges to Aadhaar and Section 377.',
    statutes: ['Constitution of India — Articles 14, 19 and 21'],
    sourceUrl: 'https://main.sci.gov.in/',
  },
  {
    id: 'lalita-kumari',
    title: 'Lalita Kumari v. Government of Uttar Pradesh & Ors.',
    shortTitle: 'Lalita Kumari v. Govt. of UP',
    citation: '(2014) 2 SCC 1',
    court: 'Supreme Court of India',
    year: 2013,
    date: '12 November 2013',
    bench: 'P. Sathasivam, C.J.; B.S. Chauhan; Ranjana Prakash Desai; Ranjan Gogoi; S.A. Bobde, JJ.',
    area: 'Criminal Procedure · FIR',
    tags: ['fir', 'section 154 crpc', 'cognizable offence', 'police', 'preliminary inquiry'],
    summary: 'Registration of an FIR under Section 154 CrPC is mandatory if information discloses a cognizable offence. Preliminary inquiry is permitted only in limited categories and only to ascertain whether a cognizable offence is disclosed—not to test truthfulness.',
    facts: 'The petitioner alleged that the police refused to register an FIR despite a complaint disclosing a cognizable offence. The larger question of mandatory FIR registration under Section 154 CrPC was placed before a Constitution Bench.',
    issues: [
      'Whether police must register an FIR whenever information discloses a cognizable offence.',
      'When, if at all, a preliminary inquiry is permissible before FIR registration.',
    ],
    holding: 'FIR registration is mandatory when a cognizable offence is disclosed. Preliminary inquiry may be conducted in specified situations (for example, matrimonial/family disputes, commercial offences, medical negligence, corruption) within a short time frame. Closure after inquiry must be communicated to the complainant.',
    ratio: 'Section 154(1) uses mandatory language and does not condition registration on the officer’s assessment of credibility. Prompt FIR registration protects both the victim and the integrity of investigation.',
    significance: 'Controlling authority on FIR registration duties of police across India; routinely relied on in writ petitions for direction to register FIRs.',
    statutes: ['Code of Criminal Procedure, 1973 — Section 154'],
    sourceUrl: 'https://indiankanoon.org/doc/1027467/',
  },
  {
    id: 'kesavananda',
    title: 'Kesavananda Bharati Sripadagalvaru v. State of Kerala',
    shortTitle: 'Kesavananda Bharati v. State of Kerala',
    citation: '(1973) 4 SCC 225',
    court: 'Supreme Court of India',
    year: 1973,
    date: '24 April 1973',
    bench: 'Thirteen-Judge Bench',
    area: 'Constitutional Law · Basic Structure',
    tags: ['basic structure', 'amendment', 'article 368', 'constitution', 'judicial review'],
    summary: 'The Court propounded the Basic Structure doctrine: Parliament may amend the Constitution under Article 368, but cannot destroy its basic structure or essential features.',
    facts: 'Challenges to Kerala land reform laws and constitutional amendments raising the extent of Parliament’s amending power were heard by the largest Bench in Indian constitutional history.',
    issues: [
      'Whether Parliament’s power to amend the Constitution under Article 368 is unlimited.',
      'Whether fundamental rights and other essential features can be abrogated by amendment.',
    ],
    holding: 'Parliament’s amending power is wide but not unlimited. Amendments that damage or destroy the basic structure of the Constitution are ultra vires.',
    ratio: 'The Constitution is a living instrument with enduring identity. The power to amend is not the power to repeal or destroy the Constitution’s core framework.',
    significance: 'Cornerstone of Indian constitutionalism; repeatedly applied to test constitutional amendments.',
    statutes: ['Constitution of India — Article 368', 'Fundamental Rights — Part III'],
    sourceUrl: 'https://indiankanoon.org/doc/257876/',
  },
  {
    id: 'maneka-gandhi',
    title: 'Maneka Gandhi v. Union of India',
    shortTitle: 'Maneka Gandhi v. Union of India',
    citation: '(1978) 1 SCC 248',
    court: 'Supreme Court of India',
    year: 1978,
    date: '25 January 1978',
    bench: 'Seven-Judge Bench',
    area: 'Constitutional Law · Personal Liberty',
    tags: ['article 21', 'due process', 'passport', 'personal liberty', 'procedure established by law'],
    summary: 'Expanded Article 21: “procedure established by law” must be fair, just and reasonable. Articles 14, 19 and 21 form an integrated code of rights.',
    facts: 'The petitioner’s passport was impounded under the Passport Act without furnishing reasons. She challenged the action as violating Articles 14, 19 and 21.',
    issues: [
      'Whether the procedure for depriving personal liberty under Article 21 must be fair and reasonable.',
      'How Articles 14, 19 and 21 interrelate when State action restricts liberty.',
    ],
    holding: 'Any procedure that deprives life or personal liberty must be fair, just and reasonable—not arbitrary, fanciful or oppressive. Rights under Articles 14, 19 and 21 are not mutually exclusive silos.',
    ratio: 'A law or executive action affecting personal liberty must satisfy the tests of non-arbitrariness and reasonableness implicit in the constitutional scheme.',
    significance: 'Transformed Article 21 jurisprudence and remains a leading authority on substantive due process in India.',
    statutes: ['Constitution of India — Articles 14, 19, 21', 'Passports Act, 1967'],
    sourceUrl: 'https://indiankanoon.org/doc/1766147/',
  },
  {
    id: 'vishaka',
    title: 'Vishaka & Ors. v. State of Rajasthan & Ors.',
    shortTitle: 'Vishaka v. State of Rajasthan',
    citation: '(1997) 6 SCC 241',
    court: 'Supreme Court of India',
    year: 1997,
    date: '13 August 1997',
    bench: 'J.S. Verma, C.J.; Sujata V. Manohar; B.N. Kirpal, JJ.',
    area: 'Gender Justice · Workplace',
    tags: ['sexual harassment', 'workplace', 'gender', 'guidelines', 'article 21'],
    summary: 'In the absence of domestic legislation, the Court laid down binding Vishaka Guidelines against sexual harassment at the workplace, rooted in Articles 14, 19 and 21 and international conventions.',
    facts: 'A public interest petition followed the brutal gang rape of a social worker in Rajasthan and highlighted the absence of effective legal protection against sexual harassment at work.',
    issues: [
      'Whether the Court can frame enforceable guidelines against workplace sexual harassment pending legislation.',
      'What constitutional duties arise to protect women at the workplace.',
    ],
    holding: 'Sexual harassment at the workplace violates fundamental rights. Until Parliament legislates, the Vishaka Guidelines bind employers in public and private establishments.',
    ratio: 'International conventions and constitutional guarantees of equality and dignity may fill legislative gaps to protect fundamental rights.',
    significance: 'Led eventually to the Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013; still cited for workplace dignity principles.',
    statutes: ['Constitution of India — Articles 14, 15, 19, 21', 'CEDAW (guiding source)'],
    sourceUrl: 'https://indiankanoon.org/doc/1031794/',
  },
  {
    id: 'arnesh-kumar',
    title: 'Arnesh Kumar v. State of Bihar',
    shortTitle: 'Arnesh Kumar v. State of Bihar',
    citation: '(2014) 8 SCC 273',
    court: 'Supreme Court of India',
    year: 2014,
    date: '2 July 2014',
    bench: 'C.K. Prasad, P.C. Ghose, JJ.',
    area: 'Criminal Procedure · Arrest',
    tags: ['arrest', 'section 41 crpc', '498a', 'bail', 'police powers'],
    summary: 'Police must not automatically arrest in offences punishable with imprisonment up to seven years. Section 41 CrPC checklist and Magistrate scrutiny are mandatory to prevent unnecessary arrests.',
    facts: 'The petitioner sought anticipatory bail in a case under Section 498-A IPC. The Court used the occasion to address misuse of arrest powers in offences with punishment up to seven years.',
    issues: [
      'When can police arrest in offences punishable with imprisonment up to seven years?',
      'What safeguards apply before and after such arrests?',
    ],
    holding: 'Arrest is not automatic. Police must record reasons under Section 41 CrPC. Magistrates must examine those reasons before authorising detention. Non-compliance can attract departmental action.',
    ratio: 'Personal liberty cannot be sacrificed to routine arrests. Section 41 imposes a real filter of necessity and justification.',
    significance: 'Widely applied checklist judgment restricting mechanical arrests, especially in matrimonial and other cognizable offences with limited maximum punishment.',
    statutes: ['Code of Criminal Procedure, 1973 — Sections 41, 41A', 'Indian Penal Code — Section 498-A'],
    sourceUrl: 'https://indiankanoon.org/doc/2982624/',
  },
  {
    id: 'navtej-johar',
    title: 'Navtej Singh Johar & Ors. v. Union of India',
    shortTitle: 'Navtej Singh Johar v. Union of India',
    citation: '(2018) 10 SCC 1',
    court: 'Supreme Court of India',
    year: 2018,
    date: '6 September 2018',
    bench: 'Five-Judge Constitution Bench',
    area: 'Constitutional Law · Equality',
    tags: ['section 377', 'lgbtq', 'equality', 'privacy', 'article 14'],
    summary: 'Section 377 IPC was read down to decriminalise consensual sexual conduct between adults of the same sex, affirming dignity, equality and privacy.',
    facts: 'Petitions challenged the criminalisation of consensual same-sex relations under Section 377 IPC as violative of Articles 14, 15, 19 and 21.',
    issues: [
      'Whether Section 377 IPC, insofar as it criminalises consensual adult same-sex relations, is constitutional.',
      'How equality, dignity and privacy inform sexual orientation as a protected facet of identity.',
    ],
    holding: 'Consensual sexual acts between adults in private are not criminal. Section 377 continues to apply to non-consensual acts and acts involving minors or bestiality.',
    ratio: 'Majoritarian morality cannot override constitutional morality. Sexual orientation is intrinsic to identity and protected by equality and privacy.',
    significance: 'Landmark LGBTQ+ rights judgment; builds on Puttaswamy privacy doctrine.',
    statutes: ['Indian Penal Code — Section 377', 'Constitution of India — Articles 14, 15, 19, 21'],
    sourceUrl: 'https://indiankanoon.org/doc/168671544/',
  },
];

export type CitizenGuide = {
  id: string;
  title: string;
  area: string;
  summary: string;
  steps: string[];
  docs: string[];
  where: string;
  tags: string[];
};

export const CITIZEN_GUIDES: CitizenGuide[] = [
  {
    id: 'fir-guide',
    title: 'How to file an FIR',
    area: 'Criminal Procedure',
    summary: 'A First Information Report (FIR) is how the police formally record information about a cognizable offence. Under Lalita Kumari, police must register an FIR when a cognizable offence is disclosed.',
    steps: [
      'Go to the police station that has jurisdiction over the place of occurrence, or use the State online FIR facility where available.',
      'Give a clear written complaint with date, time, place, persons involved, and what happened.',
      'Ask for a free copy of the FIR after registration.',
      'If police refuse to register an FIR for a cognizable offence, you may approach the Superintendent of Police under Section 154(3) CrPC or file an application before the Magistrate under Section 156(3) CrPC.',
    ],
    docs: ['Identity proof', 'Written complaint', 'Supporting documents or medical reports if any'],
    where: 'Local police station / State police online portal / Magistrate under Section 156(3) CrPC',
    tags: ['fir', 'police', 'cognizable', 'complaint'],
  },
  {
    id: 'online-fraud',
    title: 'What to do after online fraud',
    area: 'Cybercrime',
    summary: 'Immediate reporting can help freeze funds and start investigation. Use the national cybercrime reporting channels along with your bank.',
    steps: [
      'Call 1930 immediately for financial cyber fraud.',
      'Report on https://cybercrime.gov.in and note the acknowledgement number.',
      'Inform your bank/UPI app in writing and request a freeze / chargeback where applicable.',
      'Preserve screenshots, transaction IDs, chat logs, and phone numbers.',
    ],
    docs: ['Transaction IDs', 'Bank statements', 'Screenshots of chats/URLs', 'Identity proof'],
    where: '1930 helpline · cybercrime.gov.in · your bank · local cyber cell',
    tags: ['fraud', 'upi', 'cyber', '1930', 'bank'],
  },
  {
    id: 'consumer',
    title: 'Understanding consumer complaints',
    area: 'Consumer Protection',
    summary: 'The Consumer Protection Act, 2019 allows consumers to complain against defective goods and deficient services before District, State or National Commissions depending on claim value.',
    steps: [
      'Send a written notice/complaint to the seller or service provider and keep proof of delivery.',
      'Collect bills, warranties, emails and photographs of the defect.',
      'File a complaint before the appropriate Consumer Commission (or use e-Daakhil where available).',
      'Seek refund, replacement, compensation or other relief as applicable.',
    ],
    docs: ['Invoice / bill', 'Warranty card', 'Correspondence with seller', 'Proof of deficiency'],
    where: 'District / State / National Consumer Disputes Redressal Commission · edaakhil.nic.in',
    tags: ['consumer', 'refund', 'complaint', 'goods', 'services'],
  },
];
