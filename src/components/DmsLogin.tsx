import { useState } from 'react';
import { LockKeyhole, Landmark, ShieldCheck, ArrowLeft, ArrowRight, Fingerprint, FileLock2 } from 'lucide-react';
import { DEMO_ACCOUNTS, DMS_ROLES, type DmsJurisdiction, type DmsRoleType } from '../data/demoAccounts';

export type DmsSession = { name: string; role: string; jurisdiction: DmsJurisdiction; department: string; officerId: string };

export function DmsLogin({ onBack, onLogin, dark, setDark }: { onBack: () => void; onLogin: (s: DmsSession) => void; dark: boolean; setDark: (b: boolean) => void }) {
  const [role, setRole] = useState<DmsRoleType>('Investigating Officer');
  const [officerId, setOfficerId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    const acct = DEMO_ACCOUNTS.find(a => a.officerId === officerId.trim() && a.password === password);
    if (!acct) { setError('Invalid officer ID or password. Contact your department administrator.'); return; }
    if (acct.role !== role) { setError(`This officer ID is registered as ${acct.role}. Select the correct role / designation to continue.`); return; }
    setError('');
    onLogin({ name: acct.name, role: acct.role, jurisdiction: acct.jurisdiction, department: acct.department, officerId: acct.officerId });
  };

  return <div className={'gov-login ' + (dark ? 'dark' : '')}>
    <div className="tricolor"><i /><i /><i /></div>
    <header className="gov-topbar">
      <button onClick={onBack}><ArrowLeft /> Back to portal</button>
      <div className="gov-topbar-right">
        <span className="gov-lang">English | हिन्दी</span>
        <button onClick={() => setDark(!dark)}>{dark ? '☀' : '☾'}</button>
      </div>
    </header>

    <div className="gov-emblem-strip">
      <Landmark />
      <div>
        <b>Government of India · Unified Legal &amp; Judicial Records Platform</b>
        <small>Ministry of Law and Justice (Demo) · National Informatics Centre style interface</small>
      </div>
    </div>

    <main className="gov-login-main">
      <section className="gov-login-aside">
        <div className="gov-shield"><LockKeyhole /></div>
        <h1>S.U.R.Y.A.</h1>
        <p className="gov-tag">One secure record, from the first report to the final judgment.</p>
        <ul>
          <li><ShieldCheck /> Role-based access with a full audit trail</li>
          <li><Fingerprint /> Hash-verified document integrity</li>
          <li><FileLock2 /> Encrypted, permissioned case files</li>
        </ul>
        <small>Authorised personnel only. All activity on this system is logged and monitored.</small>
      </section>

      <section className="gov-login-card">
        <h2>Sign in to the Document Management System</h2>
        <p className="gov-sub">Enter your official credentials issued by your department administrator.</p>

        <label>Role / Designation
          <select value={role} onChange={e => { setRole(e.target.value as DmsRoleType); setError(''); }}>
            {DMS_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>

        <label>Officer / Employee ID
          <input value={officerId} onChange={e => { setOfficerId(e.target.value); setError(''); }} placeholder="e.g. IO-2026-XXXX" autoComplete="username" />
        </label>

        <label>Password
          <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} placeholder="Enter your password" autoComplete="current-password" onKeyDown={e => e.key === 'Enter' && submit()} />
        </label>

        {error && <p className="gov-error">{error}</p>}

        <button className="gov-submit" onClick={submit} disabled={!officerId.trim() || !password}>
          Secure sign in <ArrowRight />
        </button>

        <div className="gov-login-foot">
          <span>Forgot password? Contact your nodal officer.</span>
          <span>Citizen? Use the <b>S.U.R.Y.A. public suite</b> on the portal home — no login needed.</span>
        </div>
      </section>
    </main>

    <footer className="gov-footer">
      <span>© 2026 · Demo prototype for presentation purposes</span>
      <span>Website policies · Help · Contact NIC helpdesk</span>
    </footer>
  </div>;
}
