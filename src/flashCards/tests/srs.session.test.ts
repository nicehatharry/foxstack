import { describe, it, expect } from 'vitest';
import { buildStudyAheadQueue, formatDueDay, nextDueAt, shuffle } from '../srs';
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

describe('nextDueAt', () => {
  const bank = ['a', 'b', 'c'].map(card);
  const now = new Date(2026, 9, 17, 12);
  const at = (d: number) => new Date(2026, 9, d).toISOString();

  it('returns the soonest due moment after now', () => {
    const progress: ProgressMap = { a: rec(at(25)), b: rec(at(20)), c: rec(at(30)) };
    expect(nextDueAt(bank, progress, now)).toEqual(new Date(2026, 9, 20));
  });
  it('ignores words already due or past, and words with no record', () => {
    const progress: ProgressMap = { a: rec(at(10)), b: rec(at(22)) }; // c unseen
    expect(nextDueAt(bank, progress, now)).toEqual(new Date(2026, 9, 22));
  });
  it('ignores progress for words that are not in the bank', () => {
    expect(nextDueAt([card('a')], { a: rec(at(28)), z: rec(at(19)) }, now)).toEqual(new Date(2026, 9, 28));
  });
  it('null when nothing is upcoming', () => {
    expect(nextDueAt(bank, { a: rec(at(10)) }, now)).toBeNull();
    expect(nextDueAt(bank, {}, now)).toBeNull();
  });
});

describe('formatDueDay', () => {
  it('weekday, month, ordinal day', () => {
    expect(formatDueDay(new Date(2026, 9, 20))).toBe('Tuesday, October 20th');
    expect(formatDueDay(new Date(2026, 8, 30))).toBe('Wednesday, September 30th');
  });
  it('ordinal suffixes, including the 11–13 exceptions', () => {
    const d = (n: number) => formatDueDay(new Date(2026, 9, n)).split(' ').pop();
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 31].map(d))
      .toEqual(['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '23rd', '31st']);
  });
});
