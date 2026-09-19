import type { Role, View } from '../types';
import { LawyerHome } from './LawyerHome';
import { StudentHome } from './StudentHome';
import { CitizenHome } from './CitizenHome';

export function HomeView({ role, go, flash }: { role: Role, go: (v: View) => void, flash: (s: string) => void }) {
  if (role === 'lawyer') return <LawyerHome go={go} flash={flash} />;
  if (role === 'student') return <StudentHome go={go} flash={flash} />;
  return <CitizenHome go={go} flash={flash} />
}
