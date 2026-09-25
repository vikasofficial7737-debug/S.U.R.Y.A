NyayaVault --- National Blockchain-Secured Digital Document & Case
Management Platform

Complete Project Specification, Blockchain Architecture, Role-Based
Requirement Breakdown, Technology Stack & Full Website Design --- with
the S.U.R.Y.A. Legal Intelligence Suite as an Integrated Module

How to use this document: This is a single, self-contained build brief,
written the way a senior architect would hand it to a development team,
a design team, or an AI coding tool, with no open questions left for
guesswork. NyayaVault --- the blockchain-secured Document Management
System (DMS) --- is the primary product. Everything about identity,
navigation, branding, and the home page is designed around it.
S.U.R.Y.A. --- the existing AI citizen/lawyer/student assistant --- is
preserved exactly as it already works, and re-mounted as one integrated,
secondary module inside this platform, not the other way around.
Wherever this document says \"unchanged,\" it means: do not redesign
that feature, only relocate and re-connect it.

PART 1 --- COMPLETE PROJECT DESCRIPTION

1.1 Background

Law enforcement agencies, courts, legal departments, and investigative
organizations generate an enormous and continuously growing volume of
sensitive paperwork across the life of a single case --- FIRs and police
reports, investigation records, witness statements, charge sheets, court
filings, evidence records, forensic reports, and legal notices and
judgments. In most jurisdictions, including a large share of India\'s
own law-enforcement and judicial back office, this paperwork is still
handled through paper files, shared drives, department-specific
spreadsheets, and disconnected scanners rather than one governed system
of record.

This produces the same failure pattern everywhere it happens:

Difficulty locating documents quickly --- a charge sheet or witness
statement needed for a hearing tomorrow may be in a physical cabinet in
a different building, or a PDF buried in someone\'s inbox.

Unauthorized access to confidential information --- witness identities,
forensic details, and minors\' records sit in folders with no real
access control beyond \"don\'t open this.\"

Document tampering risk --- a scanned FIR or judgment, once it leaves
the registry, has no way to prove it hasn\'t been altered before it
reaches a court or a journalist.

Lack of version control --- when a charge sheet is revised, the old
version and the new one both circulate, and nobody can say with
certainty which is current.

Inefficient collaboration between departments --- police, forensic labs,
prosecution, and courts each keep their own copies, re-requesting the
same documents from each other by letter or email.

Delays in legal and investigative processes --- cases stall waiting for
a physical file to be located, couriered, or re-typed.

Poor auditability and compliance tracking --- when something goes wrong
(a leak, a missing file, a disputed edit), there is no reliable record
of who touched the document, when, and why.

At the same time, three existing technology trends make a real fix
possible now, rather than theoretical: cloud infrastructure mature
enough to host sovereign, government-grade storage; AI capable of
reading, classifying, and summarizing legal documents at scale; and
blockchain and digital-signature technology mature enough to make
tampering not just harder, but cryptographically detectable --- which is
the missing piece every paper-based or plain digital-storage system
lacks. Secure access control ties these together: none of this matters
if the wrong person can simply open the file.

The core gap: every one of the problems above is fundamentally a trust
and integrity problem, not a storage problem. Simply \"putting the files
in the cloud\" does not tell anyone whether the file they\'re looking at
is the same one that was originally filed. NyayaVault exists to close
that specific gap.

1.2 Problem Statement (Expanded)

Case documents are difficult to locate quickly because there is no
single, indexed, searchable system of record --- a document\'s location
depends on which department created it and how they happened to file it.

Confidential material (witness identities, minors\' details,
ongoing-investigation notes) has no real enforcement of who may view it
--- access today is closer to \"who has physical/folder access\" than
\"who is authorized under a defined policy.\"

Once a document leaves its originating desk, there is no cryptographic
way to prove it has not been altered --- a photocopied or re-scanned FIR
is, for practical purposes, unverifiable.

Revisions to charge sheets, statements, or filings create silent version
conflicts --- the \"current\" version is a matter of who you ask, not a
system fact.

Police, forensic labs, prosecution, and courts operate as information
silos; sharing a document across departments means re-sending it, with
no shared record of who has current access.

Investigative and legal timelines slip specifically because of document
friction --- waiting for a physical file, a signature, or a re-issued
copy is a process delay, not an investigative one.

When something goes wrong --- a leak, an allegedly-tampered document, a
missing exhibit --- there is no immutable, independently verifiable
trail of custody and access to establish what happened.

