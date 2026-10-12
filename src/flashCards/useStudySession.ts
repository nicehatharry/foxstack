import { useCallback, useMemo, useRef, useState } from 'react';
import { ACTION_LOCKOUT_MS, MISSED_REQUEUE_GAP, SESSION_CARD_CAP } from './FlashCards.constants';
import { applyGrade, buildSessionQueue, buildStudyAheadQueue, shuffle } from './srs';
import type { CompletedSession, Flashcard, Grade, ProgressDocument } from './FlashCards.types';

export interface StudySession {
  currentCard: Flashcard | null;
  /** 1-based position within *this session's* queue (not the whole word bank). */
  position: number;
  /** Size of this session's queue: due reviews + new words, capped at SESSION_CARD_CAP. */
  total: number;
  isFlipped: boolean;
  isComplete: boolean;
  /** Cards missed at least once in the current run, in order of first miss, each once (a requeued card missed again isn't repeated). */
  missedCards: Flashcard[];
  /** Flip to the answer side. One-way; no-op if already flipped. */
  reveal: () => void;
  /** Record a grade and advance. Only valid while the answer is showing. */
  grade: (g: Grade) => void;
  /** The session now running (or just finished): its id and initial card ids. Stable until a new session starts. */
  currentSession: CompletedSession;
  /** True if `replaySession` has cards to run: the session just finished, or a previous session's cards still in the word bank. */
  canReplay: boolean;
  /**
   * "Study again": runs a session's cards again in a new random order, under
   * that session's id — pure practice. Source: this session if it just
   * finished, else the previous session handed in as `lastSession`.
   * No-op if `!canReplay`.
   */
  replaySession: () => void;
  /**
   * Starts a fresh session that ignores due dates (see buildStudyAheadQueue).
   * Graded as a normal session under a new id.
   */
  newSession: () => void;
  /**
   * Word progress + rolling success rate, updated on each card's first grade
   * of the session. This is what a caller would write back to `progress.json`
   * in S3 — this hook only holds it in memory.
   */
  progressDraft: ProgressDocument;
}

/**
 * Owns one study session: builds the due-reviews + new-words queue once at
 * mount (see srs.ts), tracks flip/grade state, and folds each grade into a
 * Leitner-scheduled progress draft. In-memory only; this is the seam where
 * S3 loading of `words.json`/`progress.json` and saving `progressDraft` back
 * will plug in.
 */
export function useStudySession(
  wordBank: Flashcard[],
  initialProgress: ProgressDocument,
  lastSession?: CompletedSession,
): StudySession {
  // Lazy initialisers: created once, not re-evaluated on every render.
  const [session, setSession] = useState<{ id: string; queue: Flashcard[] }>(() => {
    const now = new Date();
    const id = `s_${now.getTime()}`;
    return {
      id,
      queue: buildSessionQueue(
        wordBank, initialProgress.words, initialProgress.meta, now, id, SESSION_CARD_CAP,
      ),
    };
  });
  const { id: sessionId, queue: initialQueue } = session;
  // Read once at mount, like the rest of the inputs.
  const [replayCards] = useState<Flashcard[]>(() => {
    if (!lastSession) return [];
    const ids = new Set(lastSession.cardIds);
    return wordBank.filter(c => ids.has(c.id));
  });
  const [liveQueue, setLiveQueue] = useState<Flashcard[]>(initialQueue);
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [progressDraft, setProgressDraft] = useState<ProgressDocument>(initialProgress);
  const [missedCards, setMissedCards] = useState<Flashcard[]>([]);
  const lastActionAt = useRef(0);

  const total = liveQueue.length;
  const currentCard = liveQueue[index] ?? null;
  const isComplete = total > 0 && index >= total;

  // Stable identity (reads only a ref), so it can sit in hook deps honestly.
  const isLockedOut = useCallback(
    () => Date.now() - lastActionAt.current < ACTION_LOCKOUT_MS,
    [],
  );

  const reveal = useCallback(() => {
    if (!currentCard || isFlipped || isLockedOut()) return;
    lastActionAt.current = Date.now();
    setIsFlipped(true);
  }, [currentCard, isFlipped, isLockedOut]);

  const grade = useCallback((g: Grade) => {
    if (!currentCard || !isFlipped || isLockedOut()) return;
    lastActionAt.current = Date.now();

    // Scheduling is decided inside the updater from `prev`, so it can never
    // read a stale closure. `now` is captured outside to keep the updater pure.
    const now = new Date();
    setProgressDraft(prev => applyGrade(prev, currentCard.id, g, now, sessionId));

    if (g === 'missed') {
      setMissedCards(prev => (prev.some(c => c.id === currentCard.id) ? prev : [...prev, currentCard]));
    }

    setLiveQueue(prev => {
      if (g !== 'missed') return prev;
      // Reinsert a few cards later — far enough that it isn't back-to-back
      // repetition of the same card, close enough to still land this session.
      const insertAt = Math.min(index + 1 + MISSED_REQUEUE_GAP, prev.length);
      const next = [...prev];
      next.splice(insertAt, 0, currentCard);
      return next;
    });

    setIndex(i => i + 1);
    setIsFlipped(false);
  }, [currentCard, isFlipped, index, sessionId, isLockedOut]);

  const resetRun = useCallback((queue: Flashcard[]) => {
    lastActionAt.current = Date.now();
    setLiveQueue(queue);
    setIndex(0);
    setIsFlipped(false);
    setMissedCards([]);
  }, []);

  const replaySession = useCallback(() => {
    const cards = isComplete ? initialQueue : replayCards;
    const id = isComplete ? sessionId : lastSession?.sessionId;
    if (!id || cards.length === 0) return;
    // Reuse the old id: those cards already carry it, so applyGrade ignores their grades
    // and progressDraft stays untouched (pure practice).
    const queue = shuffle(cards);
    setSession({ id, queue });
    resetRun(queue);
  }, [isComplete, initialQueue, sessionId, lastSession, replayCards, resetRun]);

  const newSession = useCallback(() => {
    const now = new Date();
    const id = `s_${now.getTime()}`;
    const queue = buildStudyAheadQueue(wordBank, progressDraft.words, id, SESSION_CARD_CAP);
    setSession({ id, queue });
    resetRun(queue);
  }, [wordBank, progressDraft, resetRun]);

  const currentSession = useMemo<CompletedSession>(
    () => ({ sessionId, cardIds: initialQueue.map(c => c.id) }),
    [sessionId, initialQueue],
  );

  return {
    currentCard,
    position: Math.min(index + 1, total),
    total,
    isFlipped,
    isComplete,
    missedCards,
    reveal,
    grade,
    currentSession,
    canReplay: isComplete || replayCards.length > 0,
    replaySession,
    newSession,
    progressDraft,
  };
}
