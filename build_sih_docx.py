"""
Generate SURYA_SIH_Slidewise_Content.docx — refined slide-wise content for
the SIH 2026 Idea Presentation, keyword-dense against the problem statement
(fabricated PS: Blockchain-Secured Digital Document & Case Management).

Run:  python build_sih_docx.py
"""
import os
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'SURYA_SIH_Slidewise_Content.docx')

INK = RGBColor(0x1F, 0x2A, 0x3A)
BLUE = RGBColor(0x1F, 0x4E, 0x79)
GOLD = RGBColor(0xB8, 0x86, 0x0B)
GREY = RGBColor(0x4A, 0x55, 0x64)

doc = Document()

# base style
st = doc.styles['Normal']
st.font.name = 'Calibri'
st.font.size = Pt(11)
st.font.color.rgb = INK

for sec in doc.sections:
    sec.top_margin = Inches(0.7)
    sec.bottom_margin = Inches(0.7)
    sec.left_margin = Inches(0.8)
    sec.right_margin = Inches(0.8)

def h1(text):
    p = doc.add_heading(level=0)
    r = p.add_run(text)
    r.font.size = Pt(22); r.font.color.rgb = INK; r.font.bold = True

def h2(text, color=BLUE):
    p = doc.add_heading(level=1)
    r = p.add_run(text)
    r.font.size = Pt(15); r.font.color.rgb = color; r.font.bold = True

def h3(text, color=GOLD):
    p = doc.add_heading(level=2)
    r = p.add_run(text)
    r.font.size = Pt(12.5); r.font.color.rgb = color; r.font.bold = True

def para(text, bold=False, color=None, size=11, italic=False, space_after=4):
    p = doc.add_paragraph()
    r = p.add_run(text)
    r.font.size = Pt(size); r.font.bold = bold; r.font.italic = italic
    if color: r.font.color.rgb = color
    p.paragraph_format.space_after = Pt(space_after)
    return p

def bullet(text, bold_prefix=None):
    p = doc.add_paragraph(style='List Bullet')
    if bold_prefix:
        r = p.add_run(bold_prefix)
        r.bold = True; r.font.color.rgb = BLUE
    r = p.add_run(text)
    r.font.size = Pt(10.5)
    p.paragraph_format.space_after = Pt(2)
    return p

def note(text):
    p = doc.add_paragraph()
    r = p.add_run(text)
    r.font.size = Pt(9.5); r.font.italic = True; r.font.color.rgb = GREY
    p.paragraph_format.space_after = Pt(8)

# ================= COVER =================
h1('S.U.R.Y.A. — Slide-wise Idea Presentation Content (SIH 2026)')
para('Smart Unified Resource for Judicial Assistance', bold=True, color=BLUE, size=13)
para('Problem Statement: Blockchain-Secured Digital Document & Case Management   |   Theme: Smart Justice & Public Safety   |   Category: Software', size=10.5, color=GREY)
para('')
note('How to use this document: each section below is the refined, final content for one slide of the official SIH 7-slide (6 usable) Idea Presentation format. Copy each block into the matching slide of SURYA_SIH_IDEA_Submission.pptx, or use it as your speaking script. Every line is deliberately keyword-dense against the problem statement language: blockchain-secured, digital document, case management, tamper-evident, access-controlled, auditable, case ID, role-based access, hash chain, chain-of-custody, version control, information silos, document friction, and more.')

# keyword map table
h2('Problem-Statement Keyword Map (weave these everywhere)')
kw = [
    ('From the PS', 'Appears in our deck as'),
    ('no single, indexed, searchable system of record', 'Unique Case ID — one indexed, searchable system of record'),
    ('no enforcement of who may view confidential material', 'Role-based access control (RBAC) + case-level permissions, admin-approved'),
    ('no cryptographic proof a document is unaltered', 'SHA-256 hash chain + Polygon anchoring — tamper-evident by design'),
    ('silent version conflicts', 'Immutable version control — corrections only as new anchored versions'),
    ('information silos; no shared record of access', 'Cross-department sharing with logged, permissioned access'),
    ('document friction delaying timelines', 'Retrieval in seconds by Case ID; AI-assisted search'),
    ('no immutable trail of custody and access', 'Append-only audit trail + digital chain-of-custody'),
    ('paper custody slips easy to lose or falsify', 'Digital chain-of-custody for evidence records'),
    ('citizens/lawyers/students have no simplified way to learn', 'Integrated Judicial Assistance suite on top of the record layer'),
]
tbl = doc.add_table(rows=len(kw), cols=2)
tbl.style = 'Light Grid Accent 1'
tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
for i, (a, b) in enumerate(kw):
    for j, t in enumerate((a, b)):
        cell = tbl.rows[i].cells[j]
        cell.text = t
        for pr in cell.paragraphs:
            for rr in pr.runs:
                rr.font.size = Pt(9.5)
                if i == 0: rr.font.bold = True