Physical evidence/exhibits (\"police assets\" in the source brief) move
between officers, labs, and storage with paper custody slips that are as
easy to lose or falsify as any other paper record --- the same integrity
gap as documents, applied to physical items.

Citizens, junior lawyers, and law students have no simplified way to
understand procedures or learn from real cases --- a related but
distinct gap that the existing S.U.R.Y.A. suite already addresses and
which this platform now builds on top of a trustworthy record layer.

1.3 Vision Statement

To build a secure, blockchain-anchored, AI-assisted national platform
that gives every legal and investigative document --- from the first FIR
to the final judgment --- a single, tamper-evident, access-controlled,
fully auditable digital life, and to layer intelligent, role-appropriate
assistance for citizens, lawyers, and law students directly on top of
that trustworthy record.

1.4 Objectives

\# Objective What success looks like

O1 Centralize document custody Every FIR, statement, filing, and report
lives in one governed system, not scattered drives/cabinets

O2 Make tampering detectable, not just harder Any alteration to a filed
document is cryptographically visible within seconds, not discovered
months later

O3 Enforce real confidentiality A user can only ever see what their role
and case-assignment permit --- enforced by the server, not hidden by the
UI

O4 Eliminate version ambiguity Exactly one document is ever \"current\"
for any given case artifact, with full version history preserved

O5 Enable safe inter-department collaboration Police, forensic labs,
prosecution, and courts share documents through a logged, permissioned
workflow, not email

O6 Provide a complete, independent audit trail Every view, edit, share,
and signature is recorded in an append-only log that no single role ---
including admins --- can alter

O7 Track physical evidence with the same rigor as documents Every
exhibit has a digital chain-of-custody record co-anchored with the
case\'s document trail

O8 Preserve and extend the existing AI assistant suite S.U.R.Y.A.\'s
citizen/lawyer/student experience keeps working exactly as designed, now
reading from real, permissioned case data

O9 Look and behave like critical government infrastructure Visual
language, security posture, and interaction patterns appropriate to a
Ministry of Law & Justice--grade system

1.5 Key Stakeholders & the Two-Module Relationship

Stakeholder Primary need Platform surface

Investigating Officer (Police) File FIRs, upload evidence, manage
exhibits, build a case NyayaVault (primary system)

Records Officer / Registrar Classify, verify, version-control, retain
documents NyayaVault

Forensic Analyst Submit reports tied to specific exhibits only
NyayaVault

Judicial Officer / Court Clerk File orders, digitally sign judgments,
grant disclosure NyayaVault

Compliance / System Administrator Govern users, roles, retention, and
the audit trail --- without reading case content NyayaVault

Practicing Lawyer Work their own cases, receive disclosed documents, get
AI summaries S.U.R.Y.A. module (reads permissioned NyayaVault data)

Citizen Understand rights and procedures, find a lawyer S.U.R.Y.A.
module (no NyayaVault access)

Law Student Learn from simplified, anonymized case studies S.U.R.Y.A.
module (public/redacted data only)

The relationship, stated plainly: NyayaVault is the system of record ---
the secure, blockchain-verified vault that every legal document and
evidence item actually lives in. S.U.R.Y.A. is a client of that record:
an AI-powered convenience layer for the three public/professional roles
that already existed. A lawyer\'s AI-generated case summary inside
S.U.R.Y.A. is only ever a summary of a document that physically lives,
and is verified, inside NyayaVault.

S.U.R.Y.A., spelled out (confirmed, as already implemented): Smart
Unified Resource for Judicial Assistance. This exact expansion is now
canon --- use it consistently on every screen, in every document, and in
all future prompts. It replaces any earlier draft expansion discussed
before the module was actually built.

1.6 Scope of Study

\# Scope area Description Primary contributors Deliverable

1 Secure Document Repository Central store for all 8 document categories
(FIRs, investigation records, witness statements, charge sheets, court
filings, evidence records, forensic reports, legal notices/judgments)
All institutional roles Classified, versioned, searchable repository

2 Blockchain Integrity Layer Tamper-evident hashing and lifecycle
anchoring for every document and exhibit Platform engineering
Permissioned blockchain ledger + public verification tool

3 Role-Based Access Control Genuinely distinct permissions per role,
enforced server-side Compliance/Admin Access-control matrix +
enforcement middleware

4 Digital Signatures Legally-recognizable e-signatures for judicial
sign-off and officer submissions Judicial Officers, IT Act compliance
PKI-backed signing integrated with document lifecycle

5 Evidence Chain-of-Custody Digital custody record for every physical
exhibit (\"police asset\") Investigating Officers, Forensic Labs
Custody-transfer ledger co-anchored to the blockchain

6 AI-Assisted Search & Classification Faster retrieval; AI-suggested
(human-confirmed) document classification Records Officers, all search
users Full-text + semantic search, classification assist

7 Cross-Department Collaboration Controlled sharing/disclosure workflow
between departments and to defense counsel All institutional roles
Disclosure request/approval workflow

8 Compliance & Audit Immutable audit trail, retention schedules, legal
holds Compliance/Admin Audit explorer + retention engine

9 S.U.R.Y.A. Integration Preserve and reconnect the existing
citizen/lawyer/student AI suite Existing SURYA codebase Read-scoped
bridge into NyayaVault data

10 Public Transparency RTI request handling, public
document-verification tool General public RTI portal + blockchain
verification page

PART 2 --- SOLUTION APPROACH

2.1 Design Principles

Blockchain as the trust layer, not the storage layer. Files are large,
frequently read, and sometimes need to be redacted or restricted ---
none of which belongs on a blockchain. Only cryptographic proof of a
document\'s existence, content-hash, and lifecycle transitions is
anchored on-chain. The file itself lives in encrypted, access-controlled
object storage.

Zero-trust, server-enforced access control. No permission check exists
only in the UI. Every API call independently re-verifies the caller\'s
role and case-assignment before returning data.

Separation of duties by design. The person who can administer the system
(Compliance/Admin) is deliberately not the person who can read case
content. The person who investigates a case is not the person who
verifies and files its documents. This is not a UI choice --- it is the
actual point of the role model (see 2.7).

Human-in-the-loop AI. AI may suggest a document\'s classification, a
summary, or a possible link between two case entities --- but a human
role must confirm anything that becomes part of the official record. AI
never signs, seals, classifies, or files anything by itself.

Immutable by default, reversible only by policy. Nothing is ever
silently overwritten. Corrections create new versions; deletions become
\"retired\" states with a reason and an authorizing signature, never a
hard delete of the audit trail.

Evidentiary-grade from day one. Every design decision --- hashing,
signatures, certificates for electronic records --- is made so that a
document produced by this system could actually be relied upon in court,
not just internally.

Sovereignty-conscious. Data, keys, and the blockchain network itself are
deployable entirely within government-controlled infrastructure (see
Part 4) --- no dependency on a public, permissionless chain or a
foreign-hosted mandatory service.

2.2 High-Level Architecture

Blockchain Layer --- Permissioned Consortium

Data & Storage Layer

Application Layer --- NestJS Services

API Gateway / BFF

Presentation Layer --- React 19 + TypeScript (Vite)

Public Internet

Institutional Users

Investigating Officer

Records Officer

Forensic Analyst

Judicial Officer

Compliance / Admin

Citizen

Law Student

Practicing Lawyer

General Public

NyayaVault Public Site

NyayaVault Institutional App

S.U.R.Y.A. Module

Auth-aware Gateway

Rate limiting · Request logging

Identity & RBAC Service

Document Lifecycle Service

Evidence & Custody Service

Search & AI Classification Service

Audit & Compliance Service

AI Proxy Service

server-side model calls

Disclosure & Collaboration Service

PostgreSQL

Users · Cases · Metadata

Encrypted Object Storage

MinIO / S3-compatible

Search Index

OpenSearch

Redis Cache

Hyperledger Fabric Network

Chaincode: Document Lifecycle

Chaincode: Chain-of-Custody

Chaincode: Signature Registry

Peer Nodes: Police · Judiciary · Forensic Lab · Compliance Authority

Reading this diagram: the frontend never talks to the blockchain or
object storage directly. Every request passes through the gateway and a
NestJS service, which independently checks identity and role before
touching PostgreSQL (fast metadata), object storage (the actual
encrypted files), the search index, or the Fabric network (integrity
proofs and lifecycle events). S.U.R.Y.A. is drawn as a peer application
to the institutional Vault app --- same gateway, same identity service,
but a narrower, read-scoped set of permissions.

2.3 Core Modules Mapped to Requirements

Module Solves

Document Lifecycle Service Locating documents quickly, version control

Blockchain Layer (Fabric + chaincode) Tampering risk, auditability

Identity & RBAC Service Unauthorized access

Evidence & Custody Service Physical exhibit (\"police asset\") integrity

Disclosure & Collaboration Service Inefficient inter-department
collaboration

Search & AI Classification Service Slow retrieval, manual classification
effort

Audit & Compliance Service Poor auditability, retention/compliance
tracking

AI Proxy Service Powers S.U.R.Y.A. safely, with the AI key never exposed
client-side

2.4 Non-Functional Requirements

Category Requirement

Security AES-256 at rest, TLS 1.3 in transit, HSM-backed signing keys,
MFA for all institutional accounts

Availability 99.9% target for the document/search layer; blockchain
network tolerant of a single peer node failure per organization

Performance Document retrieval \< 2s for indexed search; hash
verification \< 1s

Scalability Horizontally scalable application services; blockchain
throughput managed via batched/Merkle-anchored writes, not one
transaction per view event

Accessibility WCAG 2.1 AA on all public-facing pages; bilingual
English/Hindi throughout

Data Sovereignty Deployable entirely on government-empanelled cloud
(e.g., GI Cloud/MeghRaj) or on-prem; no mandatory external dependency
for the ledger

Compliance IT Act 2000 (electronic signatures), DPDP Act 2023 (personal
data), Bharatiya Sakshya Adhiniyam 2023 §61--63 (electronic evidence
admissibility), ISO/IEC 27001 alignment

Interoperability Exposed integration points for CCTNS (Crime and
Criminal Tracking Network & Systems) and e-Courts data exchange
standards

2.5 Data Governance & Standards

Document taxonomy (fixed, extensible): FIR & Police Report ·
Investigation Record · Witness Statement · Charge Sheet · Court Filing ·
Evidence Record · Forensic Report · Legal Notice / Judgment. Every
document must be classified into exactly one primary category at
ingestion.

Hashing standard: SHA-256 content hash computed at ingestion and at
every version; the hash, not the file, is what gets anchored on-chain.

Retention: every document category has a default statutory retention
period (configurable per department), with a legal-hold override that
suspends any retention countdown.

Redaction: a redacted copy is stored as a distinct, linked version ---
the original is never edited in place, so the chain-of-custody for the
unredacted original remains intact for authorized roles even after a
redacted copy is issued publicly.

2.6 Blockchain Design --- Deep Dive

This is the architectural centerpiece of the platform, so it is
specified in full rather than left as a one-line \"uses blockchain\"
note.

2.6.1 Network model: permissioned consortium, not a public chain. A
public/permissionless chain (Ethereum mainnet, etc.) is wrong for this
use case --- case data is sensitive, transaction costs are
unpredictable, and no government agency should depend on an external,
ungoverned validator set for evidentiary infrastructure. NyayaVault uses
Hyperledger Fabric, a permissioned blockchain where every node belongs
to a known, accountable organization.

2.6.2 Consortium members (peer nodes):

Organization Runs a peer for

State Police Department FIRs, investigation records, evidence submission
events

Judiciary / Court Registry Filings, judgments, digital signatures on
orders

Forensic Science Laboratory Forensic report submission and exhibit test
results

Central Compliance Authority Independent verification node --- cannot
originate documents, only observes and audits

Requiring at least the Compliance Authority\'s node to co-sign the
ordering of transactions means no single department --- including the
police who initiate most records --- can unilaterally rewrite history.

2.6.3 What goes on-chain vs. off-chain:

On-chain (Fabric ledger) Off-chain (PostgreSQL + object storage)

Document ID, case ID, SHA-256 hash, uploader identity, timestamp The
actual file bytes (PDF, image, scan)

Lifecycle state transitions (Uploaded → Verified → Signed → Filed →
Archived) Full-text content, OCR output, search index

Chain-of-custody transfer events (from officer, to officer/lab/court,
timestamp, both signatures) Free-text case notes, UI metadata

Digital signature records (who signed, what hash, when) Rendered
previews, thumbnails

2.6.4 Smart contracts (chaincode) --- three purpose-built contracts, not
one monolith:

Document Lifecycle Chaincode --- the only place a document\'s state can
legally change. Enforces that, e.g., only a Records Officer can move a
document from Verified to Filed, and that a Signed document\'s hash can
never be reassigned.

Chain-of-Custody Chaincode --- every exhibit transfer requires two
signatures (transferring custodian + receiving custodian) before the
transfer is accepted onto the ledger --- a two-party pattern that makes
a unilateral, falsified transfer impossible to record.

Signature Registry Chaincode --- records which PKI-backed digital
signature was applied to which document hash and when, independent of
the document service, so a signature\'s validity can be checked even if
the application layer is compromised.

2.6.5 Throughput management. Not every read/view event is written to the
blockchain individually --- that would not scale. View/access events are
logged immediately to the (equally tamper-evident, hash-chained)
off-chain audit log, and a Merkle root of each hour\'s audit log is
anchored to the chain, so the entire hour\'s activity can be proven
untampered by recomputing the root, without paying the transaction cost
of one write per view.

2.6.6 Public verifiability. A citizen, journalist, or opposing counsel
does not need blockchain access to check a document\'s integrity. They
use the public Verify a Document tool (Part 5, Page 4): submit a
document\'s reference ID (or upload a copy), the system recomputes its
hash and checks it against the on-chain record, and returns a
plain-language verdict --- \"Verified: matches the official record filed
on \[date\]\" or \"Not verified: this copy does not match the record on
file.\"

2.6.7 Digital signatures. Judicial Officers sign orders and judgments
using a PKI-backed Digital Signature Certificate (DSC) --- the same
class of credential recognized under India\'s IT Act 2000 --- issued
through the Compliance Authority\'s certificate process. A signature
event is written to the Signature Registry Chaincode and displayed on
the document as a verifiable badge, never as a plain image of a
signature.

PART 3 --- DETAILED REQUIREMENT BREAKDOWN

Each requirement from the original brief is expanded into what must
actually be built, who it affects, and how it is verified.

3.1 Centralized, Secure Document Repository

Digitization: upload flow accepts scans/photos/PDFs; runs OCR
automatically; flags low-quality scans for re-capture before acceptance.

Centralization: one canonical record per document, referenced (never
copied) across every case, department, or disclosure it\'s relevant to.

Verification: hash computed at ingestion, before any classification or
editing occurs, so the very first captured state is provable.

3.2 Secure Access & Confidentiality

Every document carries both a role requirement and a case-assignment
requirement --- a Records Officer must be a role that can see charge
sheets and be assigned to that specific case to open one.

Sensitivity flags (Standard / Restricted / Sealed) add a third gate ---
a Sealed document (e.g., naming a minor witness) requires an explicit,
logged, time-boxed grant even from an otherwise qualified role.

See the full Role-Based Access Control Matrix in Part 5.4 --- this
requirement is the direct answer to \"every role has its own features,
not the same list for every dashboard.\"

3.3 Tamper Prevention

Delivered by the blockchain layer (Part 2.6): any byte-level change to a
filed document changes its hash, which no longer matches the on-chain
record --- this is detected automatically, not discovered by chance.

The UI never allows in-place file replacement. \"Editing\" a filed
document always produces a new, separately-hashed version, preserving
the original.

3.4 Version Control

Every document has a visible version history: who created each version,
when, and why (a mandatory short reason field on any re-upload).

The \"current\" version is a system fact, computed from the lifecycle
state --- not a filename convention or a shared understanding.

3.5 Inter-Department Collaboration

A Disclosure & Collaboration workflow: one department (or a Judicial
Officer, for lawyer disclosure) requests or grants access to a specific
document or case-subset, with a reason, an expiry, and full audit
logging --- replacing today\'s email/letter exchange.

Forensic Labs receive exhibit-scoped access only --- a lab never sees a
full case file, only the specific evidence item they were assigned to
test.

3.6 Efficient Search & Retrieval

Full-text search across OCR\'d content, filterable by case, document
type, date range, and department.

AI-assisted semantic search (\"find documents referencing a stolen white
sedan\") as a layer on top of, not a replacement for, exact filters ---
because exact filters are what an evidentiary search needs to be
defensible.

AI-suggested document classification at upload, always requiring human
confirmation before it becomes the document\'s official category.

3.7 Auditability & Compliance

Append-only audit log: every view, download, edit, share, signature, and
permission change, attributed to a specific authenticated identity,
hash-chained hourly onto the blockchain (Part 2.6.5).

No role --- including Compliance/Admin --- can edit or delete an audit
entry. Admins can read the full trail; they cannot alter it. This
separation is itself logged and enforced at the chaincode level, not
just the application layer.

Retention schedules and legal holds are configurable per document
category, with automatic flagging (not automatic deletion) when a
retention period lapses.

3.8 Evidence / Exhibit Chain-of-Custody (\"Police Assets\")

(Resolving the ambiguity between the brief\'s document-management
description and its asset-lifecycle line: physical evidence is treated
as a first-class tracked entity, parallel to documents, inside the same
platform.)

Every physical exhibit (weapon, seized item, biological sample, digital
device) is registered with a QR/barcode-tagged digital record at
seizure.

Every custody transfer (officer → forensic lab → court → storage)
requires both parties\' digital sign-off before the ledger accepts it
(Part 2.6.4).

A gap in the custody chain --- an unsigned transfer, or a time gap
inconsistent with the transfer route --- surfaces automatically as a
flag on the case file, since it directly affects whether that evidence
is admissible.

3.9 S.U.R.Y.A. Module Integration

The existing citizen chatbot, lawyer workspace (including the
case-connection graph), and student case-study suite are preserved as-is
in scope and design --- this requirement is about reconnection, not
redesign.

The lawyer\'s case-connection graph now populates from real, disclosed
NyayaVault case data instead of demo data.

AI calls move server-side (Part 2.3, AI Proxy Service) --- closing the
browser-exposed-API-key gap the existing project\'s own README already
flagged --- and the AI proxy independently enforces that it can only
retrieve documents the requesting user is authorized to see, even though
the request originates from the \"friendlier\" S.U.R.Y.A. surface.

3.10 Public Transparency

A citizen-facing RTI (Right to Information) request page for requesting
non-confidential information about case status or public filings.

A citizen-facing Verify a Document page (Part 2.6.6) --- the platform\'s
blockchain guarantee made directly usable by the public, not just an
internal engineering claim.

PART 4 --- TECHNOLOGY STACK

Layer Technology Why

Frontend framework React 19 + TypeScript, built with Vite Already the
existing SURYA stack --- retained rather than replaced

Routing react-router-dom Needed once the platform has two top-level app
trees (Vault + SURYA) with nested authenticated routes; not yet present
in the current codebase

Styling Tailwind CSS Current repo has no styling system; needed to share
one consistent, government-appropriate design language across both
modules

Icons lucide-react Already in use --- retained

Internationalization i18next Bilingual English/Hindi across both public
site and institutional app

API layer NestJS (Node.js, TypeScript) Typed end-to-end with the
frontend; strong module boundaries map cleanly onto the service list in
Part 2.3

Primary database PostgreSQL Users, roles, case metadata, document
records, disclosure workflow state

Object storage MinIO (S3-compatible, self-hostable) Encrypted file
storage that can be deployed entirely within sovereign/government
infrastructure

Cache / sessions Redis Session state, rate-limit counters

Search OpenSearch Full-text search across OCR\'d content; open-source,
self-hostable

Blockchain platform Hyperledger Fabric Permissioned consortium model
(Part 2.6); each institutional organization runs its own peer

Chaincode language Go (or Node.js chaincode) Implements the three
contracts in Part 2.6.4

Identity & access Keycloak (OIDC/OAuth2) MFA, SSO-ready, maps cleanly to
the RBAC matrix (Part 5.4)

Digital signatures / PKI DSC-compliant signing service (IT Act
2000-aligned) Judicial e-signatures; integrates with the Signature
Registry Chaincode

Key management HashiCorp Vault / HSM-backed Signing keys and encryption
keys never touch application code directly

OCR Tesseract (self-hosted) with a managed-OCR fallback Digitization
step of ingestion (3.1)

AI (server-side only) Existing Gemini integration, proxied through the
AI Proxy Service No key ever reaches the browser; every AI call is
scoped to the caller\'s authorized documents

Containerization Docker + Kubernetes Independent scaling of application
services vs. the Fabric network

CI/CD GitLab CI or GitHub Actions Automated build/test/deploy pipeline

Monitoring Prometheus + Grafana Service health, including Fabric
peer/node health surfaced on the Admin blockchain monitor page

Hosting Government-empanelled cloud (e.g., GI Cloud/MeghRaj) or on-prem
data centre Data sovereignty requirement (Part 2.4)

PART 5 --- COMPLETE WEBSITE DESIGN

5.1 Design Language (Government-Grade Visual System)

This codifies the approved visual direction as the canonical design
system for every screen in both modules.

Element Specification

Institutional attribution bar Slim top strip above the main header:
\"Government of India · \[Department name\] (Demo)\" with a bilingual
EN/हिन्दी toggle at the far right

Product identity \"NyayaVault\" set in a serif display face (e.g.,
Source Serif 4 / Playfair Display), paired with a plain-sans subtitle:
\"Unified Legal & Judicial Records Platform\"

Mark A generic institutional icon --- a pillared building or a lock,
never the actual State Emblem --- used consistently as the platform\'s
icon

Color palette Deep navy (#0B2545--#12274A) and teal (#1F6F78--#2A8C93)
as primary institutional colors; a muted slate-blue accent for primary
buttons; reserve saffron/green tricolor accents only for the SURYA
section, keeping the Vault side deliberately more restrained and
official

Typography Serif for headings (authority, permanence), clean sans-serif
for body and UI (Public Sans / Inter)

Iconography Lock, shield, fingerprint/hash, and document icons for trust
badges; no decorative illustration on the institutional side ---
illustration is reserved for the SURYA public cards, which are allowed
to feel warmer

Trust badges Short chips such as \"RBAC access control,\" \"Hash-chain
integrity,\" \"Encrypted case files,\" shown near any primary action,
not just on the home page

Tone Formal, precise, procedural --- button labels read \"Secure sign
in,\" \"Submit for verification,\" \"Grant disclosure,\" never casual
phrasing

Motion Minimal; used only to communicate state changes (a document
moving lifecycle stages, a signature being applied), never for
decoration

5.1.1 Confirmed component patterns (already implemented --- treat as
locked, do not redesign)

Two patterns already exist in the live build and are approved as final.
They are documented here precisely so future prompts stop re-litigating
them.

A. The S.U.R.Y.A. module identity (its own internal hero, used inside
the module only, never on the NyayaVault home page hero):

A small rotating chakra/wheel glyph above the wordmark.

Eyebrow label \"WELCOME TO\" in wide letter-spacing, small caps.

\"S.U.R.Y.A.\" set in a large serif display face with a visible dot
between each letter (S.U.R.Y.A., not \"SURYA\") --- this dotted-acronym
treatment is intentional and should be used everywhere the name appears
in headings.

A three-segment saffron/neutral/green divider bar directly beneath the
wordmark.

Sub-tagline: \"AI-based legal and judicial support platform,\" and a
second line of supporting copy naming the three audiences (citizen,
lawyer, student).

A dark-mode toggle (moon/sun icon) in the top-right corner.

Where this appears now: this is the correct hero for the S.U.R.Y.A.
module\'s own landing screen (reached after clicking through from the
NyayaVault home page). It must be replaced on the platform\'s actual
home page by the NyayaVault hero described in Part 5.5, Page 1 --- the
two are not interchangeable, and the current build has the SURYA hero
sitting where the NyayaVault hero belongs. See Part 6 for the exact fix.

B. The role-selection card (approved, extend to all three roles, do not
restyle):

A rounded card, split into two visual zones: a tinted, colored top panel
(unique tint per role) containing a large line-art icon (a
scale-of-justice motif combined with a role-specific glyph --- a person
outline for Citizen, a briefcase for Lawyer, a mortarboard for Student),
and a white lower panel.

White panel contents, top to bottom: bold serif card title (\"I am a
Citizen\" / \"I am a Lawyer\" / \"I am a Student\"), one short
italic-free sub-line stating the value proposition, then a two-item
bullet list of the role\'s top features.

A full-width, flat-colored action bar at the very bottom of the card
reading \"Continue →\", color-matched to the card\'s role (amber/orange
for Citizen, navy/indigo for Lawyer, green for Student).

No border, a soft drop shadow, consistent corner radius across all three
cards.

This pattern is final. The only outstanding action on it is ensuring the
Student card exists and uses this exact pattern --- confirm in the live
build before assuming it needs to be built from scratch (Part 6).

5.2 Global Navigation & Layout

Public site header (unauthenticated): Attribution bar → logo + tagline →
primary nav (Home · Departments · RTI · Contact) → language toggle. No
role-specific navigation is shown until sign-in.

Institutional app shell (authenticated, NyayaVault): Left sidebar,
persistent across all Vault pages, rendered differently per role (not
the same list with items disabled --- see 5.4): sidebar entries only
exist if that role can use them. A top bar shows the signed-in
officer\'s name, role/designation, department, and a \"Back to public
site\" link. A persistent security footer states \"All activity on this
system is logged and monitored.\"

SURYA module shell: Retains its existing look and navigation pattern;
entered from the public landing page\'s \"Powered by S.U.R.Y.A.\"
section, with its own lightweight top bar (no institutional sidebar).

5.3 Site Map

disclosed documents only

Home / Landing

Institutional Sign-in

Departments

Verify a Document

RTI Request

Contact / Help / FAQ

About & Legal

Powered by SURYA section

Vault Command Center

Case File

Document Viewer

Upload / Digitization

Evidence & Chain-of-Custody

Search & Retrieval

Disclosure & Collaboration

Audit Trail Explorer

Blockchain Network Monitor

Admin Panel

SURYA --- Citizen Suite

SURYA --- Lawyer Workspace

SURYA --- Student Suite

5.4 The Role-Based Access Control Matrix

This table is the single source of truth for every \"who can do what\"
statement in the page descriptions that follow. Full = unrestricted
within their own scope. Scoped = only for cases/items they are assigned
to. Read-only = can view, cannot modify. --- = not available; the
feature does not appear in that role\'s interface at all, it is not
merely disabled.

Capability Investigating Officer Records Officer Forensic Analyst
Judicial Officer Compliance/Admin Lawyer (SURYA) Citizen (SURYA) Student
(SURYA)

Register new FIR / case Full --- --- --- --- --- --- ---

Upload investigation records/witness statements Scoped --- --- --- ---
--- --- ---

Upload forensic report --- --- Scoped (own exhibit only) --- --- --- ---
---

Verify & classify incoming document --- Scoped --- --- --- --- --- ---

Move document lifecycle state (Verified→Filed) --- Scoped --- Scoped
(orders/judgments) --- --- --- ---

Apply digital signature (e-sign orders/judgments) --- --- --- Scoped ---
--- --- ---

View full case file (own cases) Scoped Scoped --- Scoped --- --- --- ---

View exhibit-linked data only --- --- Scoped --- --- --- --- ---

Register/transfer physical evidence custody Scoped --- Scoped (receiving
only) --- --- --- --- ---

Grant disclosure to defense counsel --- --- --- Scoped --- --- --- ---

View disclosed documents only --- --- --- --- --- Scoped --- ---

Search across authorized documents Scoped Scoped Scoped (exhibits)
Scoped --- Scoped (disclosed) --- ---

View audit trail Own actions Own actions Own actions Own actions Full,
read-only --- --- ---

Edit or delete audit entries --- --- --- --- --- --- --- ---

Manage users & roles --- --- --- --- Full --- --- ---

Configure retention policy --- --- --- --- Full --- --- ---

Monitor blockchain network health --- --- --- --- Full --- --- ---

AI chat / legal guidance --- --- --- --- --- Full Full ---

AI case summarization (of disclosed docs) --- --- --- --- --- Full ---
---

Case connection graph --- --- --- --- --- Full (own disclosed cases) ---
---

Anonymized public judgment library --- --- --- --- --- --- --- Full

Submit RTI request --- --- --- --- --- --- Full Full

Public blockchain document verification --- --- --- --- --- Full Full
Full

This is deliberately not a matrix where every institutional role \"can
do everything, just with a lower badge\" --- an Investigating Officer
cannot verify or file their own submissions (separation of duties from
2.1.3), a Forensic Analyst never sees the surrounding case, and the
Compliance/Admin role that manages the whole system cannot read a single
case document\'s content.

5.5 Page-by-Page Design --- Public Pages

Page 1 --- Home / Landing

Purpose: establish NyayaVault as the primary institutional system, with
S.U.R.Y.A. clearly positioned underneath it, and route every visitor to
the right next step.

Accessible to: everyone, unauthenticated.

Page anatomy (top to bottom):

Attribution bar: \"Government of India · Unified Legal & Judicial
Records Platform · \[Ministry/Department\] (Demo)\" + language toggle.

Header: NyayaVault mark + tagline, nav (Home · Departments · RTI ·
Contact).

Hero: eyebrow label \"Secure Digital Document Management System\";
headline \"One secure record, from the first report to the final
judgment.\"; sub-copy naming the platform\'s audience (law enforcement,
courts, legal departments, the public); primary CTA \"Sign in to the
Document Management System\"; three trust-badge chips (RBAC access
control · Hash-chain integrity · Encrypted case files); a lock-in-circle
motif on the right.

Divider section, visually demoted: \"Public & Professional Legal
Assistance --- Powered by S.U.R.Y.A.\" with one line of context (\"no
login required for citizens\") and the three existing role cards
(Citizen / Lawyer / Student), unchanged in content from the existing
product, each with an \"Open S.U.R.Y.A.\" action.

Footer: demo/version note, policy links, contact.

Key interactions: clicking the primary CTA routes to Page 2
(Institutional Sign-in). Clicking a SURYA role card routes into the
SURYA module (Pages 18--20) with no authentication step for Citizen and
Student; Lawyer prompts a lightweight professional sign-in scoped only
to SURYA + disclosed documents.

Page 2 --- Institutional Sign-in

Purpose: the actual entry point into NyayaVault --- deliberately
separated from the public hero so it reads as a controlled-access
system, not a consumer login form.

Accessible to: anyone attempting institutional access; only the five
institutional roles can successfully authenticate here.

Page anatomy: split layout. Left panel (dark navy): the NyayaVault mark,
the tagline, and three short trust statements (\"Role-based access with
a full audit trail,\" \"Hash-verified document integrity,\" \"Encrypted,
permissioned case files\"), closing with \"Authorised personnel only.
All activity on this system is logged and monitored.\" Right panel
(white card): \"Sign in to the Document Management System,\" a
Role/Designation dropdown (Investigating Officer, Records Officer,
Forensic Analyst, Judicial Officer, Compliance/Admin), an
Officer/Employee ID field, a password field, a primary \"Secure sign in
→\" button, \"Forgot password? Contact your nodal officer,\" and a
closing note: \"Citizen? Use the S.U.R.Y.A. public suite on the portal
home --- no login needed.\"

Key interactions: the role selected here determines the entire sidebar
and dashboard the user sees after authentication (Page 8) --- this
dropdown is not cosmetic, it is the first RBAC decision point. A failed
login attempt is itself written to the audit trail (visible later to
Compliance/ Admin as a security event). Successful sign-in requires a
second MFA step (code sent to the registered department channel) before
reaching the dashboard.

Page 3 --- Departments

Purpose: public transparency into which agencies participate in the
platform --- doubles as the plain-language explanation of the blockchain
consortium (Part 2.6.2).

Accessible to: everyone, unauthenticated.

Page anatomy: a directory grid of participating organizations (Police
Department, Judiciary/ Court Registry, Forensic Science Laboratory,
Central Compliance Authority), each with a short description of their
role in the network and their public contact channel. A short explainer
panel: \"How your records are kept safe\" --- a plain-language,
non-technical translation of the on-chain/ off-chain model for a general
audience.

Key interactions: none transactional --- this is an informational,
trust-building page.

Page 4 --- Verify a Document

Purpose: the platform\'s blockchain guarantee, made directly usable by
anyone --- the public-facing payoff of Part 2.6.6.

Accessible to: everyone, unauthenticated.

Page anatomy: a single-purpose form: \"Enter a document reference ID\"
or \"Upload a copy of the document to check,\" a \"Verify\" button, and
a results panel that returns one of three plain-language verdicts:
Verified (hash matches the on-chain record, shows the filing date and
issuing department, no content shown), Not verified (hash does not match
--- the copy differs from the official record), or Not found (no
matching record --- useful for spotting entirely fabricated documents).
A short explainer: \"This tool checks a document\'s digital fingerprint.
It never displays the document\'s actual content.\"

Key interactions: verification requests are rate-limited and logged
(without exposing what document was checked to anyone but the checker)
to prevent this becoming a scanning tool against the whole repository.

Page 5 --- RTI (Right to Information) Request

Purpose: a formal channel for the public to request non-confidential
case-status or public-filing information, consistent with statutory
transparency obligations.

Accessible to: everyone; submission requires only a name and contact
channel, not an account.

Page anatomy: a structured request form (nature of request,
case/document reference if known, requester details), a submission
confirmation with a tracking reference number, and a \"Track your
request\" lookup by reference number showing status (Received → Under
Review → Responded/Denied with reason).

Key interactions: every RTI request is routed to the Records Officer
queue (Page 8, RO variant) for triage --- it never grants direct
document access; it initiates a reviewed disclosure process.

Page 6 --- Contact / Help / FAQ

Purpose: support for both the public and institutional sides.

Accessible to: everyone.

Page anatomy: FAQ accordion split into \"For the public\" and \"For
officials,\" a contact form, and department helpdesk details.

Page 7 --- About & Legal

Purpose: platform transparency and compliance disclosure.

Accessible to: everyone.

Page anatomy: platform purpose statement, Privacy Policy, Terms of Use,
Accessibility Statement, and a short \"How we secure your data\" section
referencing the encryption and blockchain-integrity approach in plain
language (linking to Page 3\'s fuller explainer).

5.5 Page-by-Page Design --- NyayaVault Institutional Pages

Page 8 --- Vault Command Center (the post-login dashboard)

Purpose: the landing screen after institutional sign-in. This is the
page most directly answering the requirement that every role sees a
genuinely different dashboard, not a shared layout with items grayed
out. The sidebar itself only lists the sections that role\'s matrix row
(5.4) permits --- a Forensic Analyst\'s sidebar never contains a \"Case
Files\" link at all, because it is not simply hidden, it does not exist
for that role.

Accessible to: all five institutional roles, each rendering an entirely
distinct dashboard body.

8.A --- Investigating Officer dashboard

Widgets: \"My Active Cases\" (assigned cases only), \"Documents Pending
Submission,\" \"Evidence I\'ve Registered\" (custody status per
exhibit), a notifications feed (e.g., \"Records Officer requested
clarification on Witness Statement #4471\").

Quick actions: Register New FIR, Upload Investigation Record/Witness
Statement, Register New Evidence, Capture Biometric Record
(fingerprints/photograph) against a case, Search the Criminal/ Case
Database (prior records, MO patterns, cross-station matches --- a
national-search capability modeled on CCTNS, which lets officers search
stolen vehicles, missing persons, and suspects across every connected
station), Initiate a Custody Transfer.

Explicitly absent: verification/filing actions, signature tools, audit
trail explorer, user management, blockchain monitor. An Investigating
Officer cannot mark their own submission as \"Verified\" --- that action
does not appear anywhere in their interface, by design (separation of
duties, 2.1.3).

8.B --- Records Officer / Registrar dashboard

Widgets: \"Verification Queue\" (documents submitted by officers
awaiting classification/ verification), \"RTI Requests Routed to Me,\"
\"Retention Alerts\" (documents nearing statutory retention expiry),
\"Version Conflicts to Review,\" \"Redaction Requests Pending.\"

Quick actions: Verify & Classify Document (confirm or correct an
AI-suggested category), Apply/Adjust Retention Policy on a document,
Apply a Legal Hold (overrides retention), Issue a Redacted Copy as a new
linked version (the original is never edited), Route or Respond to an
RTI Request.

Explicitly absent: cannot originate an FIR or investigation record,
cannot see forensic raw analysis detail, no user/role management, no
blockchain monitor.

8.C --- Forensic Analyst dashboard

Widgets: \"Assigned Exhibits\" (only exhibits specifically assigned to
this analyst --- never the surrounding case), \"Pending Report
Submissions,\" \"Exhibits Currently in My Custody\" (an active
chain-of-custody obligation list, following the pattern of commercial
digital evidence management systems, which log every officer, IP
address, timestamp, and event against an exhibit to build a defensible
custody trail).

Quick actions: Submit Forensic Report (linked to one exhibit ID), Accept
Incoming Custody Transfer, Initiate Outgoing Custody Transfer, Run a
Tamper-Check (recompute an exhibit\'s hash against its value at intake
--- the same technique commercial evidence-management tools use to flag
tampering automatically rather than by manual comparison).

Explicitly absent: no case file view of any kind, no witness identity
fields (shown redacted even in the exhibit metadata they can see), no
general search across the repository --- search is scoped to only their
own assigned exhibit IDs.

8.D --- Judicial Officer / Court Clerk dashboard

Widgets: \"Filings Awaiting Signature,\" \"Disclosure Requests Awaiting
My Approval\" (from defense counsel via SURYA), \"Upcoming Hearings\"
linked to their case documents, \"Judgments Ready to Publish\" (to the
public/redacted archive).

