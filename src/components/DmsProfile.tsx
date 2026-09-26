import { ArrowLeft, BadgeCheck, Briefcase, Building2, CalendarClock, FileLock2, Fingerprint, KeyRound, MapPin, Phone, ShieldCheck, UserRound } from 'lucide-react';
import type { DmsSession } from './DmsLogin';

/* Service-record data per demo officer ID. Production: fetched from the
   HR/personnel service tied to the authenticated JWT identity. */
type ServiceRecord = {
  designation: string;
  batch: string;
  rank: string;
  serviceYears: string;
  joinedOn: string;
  currentPosting: { unit: string; station: string; since: string };
  jurisdiction: string;
  contact: string;
  clearance: string;
  permissions: string[];
  postings: { at: string; role: string; place: string }[];
};

const SERVICE: Record<string, ServiceRecord> = {
  'IO-2026-0142': {
    designation: 'Investigating Officer', batch: '2021 · Police Service', rank: 'Sub-Inspector',
    serviceYears: '5 years 2 months', joinedOn: '12 Jul 2021',
    currentPosting: { unit: 'Crime Branch', station: 'Jaipur Police', since: 'Mar 2024' },
    jurisdiction: 'Rajasthan', contact: 'ext. 2142 · io.sharma@rajpolice.gov.in (demo)',
    clearance: 'RESTRICTED', permissions: ['CASE_CREATE', 'DOCUMENT_UPLOAD', 'EVIDENCE_REGISTER', 'EVIDENCE_TRANSFER', 'DOCUMENT_SHARE'],
    postings: [
      { at: 'Mar 2024 — present', role: 'Investigating Officer', place: 'Crime Branch, Jaipur Police' },
      { at: 'Jun 2022 — Mar 2024', role: 'Station Officer (Investigation)', place: 'Sardarpura Police Station, Jodhpur' },
      { at: 'Jul 2021 — Jun 2022', role: 'Probation / Field Training', place: 'Rajasthan Police Academy' },
    ],
  },
  'FO-2026-0451': {
    designation: 'Forensic Officer', batch: '2019 · Forensic Science', rank: 'Scientific Officer',
    serviceYears: '7 years 4 months', joinedOn: '03 Feb 2019',
    currentPosting: { unit: 'Digital Forensics Division', station: 'Forensic Science Laboratory, Jaipur', since: 'Jan 2023' },
    jurisdiction: 'Rajasthan', contact: 'ext. 4451 · r.iyer@fsl-raj.gov.in (demo)',
    clearance: 'RESTRICTED', permissions: ['EVIDENCE_VERIFY', 'DOCUMENT_UPLOAD', 'DOCUMENT_VERSION', 'EVIDENCE_TRANSFER'],
    postings: [
      { at: 'Jan 2023 — present', role: 'Scientific Officer (Digital Forensics)', place: 'FSL Jaipur' },
      { at: 'Feb 2019 — Jan 2023', role: 'Assistant Forensic Officer', place: 'FSL Regional Lab, Jodhpur' },
    ],
  },
  'CR-2026-0087': {
    designation: 'Court / Registrar Staff', batch: '2018 · Judicial Registry', rank: 'Registry Officer',
    serviceYears: '8 years 1 month', joinedOn: '21 Jan 2018',
    currentPosting: { unit: 'Criminal Registry', station: 'Jaipur Sessions Court', since: 'Aug 2022' },
    jurisdiction: 'Rajasthan', contact: 'ext. 8087 · a.kapoor@jaipursessions.gov.in (demo)',
    clearance: 'CONFIDENTIAL', permissions: ['CASE_VIEW', 'DOCUMENT_VIEW', 'DOCUMENT_DOWNLOAD', 'AUDIT_VIEW'],
    postings: [
      { at: 'Aug 2022 — present', role: 'Registry Officer (Criminal)', place: 'Jaipur Sessions Court' },
      { at: 'Jan 2018 — Aug 2022', role: 'Assistant Registry Clerk', place: 'District Court, Ajmer' },
    ],
  },
  'LD-2026-0210': {
    designation: 'Legal Department Officer', batch: '2020 · Legal Service', rank: 'Assistant Public Prosecutor',
    serviceYears: '6 years 6 months', joinedOn: '14 Sep 2020',
    currentPosting: { unit: 'Prosecution Wing', station: 'Public Prosecutor Office (National)', since: 'Apr 2023' },
    jurisdiction: 'National', contact: 'ext. 2210 · k.sharma@pp-india.gov.in (demo)',
    clearance: 'CONFIDENTIAL', permissions: ['CASE_VIEW', 'DOCUMENT_UPLOAD', 'DOCUMENT_SHARE', 'AUDIT_VIEW', 'REPORT_GENERATE'],
    postings: [
      { at: 'Apr 2023 — present', role: 'Assistant Public Prosecutor', place: 'Prosecution Wing (National)' },
      { at: 'Sep 2020 — Apr 2023', role: 'Legal Assistant', place: 'State Legal Cell, Rajasthan' },
    ],
  },
  'RC-2026-0104': {
    designation: 'Records / Compliance Officer', batch: '2016 · Records & Audit', rank: 'Senior Records Officer',
    serviceYears: '10 years 3 months', joinedOn: '05 Aug 2016',
    currentPosting: { unit: 'Compliance & Retention Cell', station: 'State Records (National)', since: 'Nov 2021' },
    jurisdiction: 'National', contact: 'ext. 3033 · m.thomas@staterecords.gov.in (demo)',
    clearance: 'HIGHLY RESTRICTED', permissions: ['AUDIT_VIEW', 'AUDIT_EXPORT', 'DOCUMENT_VIEW', 'REPORT_GENERATE'],
    postings: [
      { at: 'Nov 2021 — present', role: 'Senior Records Officer', place: 'Compliance & Retention Cell (National)' },
      { at: 'Aug 2016 — Nov 2021', role: 'Records Officer', place: 'Central Records Division' },
    ],
  },
  'AD-2026-0001': {
    designation: 'System Admin', batch: '2015 · Platform Operations', rank: 'Chief Platform Administrator',
    serviceYears: '11 years 0 months', joinedOn: '01 Apr 2015',
    currentPosting: { unit: 'Platform Administration', station: 'National Data Centre (Demo)', since: 'Jul 2020' },
    jurisdiction: 'National', contact: 'ext. 1000 · admin@surya.gov.in (demo)',
    clearance: 'HIGHLY RESTRICTED', permissions: ['USER_MANAGE', 'USER_CREATE', 'AUDIT_VIEW', 'AUDIT_EXPORT', 'DOCUMENT_VIEW', 'REPORT_GENERATE'],
    postings: [
      { at: 'Jul 2020 — present', role: 'Chief Platform Administrator', place: 'National Data Centre (Demo)' },
      { at: 'Apr 2015 — Jul 2020', role: 'Systems Engineer', place: 'NIC Services' },
    ],
  },
};