doc.add_page_break()

# ================= SLIDE 1 =================
h2('SLIDE 1 — Title Page')
h3('Fill on the portal / template:')
for line in [
    'Problem Statement ID : (as allotted)',
    'Problem Statement Title : Blockchain-Secured Digital Document & Case Management',
    'Theme : Smart Justice & Public Safety',
    'PS Category : Software',
    'Team ID : (as registered)',
    'Team Name (Registered on portal) : (as registered)',
]:
    bullet(line)
note('Speaking hook (10 sec): "Every FIR today takes a journey through scanners, cabinets and WhatsApp forwards. S.U.R.Y.A. gives it one tamper-evident, auditable digital life."')

# ================= SLIDE 2 =================
h2('SLIDE 2 — Proposed Solution (Describe your Idea/Solution/Prototype)')
h3('Title of slide:')
para('S.U.R.Y.A. — Blockchain-Secured Digital Document & Case Management Platform', size=11)
h3('Content:')
bullet('S.U.R.Y.A. (Smart Unified Resource for Judicial Assistance) is a blockchain-anchored digital Document Management System giving every case document — FIR, investigation record, witness statement, charge sheet, evidence record, forensic report, judgment — one tamper-evident, access-controlled, fully auditable digital life.')
bullet('How it addresses the problem:')
bullet('Unique Case ID (e.g. CR/124/2026) is the single key — retrieve all related documents instantly, ending scattered drives and email silos.', bold_prefix='• ')
bullet('Role-based access control (6 official roles) + case-level permission: cross-case needs go through access requests approved by the System Admin.', bold_prefix='• ')
bullet('SHA-256 hash chain + Polygon anchoring make tampering cryptographically detectable; corrections only as new ledger-anchored versions (version control).', bold_prefix='• ')
bullet('Every document open logged in an append-only audit trail; digital signatures & chain-of-custody for evidence records (IT Act §65B-ready).', bold_prefix='• ')
bullet('Innovation and uniqueness of the solution:')
bullet('Trust layer, not storage layer: only hashes go on-chain — tampering becomes detectable, not just harder.', bold_prefix='• ')
bullet('Connected Case Graph (embedded visual, live in prototype): AI-explained network of victim, accused, witness, evidence & court — surfaces suspected links like “prior enmity alleged” for verification; a first-of-its-kind bridge from a blockchain system of record to the integrated Judicial Assistance suite (citizen / lawyer / student).', bold_prefix='• ')
h3('Visual on slide:')
para('Connected Case Graph banner (CR/124/2026 — 9 entities, 14 links, dashed gold suspected link, AI key-finding pill).', italic=True, color=GREY)
note('Speaking hook (45 sec): point at the graph — "This is not a drawing; it is live in our prototype. The AI read this network and flagged the gold link as suspected. Tamper-evident records plus an explainable investigation graph — no team in this hall has both."')

# ================= SLIDE 3 =================
h2('SLIDE 3 — Technical Approach')
h3('Title of slide:')
para('TECHNICAL APPROACH', size=11)
h3('Content:')
bullet('Technologies to be used:')
bullet('React 18 + TypeScript (Vite SPA) · Supabase Postgres with Row-Level Security (13 RLS tables) · SHA-256 append-only hash ledger · Polygon Amoy anchoring (graceful offline fallback) · Google Gemini AI · DigiLocker-style Aadhaar-aligned OTP identity binding.', bold_prefix='• ')
bullet('Methodology and process for implementation:')
bullet('① Phone + OTP identity verification; phone ↔ Unique-ID binding enforced both ways.', bold_prefix='• ')
bullet('② Role-based dashboard loads the officer’s active caseload (unique case IDs).', bold_prefix='• ')
bullet('③ Case-centric repository: immutable viewer; every document open logged.', bold_prefix='• ')
bullet('④ Upload/view/correction → SHA-256 hash → ledger block → Polygon Amoy anchor.', bold_prefix='• ')
bullet('⑤ Cross-case need? Access request → System Admin approval → permissioned, logged access.', bold_prefix='• ')
bullet('⑥ AI assistant retrieves permissioned documents and explains the case graph (left).', bold_prefix='• ')
bullet('Architecture (block diagram, left): Users & access → application layer → security & governance → intelligence · data · trust (Gemini AI, Postgres RLS, SHA-256 + Polygon anchoring).', bold_prefix='• ')
h3('Visual on slide:')
para('Architecture block diagram, left column; methodology ①–⑥, right column.', italic=True, color=GREY)
note('Speaking hook (45 sec): walk the diagram top-down — users → app → security → engines. Stress "the suite never writes DMS core" and "only hashes go on-chain, files stay in governed storage".')

