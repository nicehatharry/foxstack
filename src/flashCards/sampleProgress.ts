import type { ProgressDocument } from './FlashCards.types';

/**
 * Placeholder progress until an S3-backed loader exists (see
 * context-FlashCards.md). Deliberately mixes states against sampleDeck's
 * eleven cards so a session exercises every branch of buildSessionQueue: two
 * overdue reviews (c01, c02 — c02 a recent lapse sitting at box 1), two
 * reviews not yet due (c03; c11, the common-gender noun — see sampleDeck.ts),
 * one due right now (c04), and six untouched cards (c05–c10) that count as
 * "new". c11 not being due keeps it out of today's queue without disturbing
 * the pinned queue-order assertion in FlashCards.test.tsx.
 */
const DAY_MS = 24 * 60 * 60 * 1000;
const now = Date.now();
const daysAgo = (n: number) => new Date(now - n * DAY_MS).toISOString();
const daysFromNow = (n: number) => new Date(now + n * DAY_MS).toISOString();

export const sampleProgress: ProgressDocument = {
  meta: { successRate: 0.8, totalReviews: 42 },
  words: {
    c01: { box: 3, lapses: 0, dueAt: daysAgo(1), lastSessionId: 's_prev1' },
    c02: { box: 1, lapses: 2, dueAt: daysAgo(2), lastSessionId: 's_prev1' },
    c03: { box: 5, lapses: 1, dueAt: daysFromNow(12), lastSessionId: 's_prev2' },
    c04: { box: 2, lapses: 0, dueAt: daysAgo(0.1), lastSessionId: 's_prev2' },
    c11: { box: 4, lapses: 0, dueAt: daysFromNow(20), lastSessionId: 's_prev2' },
  },
};