Quick actions: E-Sign Order/Judgment (PKI-backed digital signature, the
same class of credential --- including Aadhaar-based e-Sign --- already
used in production on India\'s eCourts e-filing platform), Grant or Deny
a Disclosure Request, Apply a Sealed/Restricted flag to a sensitive
document, Publish a Judgment to the public archive that feeds the SURYA
Student suite\'s free-text-searchable judgment library.

Explicitly absent: cannot upload investigation records, evidence, or
forensic reports; no admin panel; cannot edit a forensic report\'s
content, only view and reference it in a filing.

8.E --- Compliance / System Admin dashboard

Widgets: \"System Health\" (active accounts, pending role-access
requests), \"Audit Anomalies\" (failed logins, after-hours access,
repeated denied-access attempts, flagged automatically), \" Retention
Policy Overview\" across all departments, \"Blockchain Network Status\"
summary.

Quick actions: Manage Users & Roles, Configure Retention Policy, Onboard
a New Department/ Consortium Node, Open Full Audit Trail (read-only),
Open Blockchain Network Monitor.

Explicitly absent, and stated on-screen as a design choice, not a bug:
\"This role manages the system and cannot open case document content.\"
There is no case file list, no document viewer entry point, and no
search-by-content on this dashboard at all --- Compliance/Admin oversees
the system\'s integrity, not its contents, by the same
separation-of-duties logic that keeps an Investigating Officer from
verifying their own submissions.

