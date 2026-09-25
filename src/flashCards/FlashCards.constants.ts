import type { LeitnerBox, SessionMeta } from './FlashCards.types';

/**
 * Prompt-word font sizing, in px.
 *
 * German compounds are long (Geschwindigkeitsbegrenzung = 26 chars), so a
 * single fixed size either wastes the card on short words or overflows on
 * long ones. Tiers are tuned for Barlow Semi Condensed 700 inside the card's
 * inner width on a 393px-wide iPhone 15 (~313px). First tier whose maxLength
 * >= the word's effective length wins — see getWordFontSize().
 */
export const WORD_SIZE_TIERS: ReadonlyArray<{ maxLength: number; fontSize: number }> = [
  { maxLength: 7,        fontSize: 64 },
  { maxLength: 10,       fontSize: 52 },
  { maxLength: 13,       fontSize: 42 },
  { maxLength: 17,       fontSize: 34 },
  { maxLength: Infinity, fontSize: 28 },
];

/** Card flip duration (ms). styles/card.ts reads this so CSS and JS can't drift. */
export const FLIP_DURATION_MS = 500;

/**
 * After any reveal/grade, further reveal/grade taps are ignored for this long.
 * Stops a double-tap on "Show answer" from landing on "Got it"/"Missed it",
 * and a double-tap on "Got it" from revealing the next card.
 */
export const ACTION_LOCKOUT_MS = 350;

/**
 * Leitner box → calendar days until due again, once a word has been graded at
 * least once. "Due" means local midnight that many days after the grading day
 * (see dueDateFor in srs.ts), not N × 24 h after the grading instant. Box 1
 * satisfies the "minimum: next session" requirement; box 5 caps at the
 * "maximum: one month" requirement.
 */
export const LEITNER_INTERVALS_DAYS: Record<LeitnerBox, number> = {
  1: 1,
  2: 3,
  3: 7,
  4: 16,
  5: 30,
};

export const MAX_LEITNER_BOX: LeitnerBox = 5;

/** Total cards (due reviews + new) offered in a single study session. */
export const SESSION_CARD_CAP = 25;

/**
 * A missed card is reinserted this many cards later in the current session's
 * queue — far enough that it isn't rote back-to-back repetition, close enough
 * that it's still reinforced the same session.
 */
export const MISSED_REQUEUE_GAP = 4;

/** Weight given to the latest grade when updating the rolling success rate (see updateSuccessRate). */
export const SUCCESS_RATE_SMOOTHING = 0.2;

/**
 * Thresholds on the rolling success rate that decide how many of a session's
 * remaining (post-review) slots become new words, vs. holding back so a
 * struggling learner isn't handed more unfamiliar words. See
 * computeNewCardBudget() in srs.ts.
 */
export const NEW_CARD_SUCCESS_RATE_HIGH = 0.9; // >= this: fill every remaining slot
export const NEW_CARD_SUCCESS_RATE_MED = 0.7;  // >= this: half the remaining slots
export const NEW_CARDS_WHEN_STRUGGLING = 2;    // below MED: at most this many

/** Used before any progress.json exists yet (first-ever session for this learner). */
export const DEFAULT_SESSION_META: SessionMeta = { successRate: 1, totalReviews: 0 };
