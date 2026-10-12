import { describe, it, expect } from 'vitest';
import { buildStudyAheadQueue, shuffle } from '../srs';
import type { Flashcard, ProgressMap } from '../FlashCards.types';

const card = (id: string): Flashcard => ({ id, german: id, english: id, partOfSpeech: 'phrase' });
const rec = (dueAt: string, lastSessionId = 's_prev') => ({ box: 2 as const, lapses: 0, dueAt, lastSessionId });
const seq = (...values: number[]) => { let i = 0; return () => values[i++ % values.length]; };

describe('shuffle', () => {
  it('returns a permutation and leaves the input untouched', () => {
    const input = ['a', 'b', 'c', 'd'];
    const out = shuffle(input);
    expect(input).toEqual(['a', 'b', 'c', 'd']);
    expect([...out].sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('is driven by the injected rng', () => {
    expect(shuffle(['a', 'b', 'c'], () => 0)).toEqual(['b', 'c', 'a']);
  });
});

describe('buildStudyAheadQueue', () => {
  const bank = ['a', 'b', 'c', 'd'].map(card);
  const progress: ProgressMap = {
    a: rec('2026-10-05T00:00:00.000Z'),
    b: rec('2026-10-01T00:00:00.000Z'),
    c: rec('2026-10-09T00:00:00.000Z'),
  };
  const ids = (q: Flashcard[]) => q.map(c => c.id).sort();

  it('takes unseen words first, then the soonest-due, up to the cap', () => {
    expect(ids(buildStudyAheadQueue(bank, progress, 's_new', 2))).toEqual(['b', 'd']);
    expect(ids(buildStudyAheadQueue(bank, progress, 's_new', 3))).toEqual(['a', 'b', 'd']);
  });

  it('ignores due dates entirely (everything here is in the future or past alike)', () => {
    expect(ids(buildStudyAheadQueue(bank, progress, 's_new', 25))).toEqual(['a', 'b', 'c', 'd']);
  });

  it('excludes words already graded under this session id', () => {
    const p: ProgressMap = { ...progress, b: rec('2026-10-01T00:00:00.000Z', 's_new') };
    expect(ids(buildStudyAheadQueue(bank, p, 's_new', 25))).toEqual(['a', 'c', 'd']);
  });

  it('shuffles the selection', () => {
    const q = buildStudyAheadQueue(bank, progress, 's_new', 25, seq(0));
    expect(q.map(c => c.id)).not.toEqual(['d', 'b', 'a', 'c']); // the unshuffled order
    expect(ids(q)).toEqual(['a', 'b', 'c', 'd']);
  });
});
