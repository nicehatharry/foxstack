import { useCallback, useRef, useState } from 'react';
import { ACTION_LOCKOUT_MS } from './FlashCards.constants';
import type { Flashcard, Grade } from './FlashCards.types';

export interface StudySession {
  currentCard: Flashcard | null;
  /** 1-based, clamped to total once the deck is finished. */
  position: number;
  total: number;
  isFlipped: boolean;
  isComplete: boolean;
  gotCount: number;
  missedCount: number;
  /** Flip to the answer side. One-way; no-op if already flipped. */
  reveal: () => void;
  /** Record a grade and advance. Only valid while the answer is showing. */
  grade: (g: Grade) => void;
  restart: () => void;
}

/**
 * Owns study-session state: which card is up, whether it's flipped, and the
 * grades so far. `results` is the single source of truth — the current index
 * is just `results.length`. In-memory only; this is the seam where deck
 * loading / result persistence (S3) will plug in.
 */
export function useStudySession(deck: Flashcard[]): StudySession {
  const [results, setResults] = useState<Grade[]>([]);
  const [isFlipped, setIsFlipped] = useState(false);
  const lastActionAt = useRef(0);

  const total = deck.length;
  const currentCard = deck[results.length] ?? null;
  const isComplete = total > 0 && results.length >= total;

  const isLockedOut = () => Date.now() - lastActionAt.current < ACTION_LOCKOUT_MS;

  const reveal = useCallback(() => {
    if (!currentCard || isFlipped || isLockedOut()) return;
    lastActionAt.current = Date.now();
    setIsFlipped(true);
  }, [currentCard, isFlipped]);

  const grade = useCallback((g: Grade) => {
    if (!currentCard || !isFlipped || isLockedOut()) return;
    lastActionAt.current = Date.now();
    setResults(prev => [...prev, g]);
    setIsFlipped(false);
  }, [currentCard, isFlipped]);

  const restart = useCallback(() => {
    lastActionAt.current = Date.now();
    setResults([]);
    setIsFlipped(false);
  }, []);

  const gotCount = results.filter(r => r === 'got').length;

  return {
    currentCard,
    position: Math.min(results.length + 1, total),
    total,
    isFlipped,
    isComplete,
    gotCount,
    missedCount: results.length - gotCount,
    reveal,
    grade,
    restart,
  };
}