Page 9 --- Case File

Purpose: the unified view of everything tied to one case --- documents,
evidence, custody status, and (where the role permits) the audit trail
for that case --- filtered live through the RBAC matrix.

Accessible to: Investigating Officer, Records Officer, and Judicial
Officer, each scoped to cases they are assigned to; not accessible to
Forensic Analyst (exhibit-only access) or Compliance/Admin (system-only
access); accessible in a read-only, heavily filtered form to a Lawyer
via SURYA only for documents explicitly disclosed to them.

Page anatomy: case header (case ID, type, status, blockchain-verified
badge), a tabbed layout: Documents (every document tied to the case,
each showing its lifecycle state), Evidence (linked exhibits and their
current custody holder), Timeline (chronological case events),
Disclosure (who currently has access to what, and why --- visible to
Judicial Officer and, in summary form, to the case\'s Investigating
Officer).

Key interactions: opening a document from this view routes to Page 10.
Requesting disclosure to an external party (e.g., defense counsel) opens
the Page 14 workflow directly from here. Every tab view is itself an
audit-logged access event.

Page 10 --- Document Viewer

Purpose: the single-document detail view, and the page where the
blockchain guarantee becomes visible to an end user working day-to-day,
not just to the public verification tool.

Accessible to: any role with document-level access under the RBAC
matrix, per-document, per case assignment and sensitivity flag.

