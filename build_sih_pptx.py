"""
S.U.R.Y.A. — SIH 2026 Idea Presentation builder.
Edits the OFFICIAL SIH2026 template in place (fully compliant),
fills all 6 content slides, embeds the connected case-graph banner
(slide 2, Idea) and the architecture block diagram (slide 3, Technical
Approach), deletes the instructions slide (slide 7), and saves:
  - SURYA_SIH_IDEA_Submission.pptx  (editable)
  - SURYA_SIH_IDEA_Submission.pdf   (portal upload format)

Run:  python build_sih_pptx.py
"""
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

HERE = os.path.dirname(os.path.abspath(__file__))
TPL = os.path.join(HERE, 'SIH2026_Template.pptx')
BANNER = os.path.join(HERE, 'sih_assets', 'case_graph_banner.png')      # 1920x560
DIAGRAM = os.path.join(HERE, 'SURYA_Architecture_BlockDiagram_2K.png')  # 3840x2160
OUT_PPTX = os.path.join(HERE, 'SURYA_SIH_IDEA_Submission.pptx')
OUT_PDF = OUT_PPTX.replace('.pptx', '.pdf')

# ---------- brand ----------
INK = RGBColor(0x1F, 0x2A, 0x3A)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
BLUE = RGBColor(0x1F, 0x4E, 0x79)
GREY = RGBColor(0x4A, 0x55, 0x64)

