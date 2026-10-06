import { DEFAULT_SESSION_META } from './FlashCards.constants';
import type { Flashcard, NounArticle, PartOfSpeech, ProgressDocument } from './FlashCards.types';

/**
 * A deck is a word bank plus its OWN progress document. Progress is never
 * shared between decks: each deck's SRS state (boxes, due dates, success-rate
 * meta) evolves independently, so a hard deck can't throttle new words in an
 * easy one.
 */
export interface DeckRecord {
  id: string;
  name: string;
  wordBank: Flashcard[];
  progress: ProgressDocument;
}

/**
 * What the create-deck form collects for one card. Deliberately minimal: no
 * `forms`. Forms are authored, reviewed strings (context §2), so a card made in
 * the app has none and reads as "no forms yet" (the known gap in context §8).
 */
export type CardDraft = { german: string; english: string } & (
  | { partOfSpeech: 'noun'; article: NounArticle }
  | { partOfSpeech: Exclude<PartOfSpeech, 'noun'> }
);

export const PART_OF_SPEECH_OPTIONS: readonly { value: PartOfSpeech; label: string }[] = [
  { value: 'noun', label: 'Noun' },
  { value: 'verb', label: 'Verb' },
  { value: 'adjective', label: 'Adjective' },
  { value: 'adverb', label: 'Adverb' },
  { value: 'phrase', label: 'Phrase' },
];

/** `der/die` = a noun that takes the gender of the person it refers to (context §6). */
export const ARTICLE_OPTIONS: readonly NounArticle[] = ['der', 'die', 'das', 'der/die'];

/** Synthetic per-deck card id, matching the `c01` style of words.json (context §7). */
export const cardId = (index: number): string => `c${String(index + 1).padStart(2, '0')}`;

/** A fresh progress document. New object every call: decks must never alias one. */
export const emptyProgress = (): ProgressDocument => ({
  meta: { ...DEFAULT_SESSION_META },
  words: {},
});

export function draftToCard(id: string, draft: CardDraft): Flashcard {
  const base = { id, german: draft.german.trim(), english: draft.english.trim() };
  switch (draft.partOfSpeech) {
    case 'noun':
      return { ...base, partOfSpeech: 'noun', article: draft.article };
    case 'verb':
      return { ...base, partOfSpeech: 'verb' };
    case 'adjective':
      return { ...base, partOfSpeech: 'adjective' };
    case 'adverb':
      return { ...base, partOfSpeech: 'adverb' };
    case 'phrase':
      return { ...base, partOfSpeech: 'phrase' };
  }
}

/** Pure: the caller supplies the id (no clock/randomness in here — context §2). */
export function createDeck(id: string, name: string, drafts: CardDraft[]): DeckRecord {
  return {
    id,
    name: name.trim(),
    wordBank: drafts.map((draft, i) => draftToCard(cardId(i), draft)),
    progress: emptyProgress(),
  };
}

/** Replace one deck's progress; every other deck keeps its identity untouched. */
export function withProgress(
  decks: DeckRecord[],
  deckId: string,
  progress: ProgressDocument,
): DeckRecord[] {
  return decks.map((deck) => (deck.id === deckId ? { ...deck, progress } : deck));
}

/** "4 of 9 cards started". Progress ids absent from the word bank are ignored (context §7). */
export function formatDeckMeta(deck: DeckRecord): string {
  const total = deck.wordBank.length;
  const started = deck.wordBank.filter((card) => deck.progress.words[card.id] !== undefined).length;
  return `${started} of ${total} ${total === 1 ? 'card' : 'cards'} started`;
}
