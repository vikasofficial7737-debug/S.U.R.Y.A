/* ============================================================================
   AuthService — the single identity gateway for the whole platform.

   Two doors, one identity system:
     • DMS door   : DigiLocker phone+PIN  → Unique ID (role derived from DB)
     • Suite door : DigiLocker phone+OTP  → (lawyer) + Bar enrollment ID

   Every verification is a *binding* check: an ID is only valid when it is
   linked to the EXACT DigiLocker identity that just authenticated. This is
   what prevents privilege escalation — the UI never asks "what's your role?",
   the identity store answers it.

   Live mode queries Supabase; demo mode consults identityBindings.ts so the
   presentation works with zero network.
   ========================================================================== */

import { db, isLive, dbError } from './db';
import {
  DIGI_IDENTITIES, DMS_OFFICERS, ADVOCATES, SUITE_USERS,
  normalizePhone, ROLE_LABELS,
  type DigiIdentity, type OfficerRecord, type AdvocateRecord, type SuiteUserRecord,
  type SuiteRole,
} from '../data/identityBindings';

/* Demo PIN / OTP codes (demo only — sheet in docs/demo-credentials.md) */
const DEMO_DMS_PIN = '123456';
const DEMO_SUITE_OTP = '123456';

export type DigiAuth =
  | { ok: true; identity: DigiIdentity; channel: 'pin' | 'otp' }
  | { ok: false; error: string };

export type DmsLoginResult =
  | { ok: true; officer: OfficerRecord; identity: DigiIdentity }
  | { ok: false; error: string; code: 'NO_IDENTITY' | 'BAD_UNIQUE_ID' | 'NOT_LINKED' | 'INACTIVE' };

export type AdvocateVerifyResult =
  | { ok: true; advocate: AdvocateRecord; identity: DigiIdentity }
  | { ok: false; error: string; code: 'BAD_BAR_ID' | 'NOT_LINKED' | 'INACTIVE' | 'NO_COP' };

export type SuiteLoginResult =
  | { ok: true; user: SuiteUserRecord; identity: DigiIdentity }
  | { ok: false; error: string };

export type AuditInsert = {
  actor: string;
  actorRole: string | null;
  action: string;
  resource?: string;
  caseRef?: string;
  details?: Record<string, unknown>;
};

/* ------------------------------------------------------------ audit helper */

export async function audit(entry: AuditInsert): Promise<void> {
  const row = {
    actor: entry.actor,
    actor_role: entry.actorRole,
    action: entry.action,
    resource: entry.resource ?? null,
    case_ref: entry.caseRef ?? null,
    details: entry.details ?? {},
  };
  if (isLive() && db) {
    const { error } = await db.from('audit_log').insert(row);
    if (error) console.warn('[audit] insert failed:', dbError(error));
  } else {
    try {
      const k = 'surya-demo-audit';
      const list = JSON.parse(localStorage.getItem(k) || '[]');
      list.unshift({ id: Date.now(), happened_at: new Date().toISOString(), ...row });
      localStorage.setItem(k, JSON.stringify(list.slice(0, 400)));
    } catch { /* storage unavailable */ }
  }
}

/* ------------------------------------------- live lookup w/ graceful degrade */

type LiveQuery = () => PromiseLike<{ data: any; error: any }>;

/**
 * Runs a live Supabase query and degrades to the demo store when the backend
 * is unreachable or the table isn't deployed yet — the presentation must never
 * break because of infrastructure. A *successful* live query stays strict: an
 * empty live result means "not found", not "use demo data".
 */
async function liveWithFallback<R>(
  query: LiveQuery,
  map: (row: any) => R,
  demo: () => R | undefined,
): Promise<{ value: R | undefined; live: boolean }> {
  if (!(isLive() && db)) return { value: demo(), live: false };
  try {
    const { data, error } = await query();
    if (error) {
      console.warn('[auth] live lookup unavailable — using demo store:', dbError(error));
      return { value: demo(), live: false };
    }
    return { value: data ? map(data) : undefined, live: true };
  } catch (e) {
    console.warn('[auth] live lookup failed — using demo store:', dbError(e));
    return { value: demo(), live: false };
  }
}

/* ------------------------------------------------------- DigiLocker layer */