# ---------- content (keyword-dense, trimmed to share slides with visuals) ----------
SLIDE2_TITLE = "S.U.R.Y.A. — Blockchain-Secured Digital Document & Case Management Platform"
SLIDE2 = [
    ("Proposed Solution (Describe your Idea/Solution/Prototype)", True),
    ("S.U.R.Y.A. (Smart Unified Resource for Judicial Assistance) is a blockchain-anchored digital Document Management System giving every case document — FIR, investigation record, witness statement, charge sheet, evidence record, forensic report, judgment — one tamper-evident, access-controlled, fully auditable digital life.", False),
    ("How it addresses the problem", True),
    ("• Unique Case ID (e.g. CR/124/2026) is the single key — retrieve all related documents instantly, ending scattered drives and email silos.", False),
    ("• Role-based access control (6 official roles) + case-level permission: cross-case needs go through access requests approved by the System Admin.", False),
    ("• SHA-256 hash chain + Polygon anchoring make tampering cryptographically detectable; corrections only as new ledger-anchored versions (version control).", False),
    ("• Every document open logged in an append-only audit trail; digital signatures & chain-of-custody for evidence records (IT Act §65B-ready).", False),
    ("Innovation and uniqueness of the solution", True),
    ("• Trust layer, not storage layer: only hashes go on-chain — tampering becomes detectable, not just harder.", False),
    ("• Connected Case Graph (below, live in prototype): AI-explained network of victim, accused, witness, evidence & court — reveals suspected links like “prior enmity alleged” for verification, a first-of-its-kind bridge from a blockchain system of record to the integrated Judicial Assistance suite (citizen / lawyer / student).", False),
]
SLIDE3 = [
    ("Technologies to be used", True),
    ("React 18 + TypeScript (Vite SPA) · Supabase Postgres with Row-Level Security (13 RLS tables) · SHA-256 append-only hash ledger · Polygon Amoy anchoring (graceful offline fallback) · Google Gemini AI · DigiLocker-style Aadhaar-aligned OTP identity binding.", False),
    ("Methodology and process for implementation", True),
    ("① Phone + OTP identity verification; phone ↔ Unique-ID binding enforced both ways.", False),
    ("② Role-based dashboard loads the officer's active caseload (unique case IDs).", False),
    ("③ Case-centric repository: immutable viewer; every document open logged.", False),
    ("④ Upload/view/correction → SHA-256 hash → ledger block → Polygon Amoy anchor.", False),
    ("⑤ Cross-case need? Access request → System Admin approval → permissioned, logged access.", False),
    ("⑥ AI assistant retrieves permissioned documents and explains the case graph (left).", False),
    ("Architecture (block diagram, left)", True),
    ("Users & access → application layer → security & governance → intelligence · data · trust (Gemini AI, Postgres RLS, SHA-256 + Polygon anchoring).", False),
]
SLIDE4 = [
    ("Analysis of the feasibility of the idea", True),
    ("• Working prototype already demonstrates every claimed flow: OTP identity → caseload → case workspace → immutable documents → hash anchoring → access-request approvals → audit history.", False),
    ("• Built entirely on managed, government-deployable infrastructure (Supabase/Postgres, public blockchain testnet) — no exotic hardware; runs on commodity cloud; aligns with MeitY cloud-first posture.", False),
    ("Potential challenges and risks", True),
    ("• Legacy migration of paper records at scale · bandwidth-constrained PSUs · field-officer usability · identity spoofing · chain bloat · legal admissibility of e-records.", False),
    ("Strategies for overcoming these challenges", True),
    ("• Phased rollout (digitize-in-flight cases → back-scanning drives) with OCR-assisted bulk ingestion · offline-first PWA + low-bandwidth fallbacks · on-chain anchors only (tiny, cheap) with re-anchoring batching · IT Act 2000 §65B-compliant certificates and audit exports for court admissibility.", False),
]
SLIDE5 = [
    ("Potential impact on the target audience", True),
    ("• Investigating officers & forensic labs: document retrieval in seconds by Case ID; zero ambiguity on “which version is current”; custody slips replaced by digital chain-of-custody.", False),
    ("• Courts & legal departments: verifiable, signed filings; disclosure workflows instead of email silos; faster hearings — less delay from document friction.", False),
    ("• Citizens, lawyers, students: the integrated S.U.R.Y.A. suite delivers legal aid, case learning and advocate verification on top of a trustworthy record layer.", False),
    ("Benefits of the solution (social, economic, environmental, etc.)", True),
    ("• Social: witness & minor identity protection through enforced confidentiality; public trust via independent tamper-evidence.", False),
    ("• Economic: paper, courier, storage and re-work savings across police/forensic/court back offices; leakage and litigation risk reduced.", False),
    ("• Environmental: millions of printed pages eliminated each year; Governance fit: RTI support, retention schedules, auditable compliance — ready for Ministry-grade infrastructure.", False),
]
SLIDE6 = [
    ("Details / Links of the reference and research work", True),
    ("• IT Act 2000 & §65B Evidence Act certification requirements — indiacode.nic.in", False),
    ("• National Data Sharing & Accessibility Policy; MeitY cloud-first policy — meity.gov.in", False),
    ("• eCourts Mission Mode Project (Phase III) & Virtual Courts — ecourts.gov.in", False),
    ("• Interoperable Criminal Justice System (ICJS) — mha.gov.in", False),
    ("• CCTNS — crime and criminal tracking network — mha.gov.in", False),
    ("• NIST SP 800-63 Digital Identity Guidelines; W3C Verifiable Credentials —nist.gov, w3.org", False),
    ("• Ethereum/Polygon official docs (proof-of-stability anchoring patterns) — polygon.technology", False),
    ("• DigiLocker API ecosystem (issuer/requester architecture) — digilocker.gov.in", False),
    ("• IEEE papers on blockchain-based document integrity & chain-of-custody (hash-chaining, Merkle anchoring).", False),
]

def set_lines(tf, lines, size=12.5):
    tf.clear()
    first = True
    for txt, is_head in lines:
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        r = p.add_run()
        r.text = txt
        f = r.font
        f.size = Pt(13 if is_head else size)
        f.bold = bool(is_head)
        f.name = 'Calibri'
        f.color.rgb = BLUE if is_head else INK
        p.space_after = Pt(3)
        p.line_spacing = 1.0

def body_frame(slide):
    for sh in slide.shapes:
        if sh.name == 'TextBox 8' and sh.has_text_frame:
            return sh
    return None

