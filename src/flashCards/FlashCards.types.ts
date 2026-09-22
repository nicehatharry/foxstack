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
