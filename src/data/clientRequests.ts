/* Shared client–lawyer messaging model.
   The request/thread state lives in App and is handed to both sides, so the
   lawyer ("My Clients") and the citizen ("My Requests") always see the same
   conversation. */

export type AttachmentKind = 'image' | 'video' | 'document' | 'audio';

export type Attachment = {
  id: string;
  name: string;
  kind: AttachmentKind;
  size: number;
  /** Inline preview for images, kept in state as a data URL. */
  dataUrl?: string;
};

export type ChatMessage = {
  id: string;
  from: 'client' | 'lawyer';
  text: string;
  at: string;
  attachments: Attachment[];
};

export type RequestStatus = 'pending' | 'accepted' | 'declined';

export type ClientRequest = {
  id: string;
  clientName: string;
  clientInitials: string;
  clientCity: string;
  issue: string;
  details: string;
  area: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  /** Set for requests the citizen created against a specific lawyer listing. */
  lawyerName?: string;
  /** Demo flag: true for threads the lawyer can converse in. */
  demoThread?: boolean;
  messages: ChatMessage[];
};

export const uid = () => Math.random().toString(36).slice(2, 9);

const now = () => new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
export const timestampNow = now;

const at = (minsAgo: number) => {
  const d = new Date(Date.now() - minsAgo * 60000);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export function kindForFile(name: string, mime: string): AttachmentKind {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic'].includes(ext)) return 'image';
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'm4a', 'ogg'].includes(ext)) return 'audio';
  return 'document';
}

export function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ---------- Seed data (demo conversations) ---------- */

export const SEED_REQUESTS: ClientRequest[] = [
  {
    id: 'req-meera',
    clientName: 'Meera Sharma',
    clientInitials: 'MS',
    clientCity: 'Jaipur, Rajasthan',
    issue: 'Phone snatched near Market Road — FIR and recovery help',
    details: 'My phone was snatched on 12 Aug around 8:40 pm near the market road. FIR is filed; the police shared a CCTV clip. I need help pushing the investigation and recovery of the device.',
    area: 'Criminal',
    status: 'pending',
    createdAt: at(38),
    updatedAt: at(38),
    lawyerName: 'Vikas Singh',
    messages: [
      { id: 'm1', from: 'client', text: 'Hello sir, I filed the FIR the next morning. The investigating officer said the CCTV clip has two faces but no IDs yet.', at: at(38), attachments: [] },
      { id: 'm2', from: 'client', text: 'This is the clip the police shared with me.', at: at(37), attachments: [{ id: 'a1', name: 'market_road_cctv.mp4', kind: 'video', size: 8_420_000 }] },
    ],
  },
  {
    id: 'req-arjun',
    clientName: 'Ramesh Kumar',
    clientInitials: 'RK',
    clientCity: 'Sikar, Rajasthan',
    issue: 'Builder delaying possession — agreement violation',
    details: 'The builder missed the third possession deadline for my flat. I have the agreement, payment receipts and reminder emails. Want to send a legal notice.',
    area: 'Consumer',
    status: 'pending',
    createdAt: at(190),
    updatedAt: at(190),
    lawyerName: 'Vikas Singh',
    messages: [
      { id: 'm1', from: 'client', text: 'Attached the booking agreement and the last two reminder emails. Possession was promised for March.', at: at(190), attachments: [{ id: 'a2', name: 'possession_agreement.pdf', kind: 'document', size: 1_240_000 }, { id: 'a3', name: 'reminder_email_may.pdf', kind: 'document', size: 210_000 }] },
    ],
  },
  {
    id: 'req-anita',
    clientName: 'Anita Sharma',
    clientInitials: 'AS',
    clientCity: 'Jaipur, Rajasthan',
    issue: 'Unauthorized ₹48,000 deduction by City Bank',
    details: 'The bank deducted ₹48,000 without authorization in March. Written complaints have gone unanswered. Consumer complaint is under review at the forum.',
    area: 'Consumer',
    status: 'accepted',
    createdAt: at(2_900),
    updatedAt: at(50),
    lawyerName: 'Vikas Singh',
    demoThread: true,
    messages: [
      { id: 'm1', from: 'client', text: 'Advocate sahab, the forum review is on 01 Oct. The bank sent a reply letter yesterday.', at: at(300), attachments: [{ id: 'a4', name: 'bank_reply_letter.pdf', kind: 'document', size: 340_000 }] },
      { id: 'm2', from: 'lawyer', text: 'Received. I will read it tonight and prepare our response before the review. Please do not respond to the bank directly in the meantime.', at: at(120), attachments: [] },
      { id: 'm3', from: 'client', text: 'Understood sir. Also attaching the March statement showing the deduction.', at: at(50), attachments: [{ id: 'a5', name: 'march_statement.pdf', kind: 'document', size: 520_000 }] },
    ],
  },
];

/* ---------- File picking helper shared by chat UIs ---------- */

export type PickedFile = { name: string; kind: AttachmentKind; size: number; dataUrl?: string; mime: string };

export function readFilesAsAttachments(files: FileList | null): Promise<PickedFile[]> {
  if (!files || !files.length) return Promise.resolve([]);
  const jobs = Array.from(files).map(file => new Promise<PickedFile>(resolve => {
    const kind = kindForFile(file.name, file.type);
    // Inline previews only for small images; everything else is described by name/size.
    if (kind === 'image' && file.size < 1_500_000) {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, kind, size: file.size, dataUrl: String(reader.result), mime: file.type });
      reader.onerror = () => resolve({ name: file.name, kind, size: file.size, mime: file.type });
      reader.readAsDataURL(file);
    } else {
      resolve({ name: file.name, kind, size: file.size, mime: file.type });
    }
  }));
  return Promise.all(jobs);
}

/* ---------- Case-file (data room) types for the detailed case view ---------- */

export type CaseFileItem = {
  id: string;
  name: string;
  kind: AttachmentKind;
  source: string;
  added: string;
  note?: string;
};

export type DetailedTimelineEntry = {
  label: string;
  date: string;
  done?: boolean;
  active?: boolean;
  /** What happened at this stage; surfaces in the node info popup. */
  summary?: string;
  /** Extra context for the popup: who, what, where. */
  participants?: string[];
  outcome?: string;
};

export type CaseWitness = { name: string; role: string; status: string };

export type CaseExtra = {
  facts: string[];
  victims: { name: string; detail: string }[];
  witnesses: CaseWitness[];
  detailedTimeline: DetailedTimelineEntry[];
  caseFile: CaseFileItem[];
  statuteNotes: { section: string; note: string }[];
};
