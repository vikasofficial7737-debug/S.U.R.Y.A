import { Scale, Sun, Moon, ArrowRight, ShieldCheck } from 'lucide-react';
import type { Role } from '../types';
import { info } from '../data/constants';

export function Landing({ role, setRole, start, dark, setDark }: { role: Role, setRole: (r: Role) => void, start: () => void, dark: boolean, setDark: (b: boolean) => void }) {
  return <div className={'landing ' + (dark ? 'dark' : '')}>
    <div className="tricolor"><i /><i /><i /></div>
    <header>
      <div className="brand"><Scale /><b>S.U.R.Y.A.<small>Smart Unified Resource for Judicial Assistance</small></b></div>
      <button onClick={() => setDark(!dark)}>{dark ? <Sun /> : <Moon />}</button>
    </header>
    <section className="landing-hero">
      <div className="chakra">☸</div><span>WELCOME TO</span><h1>S.U.R.Y.A.</h1>
      <div className="flagline"><i /><i /><i /></div>
      <p>AI-based legal and judicial support platform</p>
      <p className="intro">Legal support becomes clearer, organized, and more accessible — for every citizen, lawyer, and student.</p>
    </section>
    <div className="role-cards">{(Object.keys(info) as Role[]).map(r => {
      const d = info[r], Icon = d.icon;
      return <article className={'role-card ' + d.color + (role === r ? ' picked' : '')} key={r} onClick={() => setRole(r)}>
        <div className="illustration"><Icon /><div>⚖</div></div>
        <h2>I am a {d.name}</h2><p>{d.promise}</p>
        <ul>{r === 'citizen' ? <><li>AI legal guidance</li><li>Find verified lawyers</li></> : r === 'lawyer' ? <><li>Intelligent case workspace</li><li>Private document analysis</li></> : <><li>Simple case summaries</li><li>Learn at your own pace</li></>}</ul>
        <button onClick={start}>Continue <ArrowRight /></button>
      </article>
    })}</div>
    <footer><span><ShieldCheck /> AI provides assistance, not legal advice.</span><span>English · हिन्दी</span></footer>
  </div>
}