Page anatomy: document preview pane; metadata panel (type, case,
uploader, timestamps, current lifecycle state); a \"Blockchain
Verified\" badge with the on-chain hash reference, expandable to show
the verification detail (matches Page 4\'s public tool, in an
authenticated context); version history list; a per-document access log
(\"who has viewed this document,\" visible to Records Officer/ Judicial
Officer/Admin, not to the general viewing role); action buttons
appropriate to the viewer\'s role only (e.g., \"Apply Digital
Signature\" appears only for a Judicial Officer viewing a filing
awaiting signature).

Key interactions: downloading a document is a logged, watermarked
export, never a silent file copy. Attempting to access a Sealed document
without an active grant shows a \"Restricted --- Access Logged\"
interstitial instead of the document --- the attempt itself is written
to the audit trail, which is also shown to the user so the
access-control model is transparent, not silently punitive.

Page 11 --- Upload / Digitization

Purpose: the ingestion workflow --- where a physical or digital-native
document enters the system for the first time.

Accessible to: Investigating Officer (case documents), Forensic Analyst
(forensic reports, exhibit -scoped), Judicial Officer (court filings).

Page anatomy: a stepper: (1) select document category from the fixed
taxonomy (2.5) and link it to a case/exhibit ID, (2) upload/scan with
automatic OCR and a scan-quality check, (3) a system-computed content
hash is displayed before any further edits, so the very first captured
state is provably fixed, (4) confirm and submit --- the document enters
the Uploaded lifecycle state and routes to the appropriate Records
Officer\'s verification queue (Page 8.B).