/** Demo DigiLocker "send OTP" — always succeeds, code is fixed in demo. */
export async function digiSendOtp(phoneRaw: string): Promise<{ ok: true; phone: string } | { ok: false; error: string }> {
  const phone = normalizePhone(phoneRaw);
  if (phone.length !== 12) return { ok: false, error: 'Enter a valid 10-digit Indian mobile number.' };
  await audit({ actor: phone, actorRole: null, action: 'DIGILOCKER_OTP_SENT', resource: 'DigiLocker mock' });
  return { ok: true, phone };
}

/** DMS door: phone + PIN. */
export async function digiAuthPin(phoneRaw: string, pin: string): Promise<DigiAuth> {
  const phone = normalizePhone(phoneRaw);
  if (pin !== DEMO_DMS_PIN) {
    await audit({ actor: phone, actorRole: null, action: 'DIGILOCKER_PIN_FAILED', resource: 'DMS gateway' });
    return { ok: false, error: 'Incorrect 6-digit DigiLocker PIN.' };
  }
  const { value: identity } = await liveWithFallback<DigiIdentity>(
    () => db!.from('digilocker_identities').select('*').eq('phone', phone).maybeSingle(),
    row => ({ phone: row.phone, digilockerRef: row.digilocker_ref, fullName: row.full_name, dob: row.dob ?? '' }),
    () => DIGI_IDENTITIES.find(i => i.phone === phone),
  );
  if (!identity) {
    return { ok: false, error: 'No DigiLocker account exists for this number. Register on DigiLocker first.' };
  }
  await audit({ actor: phone, actorRole: null, action: 'DIGILOCKER_PIN_OK', resource: 'DMS gateway' });
  return { ok: true, identity, channel: 'pin' };
}

/** Suite door: phone + OTP (fixed demo code). */
export async function digiAuthOtp(phoneRaw: string, otp: string): Promise<DigiAuth> {
  const phone = normalizePhone(phoneRaw);
  if (otp.trim() !== DEMO_SUITE_OTP) {
    await audit({ actor: phone, actorRole: null, action: 'DIGILOCKER_OTP_FAILED', resource: 'Assistance suite' });
    return { ok: false, error: 'Incorrect OTP. Request a new one.' };
  }
  const { value: identity } = await liveWithFallback<DigiIdentity>(
    () => db!.from('digilocker_identities').select('*').eq('phone', phone).maybeSingle(),
    row => ({ phone: row.phone, digilockerRef: row.digilocker_ref, fullName: row.full_name, dob: row.dob ?? '' }),
    () => DIGI_IDENTITIES.find(i => i.phone === phone),
  );
  if (!identity) {
    return { ok: false, error: 'No DigiLocker account exists for this number. Register on DigiLocker first.' };
  }
  await audit({ actor: phone, actorRole: null, action: 'DIGILOCKER_OTP_OK', resource: 'Assistance suite' });
  return { ok: true, identity, channel: 'otp' };
}

/* ------------------------------------------------------------ DMS binding */

/** The core binding check: unique ID must belong to THIS DigiLocker identity. */
export async function dmsResolveOfficer(phone: string, uniqueIdRaw: string): Promise<DmsLoginResult> {
  const uniqueId = uniqueIdRaw.trim().toUpperCase();
  const { value: officer } = await liveWithFallback<OfficerRecord>(
    () => db!.from('dms_officers').select('*').eq('unique_id', uniqueId).maybeSingle(),
    row => ({
      uniqueId: row.unique_id, phone: row.phone, role: row.role, fullName: row.full_name,
      department: row.department, unit: row.unit, policeStation: row.police_station,
      jurisdiction: row.jurisdiction, clearance: row.clearance, badgeNo: row.badge_no,
      rank: row.rank, joinedOn: row.joined_on, active: row.active,
    }),
    () => DMS_OFFICERS.find(o => o.uniqueId === uniqueId),
  );
  if (!officer) {
    await audit({ actor: phone, actorRole: null, action: 'DMS_LOGIN_UNKNOWN_ID', resource: uniqueId });
    return { ok: false, error: `No officer record exists for ID “${uniqueId}”.`, code: 'BAD_UNIQUE_ID' };
  }
  if (officer.active === false) {
    return { ok: false, error: 'This officer account is deactivated. Contact your department admin.', code: 'INACTIVE' };
  }
  if (officer.phone !== phone) {
    await audit({ actor: phone, actorRole: null, action: 'DMS_LOGIN_BINDING_DENIED', resource: uniqueId });
    return {
      ok: false,
      error: `ID “${uniqueId}” is registered to a different DigiLocker account. Sign in with the linked mobile number.`,
      code: 'NOT_LINKED',
    };
  }
  await audit({ actor: officer.uniqueId, actorRole: officer.role, action: 'DMS_LOGIN_OK', resource: officer.department });
  return { ok: true, officer, identity: DIGI_IDENTITIES.find(i => i.phone === phone) || { phone, digilockerRef: 'DL-LIVE', fullName: officer.fullName, dob: '' } };
}

