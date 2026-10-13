import { describe, expect, it } from 'vitest';

import { emptyProgress, nextCardId, withCopiedCard, withSavedCard, withoutCard } from '../decks';
import type { DeckRecord } from '../decks';
import type { Flashcard } from '../FlashCards.types';

const word = (id: string, german: string): Flashcard => ({ id, german, english: german, partOfSpeech: 'phrase' });

const deckA = (): DeckRecord => ({
  id: 'a', name: 'A', wordBank: [word('c01', 'eins'), word('c02', 'zwei')],
  progress: { ...emptyProgress(), words: { c02: { box: 2, lapses: 0, dueAt: '2026-01-01T00:00:00.000Z', lastSessionId: 's' } } },
});
const deckB = (): DeckRecord => ({ id: 'b', name: 'B', wordBank: [], progress: emptyProgress() });

describe('manage helpers', () => {
  it('withSavedCard replaces in place, keeps progress, leaves other decks untouched', () => {
    const decks = [deckA(), deckB()];
    const next = withSavedCard(decks, 'a', word('c02', 'ZWEI'));
    expect(next[0].wordBank.map((c) => c.german)).toEqual(['eins', 'ZWEI']);
    expect(next[0].progress).toBe(decks[0].progress);
    expect(next[1]).toBe(decks[1]);
  });

  it('withSavedCard appends an unknown id', () => {
    const next = withSavedCard([deckA()], 'a', word(nextCardId(deckA()), 'drei'));
    expect(next[0].wordBank.map((c) => c.id)).toEqual(['c01', 'c02', 'c03']);
  });

  it('withoutCard removes the card and its progress entry', () => {
    const next = withoutCard([deckA()], 'a', 'c02');
    expect(next[0].wordBank.map((c) => c.id)).toEqual(['c01']);
    expect(next[0].progress.words).toEqual({});
  });

  it('withCopiedCard adds a fresh-id card without progress to the target only', () => {
    const next = withCopiedCard([deckA(), deckB()], 'a', 'c02', 'b');
    expect(next[1].wordBank).toEqual([word('c01', 'zwei')]);
    expect(next[1].progress.words).toEqual({});
    expect(next[0].wordBank).toHaveLength(2);
  });
});
