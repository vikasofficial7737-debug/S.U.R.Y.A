import { useState } from 'react';
import { ArrowRight, LockKeyhole, Sun, Moon, Scale, Sparkles } from 'lucide-react';
import { SuiteRoleCards } from './AuthFlows';
import type { SuiteRole } from '../data/identityBindings';
import './surya.css';

type Props = {
  dark: boolean;
  setDark: (b: boolean) => void;
  onDmsLogin: () => void;                     // → DigiLocker (PIN door)
  onSuiteRole: (r: SuiteRole) => void;        // → DigiLocker (OTP door) with role
};

/**
 * S.U.R.Y.A. landing — restructured.
 *  Top bar : brand + "SURYA for Judicial Assistance" + theme toggle
 *  Hero    : big S.U.R.Y.A. wordmark (the main visual element)
 *  CTA     : ONE Login button (pops on hover) → DMS DigiLocker PIN door
 */
export function SuryaLanding({ dark, setDark, onDmsLogin, onSuiteRole }: Props) {
  const [rolePopup, setRolePopup] = useState(false);

  return (
    <div className={'sl-landing' + (dark ? ' sl-dark' : '')}>
      <div className="sl-tricolor"><i /><i /><i /></div>

      <header className="sl-topbar">
        <div className="sl-brand">
          <Scale size={18} />
          <b>S.U.R.Y.A.</b>
          <small>Smart Unified Resource for Judicial Assistance</small>
        </div>
        <div className="sl-top-actions">
          <button className="sl-suite-btn" onClick={() => setRolePopup(true)}>
            <Sparkles size={14} />
            SURYA for Judicial Assistance
          </button>
          <button className="sl-theme" onClick={() => setDark(!dark)} aria-label="Toggle theme">
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      <main className="sl-hero">
        <div className="sl-hero-art" aria-hidden>
          <span className="sl-ring sl-r1" />
          <span className="sl-ring sl-r2" />
          <span className="sl-chakra">☸</span>
          <h1 className="sl-wordmark">S.U.R.Y.A.</h1>
          <p className="sl-sub-title">Secure Digital Document Management System for Legal and Investigation Documents</p>
          <p className="sl-tagline">Justice, secured — from first report to final judgment.</p>
        </div>

        <button className="sl-login" onClick={onDmsLogin}>
          <LockKeyhole size={17} />
          Login
          <ArrowRight size={16} />
        </button>
        <p className="sl-login-sub">DigiLocker verified officers · Blockchain integrity · Full audit trail</p>
      </main>

      <footer className="sl-foot">
        <span>© 2026 · S.U.R.Y.A. platform (Demo prototype)</span>
        <span>AI assists, it never decides · DigiLocker-style authentication · Blockchain integrity ledger</span>
      </footer>

      {rolePopup && (
        <SuiteRoleCards
          onClose={() => setRolePopup(false)}
          onPick={(r) => { setRolePopup(false); onSuiteRole(r); }}
        />
      )}
    </div>
  );
}
