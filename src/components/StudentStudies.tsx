import { useMemo, useState } from 'react';
import { Check, ChevronRight, GraduationCap, History, RefreshCw, Sparkles, Trophy, X } from 'lucide-react';
import { generateQuiz, type GeneratedQuiz } from '../lib/gemini';
import { JUDGMENTS, type Judgment } from '../data/judgments';

export type StudyRecord = {
  judgmentId: string;
  /** Last time the student opened this case. */
  readAt: string;
  timesRead: number;
};

export type QuizAttempt = {
  id: string;
  /** Judgment ids the quiz was built from. */
  basedOn: string[];
  names: string[];
  score: number;
  total: number;
  at: string;
};

const uid = () => Math.random().toString(36).slice(2, 9);
const nowStr = () => new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Best score per quiz signature (sorted judgment ids), for the history list. */
const bestScore = (history: QuizAttempt[], basedOn: string[]) => {
  const sig = [...basedOn].sort().join('|');
  const attempts = history.filter(a => [...a.basedOn].sort().join('|') === sig);
  if (!attempts.length) return null;
  return attempts.reduce((best, a) => (a.score / a.total > best.score / best.total ? a : best));
};

/** Interactive quiz runner for one generated quiz. */
function QuizRunner({ quiz, onDone }: { quiz: GeneratedQuiz; onDone: (score: number, total: number) => void }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = quiz.questions[idx];
  const total = quiz.questions.length;

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answerIndex) setScore(s => s + 1);
  };

  const next = () => {
    if (idx + 1 >= total) {
      setFinished(true);
      onDone(score, total);
    } else {
      setIdx(i => i + 1);
      setPicked(null);
    }
  };

  if (finished) {
    const pct = Math.round((score / total) * 100);
    return (
      <div className="qz-result">
        <Trophy />
        <b>{score} / {total} correct</b>
        <span>{pct >= 80 ? 'Excellent — exam ready on this set.' : pct >= 50 ? 'Good — revise the explanations below.' : 'Worth re-reading the cases, then retry.'}</span>
        <div className="qz-review">
          {quiz.questions.map((qq, i) => (              <div key={i} className="qz-review-item">
              <b>{i + 1}. {qq.question}</b>
              <p><Check width={12} /> {qq.options[qq.answerIndex]}</p>
              <small>{qq.explanation}</small>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="qz-runner">
      <div className="qz-progress"><span>Question {idx + 1} of {total}</span><small>Score {score}</small></div>
      <b className="qz-question">{q.question}</b>
      <div className="qz-options">
        {q.options.map((opt, i) => {
          const isAnswer = i === q.answerIndex;
          const isPicked = i === picked;
          const cls = picked === null ? '' : isAnswer ? 'right' : isPicked ? 'wrong' : '';
          return (
            <button key={i} className={cls} onClick={() => choose(i)} disabled={picked !== null}>
              <span className="qz-letter">{'ABCD'[i]}</span>
              {opt}
              {picked !== null && isAnswer && <Check className="qz-mark" />}
              {picked !== null && isPicked && !isAnswer && <X className="qz-mark" />}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <>
          <p className="qz-explain"><b>{picked === q.answerIndex ? 'Correct. ' : 'Not quite. '}</b>{q.explanation}</p>
          <button className="primary qz-next" onClick={next}>{idx + 1 >= total ? 'Finish quiz' : 'Next question'} <ChevronRight /></button>
        </>
      )}
    </div>
  );
}

/** My Recent Case Studies: reading history, quiz builder, quiz runner, history. */
export function StudentStudies({
  records,
  history,
  onClearHistory,
  onRecordQuiz,
  onOpenJudgment,
}: {
  records: StudyRecord[];
  history: QuizAttempt[];
  onClearHistory: () => void;
  onRecordQuiz: (attempt: QuizAttempt) => void;
  onOpenJudgment: (judgmentId: string) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const studied = useMemo(
    () => records
      .map(r => ({ rec: r, j: JUDGMENT_BY_ID(r.judgmentId) }))
      .filter((x): x is { rec: StudyRecord; j: Judgment } => !!x.j)
      .sort((a, b) => b.rec.timesRead - a.rec.timesRead),
    [records],
  );

  const toggle = (id: string) => setSelected(prev => {
    const nextSet = new Set(prev);
    if (nextSet.has(id)) nextSet.delete(id); else nextSet.add(id);
    return nextSet;
  });

  const startQuiz = async () => {
    if (busy || !selected.size) return;
    setBusy(true); setError('');
    try {
      const judgments = [...selected].map(id => JUDGMENT_BY_ID(id)).filter((j): j is Judgment => !!j);
      const generated = await generateQuiz(judgments);
      setQuiz(generated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Quiz generation failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="heading">
        <div>
          <em>STUDY TRACKER</em>
          <h1>My recent case studies</h1>
          <p>Everything you have read, plus AI quizzes from the cases you pick. Select one or more cases and test the important points.</p>
        </div>
      </div>

      <div className="ss-grid">
        <section className="panel">
          <h3><GraduationCap /> Cases you have studied</h3>
          <p className="ss-sub">{studied.length ? 'Pick one or more, then generate a quiz.' : 'Open any case from the Case Library and it will appear here.'}</p>
          {studied.length === 0 && (
            <button className="ss-empty" onClick={() => onOpenJudgment(JUDGMENTS[0].id)}>
              <Sparkles /> Browse the Case Library <ChevronRight />
            </button>
          )}
          <div className="ss-list">
            {studied.map(({ rec, j }) => {
              const on = selected.has(j.id);
              const best = bestScore(history, [j.id]);
              return (
                <button key={j.id} className={'ss-row' + (on ? ' on' : '')} onClick={() => toggle(j.id)}>
                  <span className="ss-check">{on && <Check />}</span>
                  <div className="ss-body">
                    <b>{j.shortTitle}</b>
                    <small>{j.citation} · {j.year} · read {rec.timesRead}× · last {rec.readAt}</small>
                  </div>
                  {best && <span className="ss-best">★ {best.score}/{best.total}</span>}
                  <span className="ss-open" title="Open the case" onClick={e => { e.stopPropagation(); onOpenJudgment(j.id); }}><ChevronRight /></span>
                </button>
              );
            })}
          </div>

          <div className="ss-quizbar">
            <span>{selected.size} case{selected.size === 1 ? '' : 's'} selected</span>
            <button className="primary" disabled={!selected.size || busy} onClick={startQuiz}>
              <Sparkles /> {busy ? 'Setting your paper…' : 'Generate quiz'}
            </button>
          </div>
          {error && <p className="ai-error">{error}</p>}
        </section>

        <section className="panel">
          <h3><History /> Quiz history</h3>
          <p className="ss-sub">Your previous attempts with scores.</p>
          {history.length === 0 && <p className="ss-none">No attempts yet — your scores will be saved here.</p>}
          <div className="qz-hist">
            {history.map(a => (
              <div key={a.id} className="qz-hist-row">
                <b>{a.names.join(' + ').slice(0, 60)}{a.names.join(' + ').length > 60 ? '…' : ''}</b>
                <div className="qz-hist-meta">
                  <span className={'qz-score ' + (a.score / a.total >= 0.5 ? 'pass' : 'fail')}>{a.score}/{a.total}</span>
                  <small>{a.at}</small>
                </div>
              </div>
            ))}
          </div>
          {history.length > 0 && <button className="ss-clear" onClick={onClearHistory}><RefreshCw /> Clear history</button>}
        </section>
      </div>

      {quiz && (
        <div className="modal-veil" onClick={() => setQuiz(null)}>
          <div className="modal-card qz-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head"><h3><Trophy /> {quiz.title || 'Case quiz'}</h3><button type="button" className="modal-x" onClick={() => setQuiz(null)}><X /></button></div>
            <QuizRunner
              quiz={quiz}
              onDone={(score, total) => onRecordQuiz({
                id: uid(),
                basedOn: [...selected],
                names: [...selected].map(id => JUDGMENT_BY_ID(id)?.shortTitle ?? 'Case'),
                score,
                total,
                at: nowStr(),
              })}
            />
          </div>
        </div>
      )}
    </>
  );
}

function JUDGMENT_BY_ID(id: string): Judgment | undefined {
  return JUDGMENTS.find(j => j.id === id);
}
