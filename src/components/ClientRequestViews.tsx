import { useState } from 'react';
import { Check, ChevronRight, MessageSquare, X } from 'lucide-react';
import { ClientChat } from './ClientChat';
import type { ClientRequest } from '../data/clientRequests';

type SendFn = (requestId: string, text: string, attachments: { name: string; kind: 'image' | 'video' | 'document' | 'audio'; size: number; dataUrl?: string }[]) => void;

function InboxStats({ requests }: { requests: ClientRequest[] }) {
  const pending = requests.filter(r => r.status === 'pending').length;
  const accepted = requests.filter(r => r.status === 'accepted').length;
  return (
    <div className="cr-stats">
      <span><b>{pending}</b> new requests</span>
      <span><b>{accepted}</b> active clients</span>
      <span><b>{requests.reduce((n, r) => n + r.messages.length, 0)}</b> messages</span>
    </div>
  );
}

/** Lawyer side: inbox of client requests + conversations. */
export function MyClientsView({
  requests,
  onAccept,
  onDecline,
  onSend,
}: {
  requests: ClientRequest[];
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onSend: SendFn;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [tab, setTab] = useState<'inbox' | 'clients'>('inbox');
  const open = requests.find(r => r.id === openId);

  if (open) {
    return (
      <>
        <div className="heading"><div><em>CLIENT CONVERSATION</em><h1>{open.clientName}</h1><p>{open.issue}</p></div></div>
        <ClientChat request={open} role="lawyer" onSend={onSend} onBack={() => setOpenId(null)} />
      </>
    );
  }

  const pending = requests.filter(r => r.status === 'pending');
  const accepted = requests.filter(r => r.status === 'accepted');

  return (
    <>
      <div className="heading">
        <div>
          <em>CLIENT INTAKE & MESSAGING</em>
          <h1>My clients</h1>
          <p>Review incoming requests, accept the matters you want, and talk to clients with documents, photos and videos in one thread.</p>
        </div>
      </div>
      <InboxStats requests={requests} />

      <div className="cr-tabs">
        <button className={tab === 'inbox' ? 'on' : ''} onClick={() => setTab('inbox')}>
          Requests {pending.length > 0 && <i>{pending.length}</i>}
        </button>
        <button className={tab === 'clients' ? 'on' : ''} onClick={() => setTab('clients')}>
          Active clients {accepted.length > 0 && <i>{accepted.length}</i>}
        </button>
      </div>

      {tab === 'inbox' && (
        <section className="panel cr-list">
          {pending.length === 0 && <p className="cr-empty">No pending requests right now. New requests from citizens will appear here.</p>}
          {pending.map(r => (
            <article key={r.id} className="cr-item">
              <span className="cr-avatar">{r.clientInitials}</span>
              <div className="cr-body">
                <b>{r.clientName} <small>· {r.clientCity}</small></b>
                <p className="cr-issue">{r.issue}</p>
                <p className="cr-details">{r.details}</p>
                <div className="cr-meta">
                  <span>{r.area}</span><span>·</span><span>{r.createdAt}</span>
                  {r.messages.some(m => m.attachments.length > 0) && <span className="cr-att"><Check width={11} /> has attachments</span>}
                </div>
              </div>
              <div className="cr-actions">
                <button className="cr-accept" onClick={() => onAccept(r.id)}><Check /> Accept</button>
                <button className="cr-decline" onClick={() => onDecline(r.id)}><X /> Decline</button>
              </div>
            </article>
          ))}
        </section>
      )}

      {tab === 'clients' && (
        <section className="panel cr-list">
          {accepted.length === 0 && <p className="cr-empty">No active clients yet. Accept a request to start a conversation.</p>}
          {accepted.map(r => (
            <button key={r.id} className="cr-thread-row" onClick={() => setOpenId(r.id)}>
              <span className="cr-avatar">{r.clientInitials}</span>
              <div className="cr-body">
                <b>{r.clientName}</b>
                <p className="cr-issue">{r.issue}</p>
                <p className="cr-last">{r.messages[r.messages.length - 1]?.text}</p>
              </div>
              <span className="cr-when">{r.messages[r.messages.length - 1]?.at}</span>
              <ChevronRight />
            </button>
          ))}
        </section>
      )}
    </>
  );
}

/** Citizen side: the requests this user sent, their status, and the same chat. */
export function MyRequestsView({
  requests,
  onSend,
  onNew,
}: {
  requests: ClientRequest[];
  onSend: SendFn;
  onNew: () => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = requests.find(r => r.id === openId);
  const justAccepted = requests.filter(r => r.status === 'accepted' && r.updatedAt >= r.createdAt && r.messages.length >= 2);

  if (open) {
    return (
      <>
        <div className="heading"><div><em>YOUR CONVERSATION</em><h1>{open.lawyerName || 'Advocate'}</h1><p>{open.issue}</p></div></div>
        <ClientChat request={open} role="citizen" onSend={onSend} onBack={() => setOpenId(null)} />
      </>
    );
  }

  return (
    <>
      <div className="heading">
        <div>
          <em>YOUR LAWYER CONVERSATIONS</em>
          <h1>My requests</h1>
          <p>Requests you sent to advocates, their status, and the conversation for each accepted matter. You can share photos, videos and documents here.</p>
        </div>
        <button className="primary" onClick={onNew}><MessageSquare /> New request</button>
      </div>

      <section className="panel cr-list">
        {requests.length === 0 && (
          <p className="cr-empty">You have not contacted a lawyer yet. Open “Find a Lawyer”, pick an advocate, and send a request describing your issue.</p>
        )}
        {justAccepted.length > 0 && (
          <div className="cr-notice">
            <Check /> {justAccepted.length === 1
              ? `${justAccepted[0].lawyerName || 'The advocate'} accepted your request — the conversation is open now.`
              : `${justAccepted.length} of your requests were accepted — conversations are open now.`}
          </div>
        )}
        {requests.map(r => {
          const last = r.messages[r.messages.length - 1];
          return (
            <div key={r.id} className="cr-thread-row" role="button" tabIndex={0}
              onClick={() => r.status === 'accepted' && setOpenId(r.id)}
              onKeyDown={e => e.key === 'Enter' && r.status === 'accepted' && setOpenId(r.id)}>
              <span className="cr-avatar">{r.lawyerName?.split(' ').map(w => w[0]).slice(0, 2).join('') || 'AD'}</span>
              <div className="cr-body">
                <b>{r.lawyerName || 'Advocate'} <small>· {r.area}</small></b>
                <p className="cr-issue">{r.issue}</p>
                <p className="cr-last">{r.status === 'accepted' ? (last?.text ?? 'Conversation open') : r.status === 'pending' ? 'Waiting for the advocate to respond…' : 'The advocate declined this request.'}</p>
              </div>
              <span className={`cr-status-chip ${r.status}`}>{r.status === 'accepted' ? 'Accepted' : r.status === 'pending' ? 'Pending' : 'Declined'}</span>
              {r.status === 'accepted' && <ChevronRight />}
            </div>
          );
        })}
      </section>
      <p className="cr-footnote">Declined or pending requests keep their details so you can send them to another advocate.</p>
    </>
  );
}