Key interactions: the hash-generation step cannot be skipped or repeated
with a \"cleaner\" upload --- if a scan is rejected for quality, it must
be re-uploaded as a new, separately-hashed attempt, not silently
replaced.

Page 12 --- Evidence & Chain-of-Custody

Purpose: the register and transfer workflow for physical exhibits ---
the platform\'s answer to the brief\'s \"police asset lifecycle\"
requirement.

Accessible to: Investigating Officer (registration, outgoing transfer),
Forensic Analyst (incoming/outgoing transfer for assigned exhibits
only); read visibility within the linked case for Judicial Officer.

Page anatomy: exhibit register (QR/barcode ID, description, seizure
date/location, current custodian), a custody timeline for each exhibit
showing every transfer with both parties\' signatures, and a prominent
integrity flag if any gap or unsigned transfer is detected.

Key interactions: initiating a transfer requires selecting the receiving
custodian, who must separately confirm receipt (their own login, their
own signature) before the transfer is accepted onto the ledger ---
mirroring the two-party chaincode rule in 2.6.4. A transfer cannot be
marked complete by the sending party alone.

Page 13 --- Search & Retrieval

Purpose: fast, defensible retrieval across everything a role is
authorized to see.

Accessible to: all institutional roles, each seeing results pre-filtered
to their own RBAC scope before any query even runs (a Forensic
Analyst\'s search never returns a hit outside their assigned exhibits,
regardless of query text).

Page anatomy: a search bar with exact filters (case ID, document type,
date range, department) always visible alongside the results, plus an
\"AI-assisted\" toggle that adds semantic matches (e.g., matching
\"stolen vehicle\" to a report that says \"unauthorized removal of a
motor vehicle\") clearly marked as AI-suggested and visually distinct
from exact filter matches.

Key interactions: every search is logged (query + result count, not full
result content) as a lighter-weight audit event, since search patterns
themselves can be sensitive (e.g., repeated searches for one witness\'s
name).

Page 14 --- Disclosure & Collaboration

Purpose: the controlled workflow that replaces today\'s email/letter
document sharing between departments, and between the court and defense
counsel.

Accessible to: Judicial Officer (approves lawyer disclosure requests),
Investigating Officer and Records Officer (inter-department requests),
Lawyer via SURYA (initiates a request, views status).

Page anatomy: a request form (which document(s)/case, requesting party,
reason, requested duration), an approval queue for the granting role,
and a live \"Active Disclosures\" list showing exactly who currently has
access to what and when it expires.

Key interactions: approving a request is itself a signed action; access
is automatically revoked at expiry without requiring a manual step,
closing the most common real-world failure mode (access granted once and
never revisited).

Page 15 --- Audit Trail Explorer

Purpose: the independently verifiable record of everything that has
happened on the platform.

Accessible to: Compliance/Admin (full, read-only, platform-wide); every
other institutional role sees only their own action history from their
own dashboard, not a general explorer.

Page anatomy: filterable log (by user, case, document, action type, date
range), each entry showing the actor, action, target, timestamp, and ---
for any entry within the last hour --- a \"Pending blockchain anchor\"
state, transitioning to \"Anchored\" once that hour\'s Merkle root is
written (2.6.5). A prominent, permanent notice: \"This trail cannot be
edited or deleted by any role, including this one.\"

Key interactions: exporting a filtered slice of the trail (e.g., for a
compliance report) is itself logged. There is no delete, edit, or
\"clear log\" control anywhere on this page.

Page 16 --- Blockchain Network & Integrity Monitor

Purpose: operational visibility into the consortium network underpinning
every integrity guarantee on the platform.

Accessible to: Compliance/Admin only.

Page anatomy: peer node status for each consortium organization (Police,
Judiciary, Forensic Lab, Compliance Authority), ledger height and
last-anchored-hour timestamp, chaincode versions in use, and an alert
panel for any peer falling out of sync.

Key interactions: this page is observational --- Admin can see and be
alerted to network health, but no action here can alter ledger content,
consistent with the Admin role\'s \"manages the system, not the
content\" boundary.

Page 17 --- Admin Panel

Purpose: user, role, and policy administration.

Accessible to: Compliance/Admin only.

Page anatomy: three sub-sections --- Users & Roles (create/deactivate
institutional accounts, assign role and department, review pending
access requests), Retention Policy (configure default retention per
document category, apply/lift legal holds), Department & Network
Onboarding (add a new consortium peer, configure its scope).