/* -------------------------------------------------------- Advocate layer */

/** Lawyer's second layer: Bar enrollment ID bound to this DigiLocker identity. */
export async function verifyAdvocate(phone: string, barIdRaw: string): Promise<AdvocateVerifyResult> {
  const barId = barIdRaw.trim().toUpperCase();
  const { value: advocate } = await liveWithFallback<AdvocateRecord>(
    () => db!.from('advocates').select('*').eq('bar_enrollment_id', barId).maybeSingle(),
    row => ({
      barEnrollmentId: row.bar_enrollment_id, phone: row.phone, fullName: row.full_name,
      stateBarCouncil: row.state_bar_council, enrollmentYear: row.enrollment_year,
      practiceAreas: row.practice_areas ?? [], copVerified: row.cop_verified,
    }),
    () => ADVOCATES.find(a => a.barEnrollmentId === barId),
  );
  if (!advocate) {
    await audit({ actor: phone, actorRole: 'lawyer', action: 'ADVOCATE_UNKNOWN_BAR_ID', resource: barId });
    return { ok: false, error: `No advocate enrollment found for “${barId}”. Format: STATE/NUMBER/YEAR (e.g. RAJ/1823/2019).`, code: 'BAD_BAR_ID' };
  }
  if (advocate.phone !== phone) {
    await audit({ actor: phone, actorRole: 'lawyer', action: 'ADVOCATE_BINDING_DENIED', resource: barId });
    return { ok: false, error: `Enrollment “${barId}” is registered to a different DigiLocker account.`, code: 'NOT_LINKED' };
  }
  if (!advocate.copVerified) {
    return { ok: false, error: 'Certificate of Practice not verified on this enrollment.', code: 'NO_COP' };
  }
  await audit({ actor: advocate.barEnrollmentId, actorRole: 'lawyer', action: 'ADVOCATE_VERIFY_OK', resource: advocate.stateBarCouncil });
  return { ok: true, advocate, identity: DIGI_IDENTITIES.find(i => i.phone === phone) || { phone, digilockerRef: 'DL-LIVE', fullName: advocate.fullName, dob: '' } };
}

/* ---------------------------------------------------------- Suite resolve */

/** After OTP: resolve the suite user (citizen/student; lawyer goes to bar layer). */
export async function resolveSuiteUser(phone: string, wanted: SuiteRole): Promise<SuiteLoginResult> {
  const { value: user } = await liveWithFallback<SuiteUserRecord>(
    () => db!.from('suite_users').select('*').eq('phone', phone).maybeSingle(),
    row => ({ phone: row.phone, suiteRole: row.suite_role, fullName: row.full_name, city: row.city, state: row.state }),
    () => SUITE_USERS.find(u => u.phone === phone),
  );
  if (!user) {
    return { ok: false, error: 'No profile found for this DigiLocker account in the assistance suite.' };
  }
  // If their stored role differs from the card they tapped, trust the DB and
  // tell them where they actually belong (prevents role spoofing via UI).
  if (user.suiteRole !== wanted) {
    if (wanted === 'lawyer') {
      const adv = ADVOCATES.find(a => a.phone === phone);
      if (adv) return { ok: true, user, identity: DIGI_IDENTITIES.find(i => i.phone === phone)! };
    }
    return { ok: false, error: `This DigiLocker account is registered as a ${user.suiteRole}. Use the ${user.suiteRole} card to continue.` };
  }
  await audit({ actor: phone, actorRole: user.suiteRole, action: 'SUITE_LOGIN_OK', resource: user.suiteRole });
  return { ok: true, user, identity: DIGI_IDENTITIES.find(i => i.phone === phone) || { phone, digilockerRef: 'DL-LIVE', fullName: user.fullName, dob: '' } };
}

export { ROLE_LABELS };
