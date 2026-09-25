import { useMemo, useState } from 'react';
import {
  ArrowLeft, Briefcase, GraduationCap, KeyRound, ShieldCheck,
  UserRound, Users, Activity,
} from 'lucide-react';

/* ---------------------------------------------------------------------------
   S.U.R.Y.A. Assistance Suite — Admin Overview
   Shown to a super_admin who enters the suite side. Read-only platform view:
   who uses the citizen/lawyer/student modules, advocate verification state,
   and cross-suite activity. Nothing here grants DMS write access — the suite
   remains a permissioned consumer of DMS data (read-only bridge).
--------------------------------------------------------------------------- */

type SuiteUserRow = {
  name: string;
  phone: string;
  role: 'citizen' | 'lawyer' | 'student';
  detail: string;
  status: 'Verified' | 'Pending';
};

const USERS: SuiteUserRow[] = [
  { name: 'Rajesh Kumar Sharma', phone: '98765 00001', role: 'citizen', detail: 'Jaipur, Rajasthan · 1 active legal step', status: 'Verified' },
  { name: 'Sneha Kulkarni', phone: '98765 00005', role: 'citizen', detail: 'Pune, Maharashtra · 3 saved guides', status: 'Verified' },
  { name: 'Adv. Vikram Rao', phone: '98765 00004', role: 'lawyer', detail: 'Bar RAJ/1823/2019 · Rajasthan, 2019', status: 'Verified' },
  { name: 'Adv. Karan Malhotra', phone: '98765 00007', role: 'student', detail: 'Student · Delhi · 6 case studies', status: 'Verified' },
];

const ADVOCATES = [
  { bar: 'RAJ/1823/2019', name: 'Vikram Rao', council: 'Bar Council of Rajasthan', year: 2019, areas: ['Criminal', 'Property'], cop: true },
  { bar: 'DEL/0917/2016', name: 'Karan Malhotra', council: 'Bar Council of Delhi', year: 2016, areas: ['Cyber', 'Corporate'], cop: true },
];

export function SuiteAdminPanel({ onBack }: { onBack: () => void }) {
  const [query, setQuery] = useState('');
  const [roleTab, setRoleTab] = useState<'all' | 'citizen' | 'lawyer' | 'student'>('all');

  const filtered = useMemo(
    () => USERS.filter(u => (roleTab === 'all' || u.role === roleTab) && (u.name + u.phone + u.detail).toLowerCase().includes(query.toLowerCase())),
    [query, roleTab],
  );

  const stats = [
    { icon: Users, n: String(USERS.length), label: 'Suite users', tone: '#2e7d32' },
    { icon: UserRound, n: '2', label: 'Citizens', tone: '#a06d10' },
    { icon: Briefcase, n: '1', label: 'Verified lawyers', tone: '#1e56c4' },
    { icon: GraduationCap, n: '1', label: 'Students', tone: '#0e7566' },
  ];

  return (
    <div className="suite-admin">
      <div className="dms-page-head with-button">
        <div>
          <button className="dms-back" onClick={onBack}><ArrowLeft />Back to Landing</button>
          <span>S.U.R.Y.A. ASSISTANCE SUITE · PLATFORM ADMIN</span>
          <h1>Assistance Suite Admin</h1>
          <p>Cross-module overview of the public &amp; professional assistance layer. Read-only — this panel never writes into the DMS core.</p>
        </div>
      </div>

      <section className="admin-kpis">
        {stats.map(s => (
          <div className="kpi" key={s.label}>
            <s.icon style={{ color: s.tone }} />
            <b>{s.n}</b>
            <small>{s.label}</small>
          </div>
        ))}
      </section>

      <section className="dms-panel" style={{ marginTop: 14 }}>
        <h3><Users />Suite users</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search name, phone, detail…"
            style={{ flex: '1 1 180px', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'transparent', color: 'inherit', fontSize: 11 }}
          />
          <div style={{ display: 'flex', gap: 4 }}>
            {(['all', 'citizen', 'lawyer', 'student'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRoleTab(r)}
                style={{
                  padding: '6px 12px', borderRadius: 999, fontSize: 10, cursor: 'pointer',
                  border: '1px solid var(--line)',
                  background: roleTab === r ? 'var(--accent, #1e56c4)' : 'transparent',
                  color: roleTab === r ? '#fff' : 'inherit',
                  textTransform: 'capitalize',
                }}
              >{r}</button>
            ))}
          </div>
        </div>
        <div className="audit-head"><span>User</span><span>Role</span><span>Details</span><span>Status</span></div>
        {filtered.map(u => (
          <div className="audit-row" key={u.phone}>
            <b>{u.name}<small style={{ display: 'block', fontWeight: 400, opacity: 0.6 }}>+91 {u.phone}</small></b>
            <span style={{ textTransform: 'capitalize' }}>{u.role}</span>
            <span style={{ fontSize: 10, opacity: 0.8 }}>{u.detail}</span>
            <span className="active-user">{u.status}</span>
          </div>
        ))}
        {filtered.length === 0 && <p style={{ opacity: 0.6, padding: '12px 0' }}>No users match.</p>}
      </section>

      <section className="dms-panel" style={{ marginTop: 14 }}>
        <h3><KeyRound />Advocate verification ledger</h3>
        <div className="audit-head"><span>Bar ID</span><span>Advocate</span><span>Council · Year</span><span>Practice areas</span><span>CoP</span></div>
        {ADVOCATES.map(a => (
          <div className="audit-row" key={a.bar}>
            <b><code style={{ fontSize: 10 }}>{a.bar}</code></b>
            <span>{a.name}</span>
            <span style={{ fontSize: 10 }}>{a.council} · {a.year}</span>
            <span style={{ fontSize: 10 }}>{a.areas.join(', ')}</span>
            <span className="active-user">{a.cop ? 'Verified' : 'Pending'}</span>
          </div>
        ))}
        <p style={{ fontSize: 10, opacity: 0.7, marginTop: 8 }}>
          The Bar-ID layer binds each enrollment number to exactly one DigiLocker identity — the same binding rule the DMS door uses for officer IDs.
        </p>
      </section>

      <section className="dms-panel" style={{ marginTop: 14 }}>
        <h3><Activity />Cross-suite activity (last 7 days, demo data)</h3>
        <div className="audit-head"><span>Module</span><span>Event</span><span>Count</span><span>Trend</span></div>
        {[
          ['Citizen · AI chatbot', 'Scenario guidance answered', '38', '+12%'],
          ['Citizen · Find a Lawyer', 'Consultation requests sent', '9', '+3'],
          ['Lawyer · Document Analyzer', 'Documents analyzed', '14', '+5'],
          ['Lawyer · AI Case Assistant', 'Case questions answered', '22', '+8'],
          ['Student · Case Library', 'Judgments opened', '31', '+9'],
          ['Student · Quiz mode', 'Quizzes attempted', '6', '+2'],
        ].map(([mod, ev, n, trend]) => (
          <div className="audit-row" key={mod + ev}>
            <b style={{ fontSize: 11 }}>{mod}</b>
            <span style={{ fontSize: 10 }}>{ev}</span>
            <span><b>{n}</b></span>
            <span className="active-user" style={{ fontSize: 10 }}>{trend}</span>
          </div>
        ))}
      </section>

      <p className="production-note"><ShieldCheck /> <b>Scope note:</b> the Assistance Suite never writes into the DMS core. Lawyers receive read-only, permissioned case documents; students only see judgments marked public; citizens never see DMS data at all.</p>
    </div>
  );
}