Key interactions: every user/role change is itself a signed, audited
action, visible in Page 15. Deactivating an account does not delete
their historical actions from the audit trail --- history is permanent
even when access is revoked.

5.5 Page-by-Page Design --- S.U.R.Y.A. Module Pages (Secondary,
Preserved As-Is)

These three pages are not being redesigned. They are described here only
to state precisely what stays unchanged and what single integration
point connects each of them into NyayaVault.

Page 18 --- S.U.R.Y.A. Citizen Suite

Purpose: unchanged --- an AI chatbot and guided-steps experience for
common legal situations (theft, fraud, disputes), plus a lawyer-finder
directory.

Accessible to: the public, no login required.

Unchanged features: AI legal chatbot, step-by-step guidance checklists,
\"Know Your Rights\" explainers, lawyer search by practice
area/location/experience.

Integration point: the AI chat now calls the server-side AI Proxy
Service (2.3) instead of a browser-exposed key. This surface has zero
connection to any NyayaVault case data --- it answers from general
legal-guidance content only, by design, since a citizen has no
case-assignment to scope access against.

Page 19 --- S.U.R.Y.A. Lawyer Workspace

Purpose: unchanged in concept --- a case dashboard, AI-generated
summaries, judgment search, and the case-connection graph --- now backed
by real data instead of a demo dataset.

Accessible to: authenticated lawyers, scoped strictly to cases where
they hold an active disclosure grant (Page 14).

Unchanged features: case dashboard layout, priority/urgency
organization, AI document summarization, the interactive case-connection
graph, judgment search.

Integration point: every document the lawyer\'s dashboard shows, every
fact their AI summary cites, and every node in their connection graph
must trace back to a document that is (a) filed in NyayaVault and (b)
explicitly disclosed to that lawyer for that case. A lawyer cannot
search, browse, or have AI summarize any document outside an active
disclosure grant --- attempting to reference one returns the same
\"Restricted --- Access Logged\" pattern used in Page 10.

Page 20 --- S.U.R.Y.A. Student Suite

Purpose: unchanged --- a topic-wise library of simplified case studies,
AI-generated plain-language summaries, bookmarks, and quizzes.

Accessible to: the public, no login required.

Unchanged features: topic-wise case library, simple/detailed summary
toggle, bookmarks and notes, quiz mode.

Integration point: the library is sourced only from published, redacted
judgments that NyayaVault has moved to its Archived/Public lifecycle
state --- never from live or sealed case material. This is the one place
S.U.R.Y.A. reads from NyayaVault directly, and it only ever reads the
public end of the document lifecycle.

5.6 Cross-Cutting Interaction Patterns

These apply on every page, across both modules, not just the ones where
they\'re mentioned above.

Pattern Behavior

Restricted access Never a blank 403 --- always a named \"Restricted ---
Access Logged\" screen stating that the attempt was recorded, so the
access-control model is visible, not silently punitive

Irreversible actions Digital signing, custody transfer, and account
deactivation all require a typed confirmation phrase, not just an \"Are
you sure?\" click-through, given their evidentiary weight

Loading states Document hash verification and blockchain-anchor checks
show an explicit \"Verifying against the ledger...\" state rather than a
generic spinner, so the security step is visible

