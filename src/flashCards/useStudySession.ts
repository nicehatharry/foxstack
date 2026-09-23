import { useCallback, useRef, useState } from 'react';
import { ACTION_LOCKOUT_MS, MISSED_REQUEUE_GAP, SESSION_CARD_CAP } from './FlashCards.constants';
import { applyGrade, buildSessionQueue } from './srs';
import type { Flashcard, Grade, ProgressDocument } from './FlashCards.types';

export interface StudySession {
  currentCard: Flashcard | null;
  /** 1-based position within *this session's* queue (not the whole word bank). */
  position: number;
  /** Size of this session's queue: due reviews + new words, capped at SESSION_CARD_CAP. */
  total: number;
  isFlipped: boolean;
  isComplete: boolean;
  gotCount: number;
  missedCount: number;
  /** Flip to the answer side. One-way; no-op if already flipped. */
  reveal: () => void;
  /** Record a grade and advance. Only valid while the answer is showing. */
  grade: (g: Grade) => void;
  /**
   * Replays this session's initial queue for extra practice. Pure practice:
   * `progressDraft` is not affected (see applyGrade — only a card's first grade
   * per session schedules it).
   */
  restart: () => void;
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
export function useStudySession(wordBank: Flashcard[], initialProgress: ProgressDocument): StudySession {
  // Lazy initialisers: created once, not re-evaluated on every render.
  const [sessionId] = useState(() => `s_${Date.now()}`);
  const [startedAt] = useState(() => new Date());

  const [initialQueue] = useState<Flashcard[]>(() => buildSessionQueue(
    wordBank, initialProgress.words, initialProgress.meta, startedAt, sessionId, SESSION_CARD_CAP,
  ));
  const [liveQueue, setLiveQueue] = useState<Flashcard[]>(initialQueue);
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [progressDraft, setProgressDraft] = useState<ProgressDocument>(initialProgress);
  const [gotCount, setGotCount] = useState(0);
  const [missedCount, setMissedCount] = useState(0);
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

    if (g === 'got') setGotCount(c => c + 1);
    else setMissedCount(c => c + 1);

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

  const restart = useCallback(() => {
    lastActionAt.current = Date.now();
    setLiveQueue(initialQueue);
    setIndex(0);
    setIsFlipped(false);
    setGotCount(0);
    setMissedCount(0);
    // progressDraft is intentionally left alone: replayed cards already carry
    // this session's id, so applyGrade ignores their grades.
  }, [initialQueue]);

  return {
    currentCard,
    position: Math.min(index + 1, total),
    total,
    isFlipped,
    isComplete,
    gotCount,
    missedCount,
    reveal,
    grade,
    restart,
    progressDraft,
  };
}