# ================= SLIDE 4 =================
h2('SLIDE 4 — Feasibility and Viability')
h3('Title of slide:')
para('FEASIBILITY AND VIABILITY', size=11)
h3('Content:')
bullet('Analysis of the feasibility of the idea:')
bullet('Working prototype already demonstrates every claimed flow: OTP identity → caseload → case workspace → immutable documents → hash anchoring → access-request approvals → audit history.', bold_prefix='• ')
bullet('Built entirely on managed, government-deployable infrastructure (Supabase/Postgres, public blockchain testnet) — no exotic hardware; runs on commodity cloud; aligns with MeitY cloud-first posture.', bold_prefix='• ')
bullet('Potential challenges and risks:')
bullet('Legacy migration of paper records at scale · bandwidth-constrained PSUs · field-officer usability · identity spoofing · chain bloat · legal admissibility of e-records.', bold_prefix='• ')
bullet('Strategies for overcoming these challenges:')
bullet('Phased rollout (digitize-in-flight cases → back-scanning drives) with OCR-assisted bulk ingestion · offline-first PWA + low-bandwidth fallbacks · on-chain anchors only (tiny, cheap) with re-anchoring batching · IT Act 2000 §65B-compliant certificates and audit exports for court admissibility.', bold_prefix='• ')
note('Speaking hook (40 sec): "Every flow we claim on this slide is demonstrable live, right now. Feasibility is not a promise here — it is a demo."')

# ================= SLIDE 5 =================
h2('SLIDE 5 — Impact and Benefits')
h3('Title of slide:')
para('IMPACT AND BENEFITS', size=11)
h3('Content:')
bullet('Potential impact on the target audience:')
bullet('Investigating officers & forensic labs: document retrieval in seconds by Case ID; zero ambiguity on “which version is current”; custody slips replaced by digital chain-of-custody.', bold_prefix='• ')
bullet('Courts & legal departments: verifiable, signed filings; disclosure workflows instead of email silos; faster hearings — less delay from document friction.', bold_prefix='• ')
bullet('Citizens, lawyers, students: the integrated S.U.R.Y.A. suite delivers legal aid, case learning and advocate verification on top of a trustworthy record layer.', bold_prefix='• ')
bullet('Benefits of the solution (social, economic, environmental, etc.):')
bullet('Social: witness & minor identity protection through enforced confidentiality; public trust via independent tamper-evidence.', bold_prefix='• ')
bullet('Economic: paper, courier, storage and re-work savings across police/forensic/court back offices; leakage and litigation risk reduced.', bold_prefix='• ')
bullet('Environmental: millions of printed pages eliminated each year. Governance fit: RTI support, retention schedules, auditable compliance — ready for Ministry-grade infrastructure.', bold_prefix='• ')
note('Speaking hook (40 sec): quantify the pain — "document friction is the delay between FIR and charge sheet that nobody investigates." Then land the governance fit line.')

# ================= SLIDE 6 =================
h2('SLIDE 6 — Research and References')
h3('Title of slide:')
para('RESEARCH AND REFERENCES', size=11)
h3('Content:')
for ref in [
    'IT Act 2000 & §65B Evidence Act certification requirements — indiacode.nic.in',
    'National Data Sharing & Accessibility Policy; MeitY cloud-first policy — meity.gov.in',
    'eCourts Mission Mode Project (Phase III) & Virtual Courts — ecourts.gov.in',
    'Interoperable Criminal Justice System (ICJS) — mha.gov.in',
    'CCTNS — crime and criminal tracking network — mha.gov.in',
    'NIST SP 800-63 Digital Identity Guidelines; W3C Verifiable Credentials — nist.gov, w3.org',
    'Ethereum/Polygon official docs (proof-of-stability anchoring patterns) — polygon.technology',
    'DigiLocker API ecosystem (issuer/requester architecture) — digilocker.gov.in',
    'IEEE papers on blockchain-based document integrity & chain-of-custody (hash-chaining, Merkle anchoring)',
]:
    bullet(ref, bold_prefix='• ')
note('Speaking hook (15 sec): "Our references are the government’s own programs — eCourts, ICJS, CCTNS, DigiLocker. We are not inventing a problem; we are completing their stack."')

doc.save(OUT)
print('saved:', OUT)
