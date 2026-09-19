import { UserRound, BriefcaseBusiness, GraduationCap, Home, Bot, Users, Check, BookOpen, Briefcase, Sparkles, CalendarDays, FileText } from 'lucide-react';
import type { Help } from '../types';

export const info = {
  citizen: { name: 'Citizen', icon: UserRound, color: 'orange', promise: 'Clear legal guidance, when you need it.' },
  lawyer: { name: 'Lawyer', icon: BriefcaseBusiness, color: 'blue', promise: 'Organize cases. Work with clarity.' },
  student: { name: 'Student', icon: GraduationCap, color: 'green', promise: 'Understand landmark cases, simply.' }
} as const;

export const nav = {
  citizen: [['Home', Home, 'home'], ['Ask S.U.R.Y.A.', Bot, 'chat'], ['Find a Lawyer', Users, 'lawyers'], ['My Legal Steps', Check, 'cases'], ['Know Your Rights', BookOpen, 'library']],
  lawyer: [['Dashboard', Home, 'home'], ['My Cases', Briefcase, 'cases'], ['AI Case Assistant', Sparkles, 'chat'], ['Judgment Research', BookOpen, 'library'], ['Calendar & Reminders', CalendarDays, 'cases']],
  student: [['Study Home', Home, 'home'], ['Case Library', BookOpen, 'library'], ['Ask about a Case', Bot, 'chat'], ['My Notes', FileText, 'cases']]
} as const;

export function legalHelp(text: string): Help {
  let q = text.toLowerCase();
  if (/phone|mobile|stolen|theft|lost/.test(q)) return { title: 'Phone theft or loss', now: ['Call your mobile operator to block the SIM.', 'File a police complaint with the place and time of loss.', 'Use the CEIR portal to request blocking of the device IMEI.'], docs: ['Government ID proof', 'Mobile number and IMEI / purchase invoice', 'Copy of police complaint'], where: 'Nearest police station, then the CEIR portal', source: 'CEIR / Department of Telecommunications' };
  if (/fraud|upi|bank|scam|money|transaction/.test(q)) return { title: 'Online financial fraud', now: ['Call 1930 immediately to report the transaction.', 'Contact your bank or payment provider and request a freeze.', 'Preserve screenshots, transaction IDs, messages and call records.'], docs: ['Transaction ID and bank details', 'Screenshots / chats / URLs', 'Identity proof'], where: '1930 cyber fraud helpline and cybercrime.gov.in', source: 'National Cyber Crime Reporting Portal' };
  if (/cyber|instagram|facebook|harass|blackmail/.test(q)) return { title: 'Cybercrime report', now: ['Do not delete messages, URLs, or screenshots.', 'Use the National Cyber Crime Reporting Portal.', 'If you feel unsafe, contact local police immediately.'], docs: ['Screenshots and profile links', 'Device / account details', 'Identity proof'], where: 'cybercrime.gov.in or your local cyber cell', source: 'National Cyber Crime Reporting Portal' };
  if (/property|land|tenant|rent|house/.test(q)) return { title: 'Property or tenancy concern', now: ['Collect agreements, receipts, notices and ownership records.', 'Write down a timeline of events and all parties involved.', 'Consider a legal-aid clinic or property lawyer for document review.'], docs: ['Sale deed / rent agreement', 'Tax receipts and notices', 'Communication records'], where: 'District Legal Services Authority or a property-law specialist', source: 'National Legal Services Authority' };
  return { title: 'General legal guidance', now: ['Write down a clear timeline of what happened.', 'Keep originals and copies of all messages and documents.', 'Use the relevant official authority or consult a qualified lawyer for advice specific to your facts.'], docs: ['Identity proof', 'Written timeline', 'Relevant notices, receipts, or communications'], where: 'Relevant local authority or District Legal Services Authority', source: 'National Legal Services Authority' }
}
