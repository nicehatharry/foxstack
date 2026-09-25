export type PartOfSpeech = 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase';

export type Article = 'der' | 'die' | 'das';

/**
 * One vocabulary card.
 *
 * `german` is the bare lemma (no article) — the prompt side shows only this.
 * `article` is stored separately so the answer side can reveal it as part of
 * what the learner is testing (gender is the hard part of German nouns).
 */
export interface Flashcard {
  id: string;
  german: string;
  english: string;
  partOfSpeech: PartOfSpeech;
  article?: Article; // nouns only
}

/** How the learner rated a card after seeing the answer. */
export type Grade = 'got' | 'missed';

/** Background tone of the answer side: noun gender, or 'other' for non-nouns. */
export type AnswerTone = 'masculine' | 'feminine' | 'neuter' | 'other';

/**
 * Leitner box a word currently sits in. 1 is "just missed / brand new and
 * correct once"; 5 is the most-practiced. There's no box 0 — a word with no
 * entry in `ProgressMap` is "new" (never graded).
 */
export type LeitnerBox = 1 | 2 | 3 | 4 | 5;

/**
 * Persisted scheduling state for one word — the S3 `progress.json` record.
 * `dueAt` is an ISO timestamp of local midnight on the due day (see
 * dueDateFor in srs.ts); the word isn't eligible again until it has passed.
 * `lastSessionId` is the id of the session that last graded the word. It marks
 * "already graded this session": applyGrade ignores later grades of the same
 * card in that session (requeue retries, replays), and isDue excludes it if a
 * queue is ever rebuilt mid-session.
 */
export interface WordProgress {
  box: LeitnerBox;
  /** All-time count of misses, never reset. Not used for scheduling — kept for stats/leech-detection later. */
  lapses: number;
  dueAt: string;
  lastSessionId: string;
}

export type ProgressMap = Record<string, WordProgress>;

/**
 * Rolling recall-success rate, used only to decide how many new words to
 * introduce in a session (see srs.ts). An exponential moving average, not a
 * full history, so it's one small object regardless of deck size.
 */
export interface SessionMeta {
  /** 0–1. Weighted toward recent grades; see updateSuccessRate(). */
  successRate: number;
  totalReviews: number;
}

/** The full S3 `progress.json` shape: one meta block + one entry per studied word. */
export interface ProgressDocument {
  meta: SessionMeta;
  words: ProgressMap;
}