export function ProfileView({ session, onBack }: { session?: DmsSession | null; onBack?: () => void }) {
  const rec = (session?.officerId && SERVICE[session.officerId]) || null;
  if (!rec) return <div className="dms-page-head"><div><button className="dms-back" onClick={onBack}><ArrowLeft /> Back to Dashboard</button><span>SERVICE RECORD</span><h1>My Service Details</h1><p>No service record found for this session.</p></div></div>;

  return <>
    <div className="dms-page-head"><div><button className="dms-back" onClick={onBack}><ArrowLeft /> Back to Dashboard</button><span>GOVERNMENT SERVICE RECORD · VERIFIED PROFILE</span><h1>My Service Details</h1>
      <p>Details below are drawn from the personnel registry for your officer ID. Any access made through this profile is audit-logged.</p></div></div>

    <section className="profile-hero">
      <div className="profile-avatar"><UserRound /></div>
      <div className="profile-id">
        <h2>{session?.name}</h2>
        <p>{rec.rank} · {rec.designation}</p>
        <div className="profile-chips">
          <span><Building2 /> {rec.currentPosting.station}</span>
          <span><MapPin /> {rec.jurisdiction} jurisdiction</span>
          <span className="chip-clearance"><FileLock2 /> {rec.clearance}</span>
        </div>
      </div>
      <div className="profile-verify"><BadgeCheck /><div><b>Identity verified</b><small>Officer ID {session?.officerId}</small></div></div>
    </section>

    <section className="profile-grid">
      <article className="dms-panel profile-card">
        <h3><Briefcase /> Service particulars</h3>
        <dl>
          <div><dt>Rank</dt><dd>{rec.rank}</dd></div>
          <div><dt>Batch / Cadre</dt><dd>{rec.batch}</dd></div>
          <div><dt>Date of joining</dt><dd>{rec.joinedOn}</dd></div>
          <div><dt>Length of service</dt><dd>{rec.serviceYears}</dd></div>
          <div><dt>Current unit</dt><dd>{rec.currentPosting.unit}</dd></div>
          <div><dt>Posted since</dt><dd>{rec.currentPosting.since}</dd></div>
          <div><dt>Contact</dt><dd><Phone /> {rec.contact}</dd></div>
        </dl>
      </article>

      <article className="dms-panel profile-card">
        <h3><KeyRound /> Permission scopes</h3>
        <p className="profile-sub">Granted via role assignment · enforced server-side in production</p>
        <div className="perm-chips">{rec.permissions.map(p => <span key={p}>{p}</span>)}</div>
        <h3 className="profile-sub-h"><ShieldCheck /> Access clearance</h3>
        <p className="profile-sub">Documents above your clearance level are invisible, not just locked.</p>
        <div className="perm-chips"><span className="perm-big">{rec.clearance}</span><span><Fingerprint /> Integrity checks allowed</span></div>
        <h3 className="profile-sub-h"><CalendarClock /> Posting history</h3>
        <div className="posting-list">
          {rec.postings.map(p => <div className="posting" key={p.at}><i /><div><b>{p.role}</b><small>{p.place}</small><small>{p.at}</small></div></div>)}
        </div>
      </article>
    </section>
  </>;
}
