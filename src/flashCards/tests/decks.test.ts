import { describe, it, expect } from 'vitest';

import {
  cardId, draftToCard, createDeck, emptyProgress, withProgress, formatDeckMeta,
} from '../decks';
import type { CardDraft, DeckRecord } from '../decks';
import type { Flashcard, ProgressDocument } from '../FlashCards.types';

const noun = (german: string, english: string): CardDraft => ({
  german, english, partOfSpeech: 'noun', article: 'der',
});

const card = (id: string): Flashcard => ({
  id, german: id, english: id, partOfSpeech: 'phrase',
});

const progressWith = (...ids: string[]): ProgressDocument => {
  const base = emptyProgress();
  for (const id of ids) {
    base.words[id] = { box: 1, lapses: 0, dueAt: '2026-10-02T05:00:00.000Z', lastSessionId: 's_1' };
  }
  return base;
};

describe('cardId', () => {
  it('is 1-based and zero-padded to two digits', () => {
    expect(cardId(0)).toBe('c01');
    expect(cardId(8)).toBe('c09');
    expect(cardId(9)).toBe('c10');
    expect(cardId(99)).toBe('c100');
  });
});

describe('draftToCard', () => {
  it('trims text and keeps the article on a noun', () => {
    const c = draftToCard('c01', noun('  Hund ', ' dog  '));
    expect(c).toMatchObject({ id: 'c01', german: 'Hund', english: 'dog', partOfSpeech: 'noun', article: 'der' });
  });

  it('keeps a common-gender article', () => {
    const c = draftToCard('c01', { german: 'Angestellte', english: 'employee', partOfSpeech: 'noun', article: 'der/die' });
    expect(c.partOfSpeech === 'noun' && c.article).toBe('der/die');
  });

  it.each(['verb', 'adjective', 'adverb', 'phrase'] as const)('%s gets no article and no forms', (pos) => {
    const c = draftToCard('c02', { german: 'x', english: 'y', partOfSpeech: pos });
    expect(c.partOfSpeech).toBe(pos);
    expect('article' in c).toBe(false);
    expect('forms' in c).toBe(false);
  });
});

describe('createDeck', () => {
  it('trims the name, numbers cards in order and starts with empty progress', () => {
    const deck = createDeck('d_1', '  Animals ', [noun('Hund', 'dog'), noun('Katze', 'cat')]);
    expect(deck.id).toBe('d_1');
    expect(deck.name).toBe('Animals');
    expect(deck.wordBank.map((c) => [c.id, c.german])).toEqual([['c01', 'Hund'], ['c02', 'Katze']]);
    expect(deck.progress.words).toEqual({});
  });

  it('gives every deck its own progress object (no aliasing)', () => {
    const a = createDeck('a', 'A', [noun('x', 'y')]);
    const b = createDeck('b', 'B', [noun('x', 'y')]);
    expect(a.progress).not.toBe(b.progress);
    expect(a.progress.words).not.toBe(b.progress.words);
    expect(a.progress.meta).not.toBe(b.progress.meta);
  });
});

describe('withProgress', () => {
  const decks: DeckRecord[] = [
    { id: 'a', name: 'A', wordBank: [card('c01')], progress: emptyProgress() },
    { id: 'b', name: 'B', wordBank: [card('c01')], progress: emptyProgress() },
  ];

  it('replaces only the target deck and leaves the others untouched', () => {
    const next = progressWith('c01');
    const out = withProgress(decks, 'a', next);
    expect(out[0].progress).toBe(next);
    expect(out[1]).toBe(decks[1]);
  });

  it('does not mutate its input', () => {
    withProgress(decks, 'a', progressWith('c01'));
    expect(decks[0].progress.words).toEqual({});
  });

  it('is a no-op for an unknown deck id', () => {
    const out = withProgress(decks, 'zzz', progressWith('c01'));
    expect(out.map((d) => d.progress)).toEqual(decks.map((d) => d.progress));
  });
});

describe('formatDeckMeta', () => {
  it('counts started cards against the bank, plural', () => {
    const deck: DeckRecord = {
      id: 'a', name: 'A', wordBank: [card('c01'), card('c02'), card('c03')], progress: progressWith('c02'),
    };
    expect(formatDeckMeta(deck)).toBe('1 of 3 cards started');
  });

  it('uses the singular for a one-card deck', () => {
    const deck: DeckRecord = { id: 'a', name: 'A', wordBank: [card('c01')], progress: emptyProgress() };
    expect(formatDeckMeta(deck)).toBe('0 of 1 card started');
  });

  it('ignores progress ids that are not in the word bank', () => {
    const deck: DeckRecord = { id: 'a', name: 'A', wordBank: [card('c01')], progress: progressWith('gone', 'c01') };
    expect(formatDeckMeta(deck)).toBe('1 of 1 card started');
  });
});
