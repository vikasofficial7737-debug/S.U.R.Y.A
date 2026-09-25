import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Check, Fingerprint, LockKeyhole, ShieldCheck,
  Smartphone, RefreshCw,
} from 'lucide-react';
import { digiSendOtp, digiAuthPin, digiAuthOtp } from '../lib/auth';
import type { DigiIdentity } from '../data/identityBindings';
import './digilocker.css';

type Props = {
  /** 'pin' = DMS door (phone + 6-digit PIN), 'otp' = suite door (phone + OTP) */
  channel: 'pin' | 'otp';
  /** Shown on the sign-in card */
  purpose: string;
  onVerified: (identity: DigiIdentity) => void;
  onBack: () => void;
  dark?: boolean;
};

/**
 * Pixel-close DigiLocker mock. Real DigiLocker sign-in is:
 *   mobile → OTP → (optional PIN). We mirror that look and split channels:
 *   DMS uses PIN, suite uses OTP. A "signing in to S.U.R.Y.A." consent strip
 *   replaces the real app's OAuth requester line.
 */
export function DigiLockerAuth({ channel, purpose, onVerified, onBack, dark }: Props) {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sentHint, setSentHint] = useState('');
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (step === 'code') codeRef.current?.focus(); }, [step]);

  const submitPhone = async () => {
    setError('');
    setBusy(true);
    const r = await digiSendOtp(phone);
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    setSentHint(r.phone);
    setStep('code');
  };

  const submitCode = async () => {
    setError('');
    setBusy(true);
    const r = channel === 'pin' ? await digiAuthPin(phone, code) : await digiAuthOtp(phone, code);
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    onVerified((r as { identity: DigiIdentity }).identity);
  };

  return (
    <div className={'dl-auth' + (dark ? ' dl-dark' : '')}>
      <div className="dl-tricolor"><i /><i /><i /></div>

      <header className="dl-header">
        <button className="dl-back" onClick={onBack}><ArrowLeft size={15} /> Back</button>
        <div className="dl-brand">
          <div className="dl-logo">DL</div>
          <div>
            <b>DigiLocker</b>
            <small>Digitise India, Digitise the Nation</small>
          </div>
        </div>
        <div className="dl-head-right">
          <span className="dl-lang">English | हिन्दी</span>
          <span className="dl-badge"><ShieldCheck size={13} /> Govt. of India</span>
        </div>
      </header>

      <div className="dl-requester">
        <LockKeyhole size={13} />
        <span>You are signing in to <b>{purpose}</b> via DigiLocker authentication.</span>
      </div>

      <main className="dl-card">
        <h2>Sign in to your account</h2>

        {step === 'phone' ? (
          <>
            <label>
              <span><Smartphone size={13} /> Mobile Number</span>
              <div className="dl-phone-row">
                <span className="dl-prefix">+91</span>
                <input
                  inputMode="numeric" autoFocus
                  value={phone}
                  onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                  placeholder="10-digit mobile number"
                  onKeyDown={e => e.key === 'Enter' && !busy && submitPhone()}
                />
              </div>
            </label>
            {error && <p className="dl-error">{error}</p>}
            <button className="dl-submit" disabled={phone.length !== 10 || busy} onClick={submitPhone}>
              {busy ? 'Sending…' : <>Get {channel === 'pin' ? 'PIN prompt' : 'OTP'} <ArrowRight size={15} /></>}
            </button>
          </>
        ) : (
          <>
            <p className="dl-sent">
              {channel === 'pin' ? 'Enter your 6-digit DigiLocker PIN' : `OTP sent to +91 ${sentHint}`}
              <button className="dl-resend" onClick={() => setStep('phone')}><RefreshCw size={12} /> change</button>
            </p>
            <label>
              <span>{channel === 'pin' ? 'Security PIN' : 'Enter OTP'}</span>
              <input
                ref={codeRef} inputMode="numeric" autoFocus className="dl-code"
                value={code}
                onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                placeholder={channel === 'pin' ? '••••••' : '6-digit OTP'}
                onKeyDown={e => e.key === 'Enter' && !busy && submitCode()}
              />
            </label>
            {error && <p className="dl-error">{error}</p>}
            <button className="dl-submit" disabled={code.length !== 6 || busy} onClick={submitCode}>
              {busy ? 'Verifying…' : <>Verify &amp; Continue <Check size={15} /></>}
            </button>
          </>
        )}

        <div className="dl-foot">
          <span><Fingerprint size={13} /> Secured with 256-bit encryption</span>
          <span>Demo authentication for presentation purposes</span>
        </div>
      </main>

      <footer className="dl-footer">
        <span>© 2026 DigiLocker mock · Ministry of Electronics &amp; IT (Demo)</span>
        <span>Terms · Privacy · Help</span>
      </footer>
    </div>
  );
}