def title_frame(slide):
    for sh in slide.shapes:
        if sh.has_text_frame and 'Title' in sh.name:
            return sh
    return None

def set_title(slide, title):
    tf = title_frame(slide).text_frame
    tf.clear()
    p = tf.paragraphs[0]
    r = p.add_run(); r.text = title
    r.font.size = Pt(28); r.font.bold = True; r.font.name = 'Calibri'
    r.font.color.rgb = INK

def main():
    prs = Presentation(TPL)
    slides = list(prs.slides)
    assert len(slides) == 7

    # ---- Slide 1: title page (placeholders the team fills on the portal) ----
    s1 = slides[0]
    for sh in s1.shapes:
        if sh.name == 'TextBox 9' and sh.has_text_frame:
            tf = sh.text_frame
            vals = [
                "Problem Statement ID : ____________",
                "Problem Statement Title : Blockchain-Secured Digital Document & Case Management",
                "Theme : Smart Justice & Public Safety",
                "PS Category : Software",
                "Team ID : ____________",
                "Team Name (Registered on portal) : ____________",
            ]
            tf.clear()
            for i, v in enumerate(vals):
                p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
                r = p.add_run(); r.text = v
                r.font.size = Pt(17); r.font.name = 'Calibri'; r.font.color.rgb = INK
                p.space_after = Pt(10)

    # ---- Slide 2: IDEA — text on top, connected case-graph banner below ----
    s2 = slides[1]
    set_title(s2, SLIDE2_TITLE)
    b2 = body_frame(s2)
    set_lines(b2.text_frame, SLIDE2, size=12.0)
    b2.top, b2.left = Inches(1.28), Inches(0.45)
    b2.width, b2.height = Inches(12.45), Inches(3.10)
    # banner 1920x560 -> height 2.75in => width 9.43in, centered
    s2.shapes.add_picture(BANNER, Inches((13.33-9.43)/2), Inches(4.50), height=Inches(2.75))

    # ---- Slide 3: TECHNICAL APPROACH — diagram left, text right ----
    s3 = slides[2]
    set_title(s3, "TECHNICAL APPROACH")
    b3 = body_frame(s3)
    set_lines(b3.text_frame, SLIDE3, size=12.0)
    b3.top, b3.left = Inches(1.45), Inches(7.80)
    b3.width, b3.height = Inches(5.10), Inches(5.45)
    # diagram 16:9 -> width 7.05in, height 3.97in, left column
    s3.shapes.add_picture(DIAGRAM, Inches(0.42), Inches(1.75), width=Inches(7.05))

    # ---- Slides 4-6: full-width text ----
    for idx, (title, body) in [(3, ("FEASIBILITY AND VIABILITY", SLIDE4)),
                               (4, ("IMPACT AND BENEFITS", SLIDE5)),
                               (5, ("RESEARCH AND REFERENCES", SLIDE6))]:
        s = slides[idx]
        set_title(s, title)
        b = body_frame(s)
        set_lines(b.text_frame, body)
        b.top, b.left = Inches(1.30), Inches(0.45)
        b.width, b.height = Inches(12.45), Inches(5.55)

    # ---- Delete the instructions slide (slide 7) ----
    xml_slides = prs.slides._sldIdLst
    sldIds = list(xml_slides)
    xml_slides.remove(sldIds[6])

    prs.save(OUT_PPTX)
    print("saved:", OUT_PPTX)

    # ---- Export PDF via PowerPoint COM (fallback: skip) ----
    try:
        import win32com.client as w
        app = w.Dispatch('PowerPoint.Application')
        pres = app.Presentations.Open(OUT_PPTX, WithWindow=False)
        pres.SaveAs(OUT_PDF, 32)  # ppSaveAsPDF
        pres.Close(); app.Quit()
        print("saved:", OUT_PDF)
    except Exception as e:
        print("PDF export skipped (PowerPoint COM unavailable):", e)

if __name__ == '__main__':
    main()