Empty states A role with zero items in a queue sees a plain, reassuring
statement (\"No documents pending your verification\") rather than a
broken-looking blank panel

Error states Any failure during upload, signing, or transfer is shown
with the exact next step (\"Re-scan and resubmit,\" \"Contact the
receiving custodian to confirm receipt\")

Bilingual support Every institutional and public page renders fully in
English and Hindi via the same toggle, including document-category names
and audit-log action labels

Audit transparency Anywhere a user\'s own action was logged, a small,
consistent \"Logged at \[time\]\" note appears --- the system never
hides that it is watching, on either side of the platform

PART 6 --- CURRENT BUILD STATUS, LOCKED DECISIONS & ALIGNMENT PLAN

Parts 1--5 describe the platform\'s complete target design. This part
exists because the platform is not being built from a blank repository
--- a working codebase already exists (the original S.U.R.Y.A. Vite +
React + TypeScript project), and active development on it is already
underway. This part is the bridge between \"what the target design
says\" and \"what to actually do next, given what\'s already built\" ---
every future build session should read this part first, before Parts
1--5, because it is the only part that changes as the build progresses.

6.1 What already exists (confirmed from live screenshots of the running
build)

Component Confirmed state Evidence

S.U.R.Y.A. module landing screen Built and styled: rotating chakra
glyph, \"WELCOME TO,\" large dotted-serif \"S.U.R.Y.A.\" wordmark,
tricolor divider bar, tagline, dark-mode toggle Screenshot, current
build

Role-selection cards Built and styled for Citizen and Lawyer: tinted
icon panel + white body + two feature bullets + full-width colored
\"Continue →\" bar Screenshot, current build

Student card Unconfirmed --- not visible in the supplied screenshot.
Could be off-screen (page requires horizontal scroll or a wider
viewport) or genuinely not yet built Screenshot, current build
(incomplete view)

NyayaVault home page (DMS-primary hero, attribution bar, primary sign-in
CTA, trust badges) Not built --- the screenshot shows the S.U.R.Y.A.
module\'s own hero occupying the platform\'s home page position
Screenshot, current build

Institutional sign-in page (role dropdown, employee ID, password, MFA)
Unconfirmed --- not shown in the supplied screenshots; an earlier design
mockup exists (referenced in this project\'s history) but it is not
confirmed as implemented code Not shown in current screenshots

Backend, database, object storage, blockchain layer Not started --- the
codebase\'s own package.json shows only react, react-dom, and
lucide-react as dependencies; no server, no persistence, no blockchain
library package.json (uploaded earlier in this project)

Routing (react-router-dom) Not installed package.json

AI integration Client-side Gemini call, API key in .env.local,
browser-exposed --- the project\'s own README already flags this as
unsafe for production README.md, .env.local (uploaded earlier)

Reading this table correctly: the project is currently at the stage of
\"a well-designed front-end shell for the secondary module exists; the
primary module (NyayaVault) has not been started, and nothing below the
UI layer exists yet.\"\* This is a normal, early, and entirely workable
starting point --- it just means the immediate next steps are UI
restructuring and backend foundation-laying, not deep feature work on
Vault pages that don\'t have anywhere to store data yet.

6.2 Locked decisions

These were open questions earlier in this project\'s design process.
They are now closed. Do not re-prompt for them, do not offer
alternatives for them, and do not let a future build session
\"rediscover\" and re-decide them differently.

Decision Locked value Reasoning

S.U.R.Y.A. acronym expansion Smart Unified Resource for Judicial
Assistance Already implemented in the live build\'s copy; changing it
now would be pure rework with no benefit

Role card visual pattern Tinted icon panel + white body + two bullets +
full-width colored action bar (Part 5.1.1.B) Already implemented for two
of three roles and visually strong; extend, don\'t replace

S.U.R.Y.A.\'s own dotted-letter wordmark treatment (\"S.U.R.Y.A.\" with
visible periods) Keep, but only within the S.U.R.Y.A. module\'s own
pages Distinct, recognizable sub-brand identity; wrong only when it
appears where the NyayaVault identity should be (the platform home page)

Card color assignments Citizen = amber/orange · Lawyer = navy/indigo ·
Student = green Consistent with every design pass so far in this project

Primary platform brand NyayaVault, not S.U.R.Y.A. Explicit, repeated
instruction across this entire project: the DMS is primary, S.U.R.Y.A.
is a module

6.3 The core structural fix that everything else depends on

The single most important unresolved issue: the platform\'s home page
currently is the S.U.R.Y.A. module\'s landing page. There is, at
present, no separate \"NyayaVault home page\" --- the two have been
conflated into one screen. Every other page-level task in this part
depends on un-conflating these first:

The S.U.R.Y.A. hero (chakra glyph, dotted wordmark, tricolor bar,
tagline) is correct content --- it is simply on the wrong route. It
belongs on a dedicated S.U.R.Y.A. entry screen (Part 5.5, Page 18\'s
parent screen), reached after a visitor chooses to go into the module
from the real home page --- not shown as the very first thing every
visitor sees.

A new, separate NyayaVault home page must be built at the platform\'s
actual root route, following Part 5.5 Page 1 exactly (institutional
attribution bar, NyayaVault hero, primary \"Sign in to the Document
Management System\" CTA, trust badges, and only then --- visually
demoted, below the fold --- the \"Powered by S.U.R.Y.A.\" section
containing the three existing role cards).

The three role cards move, unchanged, into that demoted section. They do
not need to be touched visually; only their surrounding context changes.

Everything in 6.4 below assumes this restructuring happens first, since
several of the other fixes (the sign-in CTA\'s destination, the
attribution bar) are properties of the new home page, not patches to the
existing one.

6.4 Detailed page-by-page fix list

6.4.1 NyayaVault Home Page (new build, replacing the current root route)

Build per Part 5.5, Page 1, in full. As a condensed checklist against
what\'s currently live:

New institutional attribution bar: \"Government of India · Unified Legal
& Judicial Records Platform · Ministry of Law and Justice (Demo)\" +
EN/हिन्दी toggle, top-most element on the page

New header: NyayaVault wordmark (serif) + subtitle \"Unified Legal &
Judicial Records Platform,\" nav links (Home · Departments · RTI ·
Contact)

New hero: eyebrow \"Secure Digital Document Management System\";
headline \"One secure record, from the first report to the final
judgment.\"; two-line sub-copy naming the audience and the core
guarantee

Primary CTA button \"Sign in to the Document Management System\" →
routes to the institutional sign-in page (6.4.2)

Three trust-badge chips beneath the CTA: \"RBAC access control\" ·
\"Hash-chain integrity\" · \"Encrypted case files\"

A supporting graphic on the hero (a lock-in-circle motif, per the
earlier-approved mockup, or the existing chakra glyph repurposed at
smaller scale --- either is acceptable, but it must be secondary to the
headline, not the headline\'s centerpiece)

Below the hero, a clearly separated section: heading \"Public &
Professional Legal Assistance --- Powered by S.U.R.Y.A.,\" one line of
context (\"No login required for citizens\"), then the three role cards

Footer with a NyayaVault-level security statement (\"All platform
activity is logged and monitored\") in addition to any existing
S.U.R.Y.A.-level footer copy

6.4.2 S.U.R.Y.A. Module Entry Screen (relocated, not deleted)

The current hero (chakra glyph, \"WELCOME TO,\" dotted \"S.U.R.Y.A.\"
wordmark, tricolor bar, tagline, dark-mode toggle) is moved as-is to a
new route reached only after a visitor clicks into the \"Powered by
S.U.R.Y.A.\" section from the new home page above.

Confirm this screen still renders identically to the current build after
the route change --- this should be a relocation, not a rebuild

Confirm the three role cards render below it exactly as they do today

Confirm whether the Student card exists. If it is missing, build it
using the exact pattern in Part 5.1.1.B: green tint, a
mortarboard-plus-scale icon, title \"I am a Student,\" sub-line on the
value proposition, two feature bullets (suggested: \"Simplified case
summaries,\" \"Topic-wise case library\"), full-width green \"Continue
→\" bar

6.4.3 Institutional Sign-in Page

Status unconfirmed --- verify against this list before assuming work is
needed:

Split layout exists: dark navy info panel (left) + white sign-in card
(right)

Left panel contains the NyayaVault mark, tagline, three trust
statements, and the closing line \"Authorised personnel only. All
activity on this system is logged and monitored.\"

Right panel fields, in exact order: Role/Designation dropdown (must list
all five institutional roles from Part 1.5 --- Investigating Officer,
Records Officer, Forensic Analyst, Judicial Officer, Compliance/Admin
--- not a placeholder list), Officer/Employee ID field, Password field,
\"Secure sign in →\" button

\"Forgot password? Contact your nodal officer.\" link/text present

\"Citizen? Use the S.U.R.Y.A. public suite on the portal home --- no
login needed.\" present and links back to the new home page\'s SURYA
section

\"← Back to portal\" link present, top-left, routing to the new home
page

If none of this exists yet, build it new --- this is a self-contained
page with no dependency on the backend existing yet (the form can submit
to a stub/mock endpoint for now)

6.4.4 Pages not yet confirmed either way (verify before assuming status)

Departments page (Part 5.5, Page 3)

Verify a Document page (Part 5.5, Page 4)

RTI Request page (Part 5.5, Page 5)

Contact / Help / FAQ (Part 5.5, Page 6)

About & Legal (Part 5.5, Page 7)

None of these block the core restructuring in 6.4.1--6.4.3 and can be
treated as a second pass.

6.5 What explicitly should NOT be touched in this pass

Do not redesign the Citizen or Lawyer card visuals.

Do not change the S.U.R.Y.A. acronym, its dotted-letter wordmark
treatment, or its chakra glyph.

Do not begin building any authenticated NyayaVault dashboard pages (Part
5.5, Pages 8--17) --- there is no backend, database, or auth system yet
for them to connect to, so building their UI now would produce
disconnected screens. Finish 6.4.1--6.4.3 first; that gets the
primary/module relationship visibly correct end-to-end, which is the
current priority.

Do not start on the blockchain layer, backend services, or database yet
--- per the build order in Part 7, identity/RBAC and the document
lifecycle service come before any of that, and neither has a frontend to
connect to today.

6.6 Verification checklist for this pass

Run this after 6.4.1--6.4.3 are complete, before moving on to anything
else:

Visiting the platform\'s root route shows the NyayaVault hero, not the
S.U.R.Y.A. hero

The institutional attribution bar is visible above the header on the
home page

The home page\'s primary CTA goes to the sign-in page, not directly into
the S.U.R.Y.A. module

The three trust badge chips are visible on the home page

The \"Powered by S.U.R.Y.A.\" section is visually and textually
subordinate to the hero (smaller heading weight, clearly labeled as
secondary)

Clicking into the S.U.R.Y.A. section shows the original, unmodified
S.U.R.Y.A. hero and all three role cards, including Student

The institutional sign-in page exists, matches 6.4.3 exactly, and its
role dropdown lists all five institutional roles

Both \"Back to portal\" and \"Citizen? Use S.U.R.Y.A.\" links function
correctly

Dark mode still functions on every page touched in this pass

No existing S.U.R.Y.A. feature (chat, guidance, lawyer search, case
dashboard, case-connection graph, case library) has been altered,
removed, or broken by the routing changes

6.7 How to keep this part current

This part should be rewritten, not appended to, after each build
session. The pattern going forward: take a screenshot of the current
state, diff it against Section 6.1\'s table, update the table, update
6.3--6.6 to describe whatever the new next gap is, and lock any
newly-resolved decisions into 6.2. Parts 1--5 stay stable as the target
design; Part 6 is the only part that is expected to change every time
this document is revisited.

PART 7 --- CLOSING SUMMARY & BUILD PRIORITIES

What this platform is: NyayaVault, a permissioned-blockchain-secured
document and case management system for police, courts, forensic labs,
and legal departments --- with S.U.R.Y.A., the existing AI assistant
suite, preserved in full and reconnected as a secondary, read-scoped
module on top of it.

What must never happen during implementation:

S.U.R.Y.A.\'s existing citizen/lawyer/student features must not be
redesigned, shrunk, or merged into a single generic \"dashboard\" ---
they stay as they are, only reconnected to real data.

No two institutional roles should ever see the same dashboard with items
merely disabled --- if a role cannot do something, that control should
not exist in their interface at all (Part 5.5, Page 8).

No document is ever edited in place; every change is a new,
separately-hashed version.

No AI output becomes part of the official record without an explicit
human confirmation from an authorized role.

No audit trail entry is ever editable or deletable, by any role,
including Compliance/Admin.

Where the real build actually stands right now: the current codebase
already has a working frontend shell and the S.U.R.Y.A. module\'s own
landing/role-selection UI built and styled (Part 6 documents exactly
what exists and what\'s next). Treat the build order below as the target
end state; Part 6 is the actual next set of steps from today\'s starting
point.

Suggested build order (target end state):

Identity & RBAC Service + the five institutional role definitions (Part
5.4) --- everything else depends on this being correct first.

Document Lifecycle Service + object storage + PostgreSQL metadata
(without blockchain yet) to get the core upload → verify → file flow
working end-to-end.

Hyperledger Fabric network with the three chaincodes (2.6.4), wired into
the Document Lifecycle and Evidence services.

Evidence & Custody Service (Page 12) and the Disclosure & Collaboration
workflow (Page 14).

Search & AI Classification Service, then the public Verify-a-Document
tool (Page 4).

Reconnect S.U.R.Y.A. (Pages 18--20) through the AI Proxy Service,
replacing its demo data with real, permission-scoped NyayaVault data.

Audit Trail Explorer, Blockchain Network Monitor, and Admin Panel (Pages
15--17) --- these can be built last precisely because they are oversight
tools for a system that must already be recording everything correctly
by this point.
