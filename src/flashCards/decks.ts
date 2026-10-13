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
 * the quick-add forms has none and reads as "no forms yet" (the known gap in
 * context §8); the Manage words page (cardForm.ts / WordEditor.tsx) authors them.
 */
export type CardDraft = { german: string; english: string } & (
  | { partOfSpeech: 'noun'; article: NounArticle }
  | { partOfSpeech: Exclude<PartOfSpeech, 'noun'> }
);

/** "der Hund: dog" — one line describing a draft (shared by the create-deck and add-word forms). */
export const describeDraft = (draft: CardDraft): string =>
  `${draft.partOfSpeech === 'noun' ? `${draft.article} ` : ''}${draft.german.trim()}: ${draft.english.trim()}`;

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

/**
 * The first `cNN` free in BOTH the word bank and the progress map, so a card can
 * never inherit the SRS state of an orphaned progress entry (context §7).
 */
export function nextCardId(deck: DeckRecord): string {
  const used = new Set([...deck.wordBank.map((c) => c.id), ...Object.keys(deck.progress.words)]);
  let n = deck.wordBank.length;
  while (used.has(cardId(n))) n += 1;
  return cardId(n);
}

/**
 * Append one card to one deck; every other deck keeps its identity. The new id is
 * `nextCardId`. The new word has no progress record, so it is "new" from the next
 * session on.
 */
export function withCard(decks: DeckRecord[], deckId: string, draft: CardDraft): DeckRecord[] {
  return decks.map((deck) =>
    deck.id === deckId
      ? { ...deck, wordBank: [...deck.wordBank, draftToCard(nextCardId(deck), draft)] }
      : deck,
  );
}

/**
 * Upsert a complete card (with `forms`) by id: replaced in place if present,
 * appended otherwise (caller allocates new ids via `nextCardId`). Progress is
 * untouched, so an edited word keeps its SRS state.
 */
export function withSavedCard(decks: DeckRecord[], deckId: string, card: Flashcard): DeckRecord[] {
  return decks.map((deck) => {
    if (deck.id !== deckId) return deck;
    const exists = deck.wordBank.some((c) => c.id === card.id);
    return {
      ...deck,
      wordBank: exists
        ? deck.wordBank.map((c) => (c.id === card.id ? card : c))
        : [...deck.wordBank, card],
    };
  });
}

/** Remove a card and its progress entry (so the id is never inherited by a later card). */
export function withoutCard(decks: DeckRecord[], deckId: string, id: string): DeckRecord[] {
  return decks.map((deck) => {
    if (deck.id !== deckId) return deck;
    const words = { ...deck.progress.words };
    delete words[id];
    return {
      ...deck,
      wordBank: deck.wordBank.filter((c) => c.id !== id),
      progress: { ...deck.progress, words },
    };
  });
}

/** Copy a card into another deck under a fresh id there. No progress carried: it is a new word in the target. */
export function withCopiedCard(
  decks: DeckRecord[],
  fromDeckId: string,
  id: string,
  toDeckId: string,
): DeckRecord[] {
  const card = decks.find((d) => d.id === fromDeckId)?.wordBank.find((c) => c.id === id);
  const target = decks.find((d) => d.id === toDeckId);
  if (!card || !target) return decks;
  return withSavedCard(decks, toDeckId, { ...card, id: nextCardId(target) });
}

/** "4 of 9 cards started". Progress ids absent from the word bank are ignored (context §7). */
export function formatDeckMeta(deck: DeckRecord): string {
  const total = deck.wordBank.length;
  const started = deck.wordBank.filter((card) => deck.progress.words[card.id] !== undefined).length;
  return `${started} of ${total} ${total === 1 ? 'card' : 'cards'} started`;
}
