import { useEffect, useRef, useState } from 'react';
import { Check, FileText, Film, Image as ImageIcon, Paperclip, Send, X } from 'lucide-react';
import { humanSize, readFilesAsAttachments, type ClientRequest } from '../data/clientRequests';

const KIND_ICON = { image: ImageIcon, video: Film, document: FileText, audio: Paperclip } as const;

function AttachChip({ name, kind, size, dataUrl }: { name: string; kind: keyof typeof KIND_ICON; size?: number; dataUrl?: string }) {
  const Icon = KIND_ICON[kind];
  if (kind === 'image' && dataUrl) {
    return <span className="cc-attach cc-attach-img"><img src={dataUrl} alt={name} /></span>;
  }
  return (
    <span className="cc-attach" title={`${name}${size ? ` · ${humanSize(size)}` : ''}`}>
      <Icon />
      <span className="cc-attach-name">{name}</span>
      {size != null && <small>{humanSize(size)}</small>}
    </span>
  );
}

/** The citizen⇄lawyer conversation. Both roles render this component with
    different `role` values; they must receive the same thread object. */
export function ClientChat({
  request,
  role,
  onSend,
  onBack,
}: {
  request: ClientRequest;
  role: 'lawyer' | 'citizen';
  onSend: (requestId: string, text: string, attachments: { name: string; kind: 'image' | 'video' | 'document' | 'audio'; size: number; dataUrl?: string }[]) => void;
  onBack?: () => void;
}) {
  const [text, setText] = useState('');
  const [staged, setStaged] = useState<{ name: string; kind: 'image' | 'video' | 'document' | 'audio'; size: number; dataUrl?: string }[]>([]);
  const [reading, setReading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [request.messages.length]);

  const other = role === 'lawyer' ? request.clientName : request.lawyerName || 'Advocate';

  const pickFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setReading(true);
    const picked = await readFilesAsAttachments(files);
    setStaged(cur => [...cur, ...picked.map(p => ({ name: p.name, kind: p.kind, size: p.size, dataUrl: p.dataUrl }))]);
    setReading(false);
  };

  const send = () => {
    if (!text.trim() && !staged.length) return;
    onSend(request.id, text.trim() || '(shared an attachment)', staged);
    setText('');
    setStaged([]);
    setShowPicker(false);
  };

  return (
    <div className="cc-wrap">
      <div className="cc-head">
        {onBack && <button className="cc-back" onClick={onBack}>← Back</button>}
        <span className="cc-avatar">{role === 'lawyer' ? request.clientInitials : 'VS'}</span>
        <div>
          <b>{other}</b>
          <small>{request.area} · {request.clientCity}</small>
        </div>
        <span className={`cc-status ${request.status}`}>{request.status === 'accepted' ? 'In discussion' : request.status}</span>
      </div>

      <div className="cc-thread">
        <div className="cc-day">Request conversation · started {request.createdAt}</div>
        {request.messages.map(m => (
          <article key={m.id} className={`cc-msg ${m.from === role ? 'me' : 'them'}`}>
            <b>{m.from === 'lawyer' ? 'Advocate' : request.clientName}</b>
            {m.text !== '(shared an attachment)' && <p>{m.text}</p>}
            {!!m.attachments.length && (
              <div className="cc-attach-row">
                {m.attachments.map(a => <AttachChip key={a.id} {...a} />)}
              </div>
            )}
            <time>{m.at}</time>
          </article>
        ))}
        <div ref={endRef} />
      </div>

      {!!staged.length && (
        <div className="cc-staged">
          {staged.map((a, i) => (
            <span className="cc-staged-item" key={a.name + i}>
              <AttachChip {...a} />
              <button onClick={() => setStaged(cur => cur.filter((_, j) => j !== i))} aria-label={`Remove ${a.name}`}><X /></button>
            </span>
          ))}
        </div>
      )}

      <div className="cc-composer">
        {showPicker && (
          <div className="cc-picker">
            <button onClick={() => { fileRef.current?.setAttribute('accept', 'image/*'); fileRef.current?.click(); }}><ImageIcon /> Photo</button>
            <button onClick={() => { fileRef.current?.setAttribute('accept', 'video/*'); fileRef.current?.click(); }}><Film /> Video</button>
            <button onClick={() => { fileRef.current?.setAttribute('accept', 'application/pdf,.doc,.docx'); fileRef.current?.click(); }}><FileText /> Document</button>
            <button onClick={() => { fileRef.current?.setAttribute('accept', 'audio/*'); fileRef.current?.click(); }}><Paperclip /> Audio</button>
          </div>
        )}
        <button className="cc-clip" title="Share evidence or document" onClick={() => setShowPicker(v => !v)}><Paperclip /></button>
        <input
          className="cc-input"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder={role === 'lawyer' ? 'Reply to your client…' : 'Share updates, evidence or questions…'}
        />
        <button className="cc-send" onClick={send} disabled={!text.trim() && !staged.length}><Send /></button>
        <input
          ref={fileRef}
          type="file"
          multiple
          hidden
          onChange={e => { pickFiles(e.target.files); e.target.value = ''; }}
        />
      </div>
      {reading && <p className="cc-reading">Reading files…</p>}
      <p className="cc-note"><Check width={12} /> Share only what is relevant to this case. Do not include sensitive personal data you do not intend to be part of the case file.</p>
    </div>
  );
}
