export type PartOfSpeech = 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase';

export type Article = 'der' | 'die' | 'das';

/**
 * Noun forms shown in the answer-side forms panel (see WordForms.tsx). Stored
 * WITHOUT their article — German plurals always take "die"; genitive singular
 * takes "des" (der/das nouns) or "der" (die nouns) — so the display layer adds
 * the correct one (see FlashCards.utils.ts's GENITIVE_ARTICLE).
 *
 * Both fields are optional and independent: many nouns genuinely have no
 * plural (Fernweh) or an unremarkable genitive not worth calling out. Show
 * "no plural form" rather than a blank when one is missing — see WordForms.tsx.
 */
export interface NounForms {
  /** e.g. "Handschuhe" for der Handschuh, or "Eichhörnchen" (invariant) for das Eichhörnchen. */
  plural?: string;
  /** e.g. "Handschuhs"; weak nouns take -(e)n instead, e.g. "Jungen" for der Junge. */
  genitiveSingular?: string;
}

/**
 * One tense's six person-forms. Row LABELS ("ich", "du", …) are fixed and
 * rendered by WordForms.tsx; only the conjugated forms are data. For a
 * reflexive verb, bake the reflexive pronoun into each value directly (e.g.
 * `ich: 'erinnere mich'`) — there's no separate reflexive flag; a lemma
 * starting with "sich" (see Flashcard.german below) is the signal.
 */
export interface VerbPersonForms {
  ich: string;
  du: string;
  erSieEs: string;
  wir: string;
  ihr: string;
  sieSie: string;
}

/**
 * Verb forms shown in the answer-side forms panel. Präsens and Präteritum are
 * full 6-person tables (more useful for building fluency than the traditional
 * "principal parts" convention). Perfekt deliberately stays at 3rd-person
 * singular only — dictionaries and learners alike memorize verbs by
 * "gehen, ging, ist gegangen", not a full Perfekt table, and the auxiliary's
 * own conjugation (habe/hast/hat…) is assumed already known.
 */
export interface VerbForms {
  present: VerbPersonForms;
  preterite: VerbPersonForms;
  /**
   * 3rd-person-singular Perfekt: which auxiliary the verb takes, and the past
   * participle. For a reflexive verb, include "sich" in `participle` (e.g.
   * `{ auxiliary: 'hat', participle: 'sich erinnert' }` → "hat sich erinnert"),
   * since the reflexive pronoun doesn't inflect by person for a 3rd-person form.
   */
  perfect: { auxiliary: 'hat' | 'ist'; participle: string };
  /** Case/preposition the verb governs, shown as a note — e.g. "an + Akk.", "jdn. (Akk.)". Free text; not conjugated. */
  government?: string;
}

/** Adjective forms shown in the answer-side forms panel. Stored as complete display strings, not stems. */
export interface AdjectiveForms {
  /** e.g. "schöner". */
  comparative?: string;
  /** Full predicate form including "am … -en" — e.g. "am schönsten", not "schönst". */
  superlative?: string;
}

interface FlashcardBase {
  id: string;
  english: string;
  /**
   * The bare lemma — no article for nouns, "sich" prefix if the verb is
   * reflexive (e.g. "sich erinnern"), no example sentence or gloss. The
   * prompt side shows only this; everything else lives on the answer side.
   */
  german: string;
}

/** `article` is required — a noun card that doesn't know its gender is a data error, not an optional detail. */
export interface NounCard extends FlashcardBase {
  partOfSpeech: 'noun';
  article: Article;
  forms?: NounForms;
}

export interface VerbCard extends FlashcardBase {
  partOfSpeech: 'verb';
  forms?: VerbForms;
}

export interface AdjectiveCard extends FlashcardBase {
  partOfSpeech: 'adjective';
  forms?: AdjectiveForms;
}

/**
 * No forms yet by design (2026-09-24 decision: nouns/verbs/adjectives are the
 * first cut). Most adverbs don't inflect at all; the few that do (gern →
 * lieber → am liebsten) are a candidate follow-up, along with an example
 * sentence for every part of speech — see context-FlashCards.md §8.
 */
export interface AdverbCard extends FlashcardBase {
  partOfSpeech: 'adverb';
}

/** For anything that isn't a single conjugable/declinable word. No forms — an example sentence would serve this better (backlog). */
export interface PhraseCard extends FlashcardBase {
  partOfSpeech: 'phrase';
}

/**
 * One vocabulary card. A discriminated union on `partOfSpeech`: TypeScript
 * narrows `card.forms`' type (and requires/forbids `article`) once you check
 * `card.partOfSpeech`, so a noun's forms can never accidentally be typed as a
 * verb's. Narrow with a switch or `if`, not a raw `.article`/`.forms` access —
 * see getArticle/hasForms in FlashCards.utils.ts for the established pattern.
 */
export type Flashcard = NounCard | VerbCard | AdjectiveCard | AdverbCard | PhraseCard;

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
