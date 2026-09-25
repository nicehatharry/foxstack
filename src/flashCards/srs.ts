import {
  LEITNER_INTERVALS_DAYS,
  MAX_LEITNER_BOX,
  NEW_CARDS_WHEN_STRUGGLING,
  NEW_CARD_SUCCESS_RATE_HIGH,
  NEW_CARD_SUCCESS_RATE_MED,
  SUCCESS_RATE_SMOOTHING,
} from './FlashCards.constants';
import type {
  Flashcard, Grade, LeitnerBox, ProgressDocument, ProgressMap, SessionMeta, WordProgress,
} from './FlashCards.types';

/**
 * When a word graded at `from` becomes due again: local midnight, `days`
 * calendar days after `from`'s local day. So an interval of N means "the
 * morning N days from today", regardless of what time of day it was graded —
 * a card graded 08:05 yesterday is due at 08:00 today.
 *
 * Uses calendar arithmetic (`new Date(y, m, d + n)`), not `+ n * 24h`, so DST
 * transitions can't push the result to 23:00 or 01:00. The result is an
 * absolute instant (stored as ISO/UTC); "local" is the device's zone at grading
 * time. Pure.
 */
export function dueDateFor(from: Date, days: number): Date {
  return new Date(from.getFullYear(), from.getMonth(), from.getDate() + days);
}

/**
 * Leitner scheduling for one word. Pure — same inputs always produce the same
 * result, so this is unit-testable without touching React or S3.
 *
 * - Missed: always drops to box 1, regardless of the current box. This is
 *   what guarantees a missed card comes back sooner than one just recalled.
 * - Got it: moves up one box (capped at MAX_LEITNER_BOX). A word with no
 *   prior record (first time seeing it) starts at box 1 either way, which
 *   satisfies the "minimum: next session" rule for a first-time recall.
 * - `dueAt` is local midnight of the due day — see dueDateFor().
 */
export function scheduleNext(
  existing: WordProgress | undefined,
  grade: Grade,
  now: Date,
  sessionId: string,
): WordProgress {
  const lapses = existing?.lapses ?? 0;

  const box: LeitnerBox = grade === 'missed'
    ? 1
    : existing
      ? (Math.min(existing.box + 1, MAX_LEITNER_BOX) as LeitnerBox)
      : 1;

  return {
    box,
    lapses: grade === 'missed' ? lapses + 1 : lapses,
    dueAt: dueDateFor(now, LEITNER_INTERVALS_DAYS[box]).toISOString(),
    lastSessionId: sessionId,
  };
}

/**
 * Updates the rolling success rate after one grade. An exponential moving
 * average (not a full history) so it stays a single small number regardless
 * of deck size. The very first-ever grade sets the rate outright rather than
 * blending with the optimistic DEFAULT_SESSION_META seed.
 */
export function updateSuccessRate(meta: SessionMeta, grade: Grade): SessionMeta {
  const value = grade === 'got' ? 1 : 0;
  const successRate = meta.totalReviews === 0
    ? value
    : meta.successRate * (1 - SUCCESS_RATE_SMOOTHING) + value * SUCCESS_RATE_SMOOTHING;

  return { successRate, totalReviews: meta.totalReviews + 1 };
}

/**
 * Folds one grade into the progress document. Pure.
 *
 * Only a card's FIRST grade in a session counts. `lastSessionId` is the marker:
 * once it equals `sessionId`, later grades of that card in the same session
 * (the in-session requeue after a miss, or a "Study again" replay) return the
 * document untouched. Without this a card missed and then recalled on its
 * requeue jumped to box 2 — a longer interval than a card recalled first try —
 * and replays advanced boxes twice in one day. It also keeps retries out of
 * `successRate`/`totalReviews`, which are meant to measure first-exposure recall.
 */
export function applyGrade(
  doc: ProgressDocument,
  cardId: string,
  grade: Grade,
  now: Date,
  sessionId: string,
): ProgressDocument {
  const existing = doc.words[cardId];
  if (existing?.lastSessionId === sessionId) return doc;

  return {
    meta: updateSuccessRate(doc.meta, grade),
    words: { ...doc.words, [cardId]: scheduleNext(existing, grade, now, sessionId) },
  };
}

/** True if a word is eligible to appear in *this* session. */
export function isDue(progress: WordProgress | undefined, now: Date, sessionId: string): boolean {
  if (!progress) return false; // no record yet = "new", not "due"
  if (progress.lastSessionId === sessionId) return false; // already graded this session
  return new Date(progress.dueAt).getTime() <= now.getTime();
}

/**
 * How many of a session's remaining (post-review) slots to fill with new
 * words, based on the recent recall success rate. Struggling sessions hold
 * back new words so they don't compound on top of cards already being missed.
 */
export function computeNewCardBudget(remainingSlots: number, successRate: number): number {
  if (remainingSlots <= 0) return 0;
  if (successRate >= NEW_CARD_SUCCESS_RATE_HIGH) return remainingSlots;
  if (successRate >= NEW_CARD_SUCCESS_RATE_MED) return Math.floor(remainingSlots / 2);
  return Math.min(remainingSlots, NEW_CARDS_WHEN_STRUGGLING);
}

/**
 * Merges `toInsert` into `base` at roughly even spacing, rather than all at
 * the front or all at the back. Used to spread new words through the review
 * cards instead of front-loading (worst first impression) or back-loading
 * (fatigue) them. Pure, and generic so it isn't tied to Flashcard.
 *
 * Starts the first insertion at half a gap in, so with e.g. 4 reviews and 1
 * new card the new card lands near the middle rather than immediately first.
 */
export function interleaveEvenly<T>(base: T[], toInsert: T[]): T[] {
  if (toInsert.length === 0) return [...base];
  if (base.length === 0) return [...toInsert];

  const result: T[] = [];
  const gap = base.length / toInsert.length;
  let nextInsertAt = gap / 2;
  let insertIndex = 0;

  base.forEach((item, i) => {
    result.push(item);
    while (insertIndex < toInsert.length && i + 1 >= nextInsertAt) {
      result.push(toInsert[insertIndex]);
      insertIndex += 1;
      nextInsertAt += gap;
    }
  });
  while (insertIndex < toInsert.length) {
    result.push(toInsert[insertIndex]);
    insertIndex += 1;
  }

  return result;
}

/**
 * Builds one session's queue from the full word bank: due reviews (most
 * overdue first) up to the cap, then whatever slots remain filled with new
 * words per computeNewCardBudget(), interleaved evenly among the reviews.
 *
 * Reviews always take priority over new words — a lapsing card decaying
 * further costs more than a new word waiting one more day.
 */
export function buildSessionQueue(
  wordBank: Flashcard[],
  progress: ProgressMap,
  meta: SessionMeta,
  now: Date,
  sessionId: string,
  cap: number,
): Flashcard[] {
  const dueReviews = wordBank
    .filter(w => isDue(progress[w.id], now, sessionId))
    .sort((a, b) => new Date(progress[a.id].dueAt).getTime() - new Date(progress[b.id].dueAt).getTime());

  const newCandidates = wordBank.filter(w => !progress[w.id]);

  const reviewsTaken = dueReviews.slice(0, cap);
  const remainingSlots = cap - reviewsTaken.length;
  const newBudget = computeNewCardBudget(remainingSlots, meta.successRate);
  const newTaken = newCandidates.slice(0, newBudget);

  return interleaveEvenly(reviewsTaken, newTaken);
}
