import { describe, it, expect } from 'vitest';
import {
  applyGrade, buildSessionQueue, computeNewCardBudget, dueDateFor,
  interleaveEvenly, isDue, scheduleNext, updateSuccessRate,
} from '../srs';
import { LEITNER_INTERVALS_DAYS } from '../FlashCards.constants';
import type { Flashcard, ProgressDocument, ProgressMap, WordProgress } from '../FlashCards.types';

// All dates are built with the LOCAL-time constructor and asserted through local
// getters, so this file passes in any TZ. Run it under a DST zone too, e.g.
// `TZ=America/Chicago npx vitest run srs`, to exercise the DST case for real.

const card = (id: string): Flashcard => ({ id, german: id, english: id, partOfSpeech: 'verb' });
const wp = (over: Partial<WordProgress> = {}): WordProgress =>
  ({ box: 1, lapses: 0, dueAt: new Date(2026, 8, 1).toISOString(), lastSessionId: 's_old', ...over });
const emptyDoc: ProgressDocument = { meta: { successRate: 1, totalReviews: 0 }, words: {} };
const NOW = new Date(2026, 8, 23, 12, 0, 0); // 23 Sep 2026, local noon

describe('dueDateFor', () => {
  it('returns local midnight, N calendar days after the grading day', () => {
    const d = dueDateFor(new Date(2026, 8, 22, 8, 5), 3);
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 8, 25]);
    expect([d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()]).toEqual([0, 0, 0, 0]);
  });
  it('does not depend on the time of day it was graded', () => {
    const early = dueDateFor(new Date(2026, 8, 22, 0, 0, 1), 1).getTime();
    const late = dueDateFor(new Date(2026, 8, 22, 23, 59, 59), 1).getTime();
    expect(early).toBe(late);
  });
  it('rolls over month and year ends', () => {
    expect(dueDateFor(new Date(2026, 0, 31, 10), 1).getDate()).toBe(1);
    expect(dueDateFor(new Date(2026, 0, 31, 10), 1).getMonth()).toBe(1);
    expect(dueDateFor(new Date(2026, 11, 20, 10), 30).getFullYear()).toBe(2027);
  });
  it('stays on local midnight across a DST change (US fall-back is 1 Nov 2026)', () => {
    // Nov 1 2026 is 25 h long in US zones; naive "+ 24 h" would land at 23:00 on Nov 1.
    const d = dueDateFor(new Date(2026, 10, 1, 9, 0), 1);
    expect([d.getMonth(), d.getDate(), d.getHours()]).toEqual([10, 2, 0]);
    // and spring-forward (8 Mar 2026, 23 h long)
    const e = dueDateFor(new Date(2026, 2, 8, 9, 0), 1);
    expect([e.getMonth(), e.getDate(), e.getHours()]).toEqual([2, 9, 0]);
  });
  it('does not mutate its input', () => {
    const from = new Date(2026, 8, 22, 8, 5);
    const t = from.getTime();
    dueDateFor(from, 5);
    expect(from.getTime()).toBe(t);
  });
});

describe('scheduleNext', () => {
  it('first-ever grade lands in box 1 whether got or missed', () => {
    expect(scheduleNext(undefined, 'got', NOW, 's').box).toBe(1);
    expect(scheduleNext(undefined, 'missed', NOW, 's').box).toBe(1);
  });
  it('counts a lapse only on a miss', () => {
    expect(scheduleNext(undefined, 'got', NOW, 's').lapses).toBe(0);
    expect(scheduleNext(undefined, 'missed', NOW, 's').lapses).toBe(1);
    expect(scheduleNext(wp({ box: 3, lapses: 4 }), 'missed', NOW, 's').lapses).toBe(5);
    expect(scheduleNext(wp({ box: 3, lapses: 4 }), 'got', NOW, 's').lapses).toBe(4);
  });
  it('got climbs one box at a time and caps at 5', () => {
    expect(scheduleNext(wp({ box: 1 }), 'got', NOW, 's').box).toBe(2);
    expect(scheduleNext(wp({ box: 4 }), 'got', NOW, 's').box).toBe(5);
    expect(scheduleNext(wp({ box: 5 }), 'got', NOW, 's').box).toBe(5);
  });
  it('a miss drops to box 1 from any box', () => {
    for (const box of [1, 2, 3, 4, 5] as const) {
      expect(scheduleNext(wp({ box }), 'missed', NOW, 's').box).toBe(1);
    }
  });
  it('dueAt = local midnight, LEITNER_INTERVALS_DAYS[new box] days ahead', () => {
    for (const box of [1, 2, 3, 4, 5] as const) {
      const out = scheduleNext(wp({ box }), 'got', NOW, 's');
      expect(out.dueAt).toBe(dueDateFor(NOW, LEITNER_INTERVALS_DAYS[out.box]).toISOString());
    }
    const missed = scheduleNext(wp({ box: 4 }), 'missed', NOW, 's');
    expect(missed.dueAt).toBe(dueDateFor(NOW, LEITNER_INTERVALS_DAYS[1]).toISOString());
  });
  it('records the session id and does not mutate the existing record', () => {
    const existing = wp({ box: 2 });
    const before = JSON.stringify(existing);
    const out = scheduleNext(existing, 'got', NOW, 's_now');
    expect(out.lastSessionId).toBe('s_now');
    expect(JSON.stringify(existing)).toBe(before);
  });
  it('regression: graded 08:05 yesterday is due at 08:00 today (was exact-24h)', () => {
    const p = scheduleNext(undefined, 'got', new Date(2026, 8, 22, 8, 5), 's_A');
    expect(isDue(p, new Date(2026, 8, 23, 8, 0), 's_B')).toBe(true);
  });
  it('a card graded today is not due again today, even 1 second before midnight', () => {
    const p = scheduleNext(undefined, 'got', new Date(2026, 8, 22, 8, 5), 's_A');
    expect(isDue(p, new Date(2026, 8, 22, 23, 59, 59), 's_B')).toBe(false);
  });
});

describe('updateSuccessRate', () => {
  it('the first-ever review sets the rate outright (0 or 1), ignoring the optimistic seed', () => {
    expect(updateSuccessRate(emptyDoc.meta, 'missed')).toEqual({ successRate: 0, totalReviews: 1 });
    expect(updateSuccessRate(emptyDoc.meta, 'got')).toEqual({ successRate: 1, totalReviews: 1 });
  });
  it('afterwards blends with the 0.2 smoothing weight', () => {
    const m = updateSuccessRate({ successRate: 0.5, totalReviews: 10 }, 'got');
    expect(m.successRate).toBeCloseTo(0.6);
    expect(m.totalReviews).toBe(11);
    expect(updateSuccessRate({ successRate: 0.5, totalReviews: 10 }, 'missed').successRate).toBeCloseTo(0.4);
  });
  it('recovers from 0 to >= 0.7 after six consecutive gots (not five)', () => {
    let m = updateSuccessRate(emptyDoc.meta, 'missed');
    for (let i = 0; i < 5; i++) m = updateSuccessRate(m, 'got');
    expect(m.successRate).toBeLessThan(0.7);
    m = updateSuccessRate(m, 'got');
    expect(m.successRate).toBeGreaterThanOrEqual(0.7);
  });
  it('does not mutate its input', () => {
    const meta = { successRate: 0.5, totalReviews: 10 };
    updateSuccessRate(meta, 'got');
    expect(meta).toEqual({ successRate: 0.5, totalReviews: 10 });
  });
});

describe('applyGrade', () => {
  it('first grade schedules the word and updates meta; input is not mutated', () => {
    const before = JSON.stringify(emptyDoc);
    const out = applyGrade(emptyDoc, 'a', 'got', NOW, 's1');
    expect(out.words.a).toMatchObject({ box: 1, lapses: 0, lastSessionId: 's1' });
    expect(out.meta).toEqual({ successRate: 1, totalReviews: 1 });
    expect(JSON.stringify(emptyDoc)).toBe(before);
  });
  it('a second grade of the same card in the same session returns the SAME object', () => {
    const once = applyGrade(emptyDoc, 'a', 'missed', NOW, 's1');
    expect(applyGrade(once, 'a', 'got', NOW, 's1')).toBe(once);
  });
  it('a different card in the same session is still graded', () => {
    const once = applyGrade(emptyDoc, 'a', 'got', NOW, 's1');
    const twice = applyGrade(once, 'b', 'got', NOW, 's1');
    expect(Object.keys(twice.words)).toEqual(['a', 'b']);
    expect(twice.meta.totalReviews).toBe(2);
  });
  it('the same card in a later session advances normally', () => {
    const once = applyGrade(emptyDoc, 'a', 'got', NOW, 's1');
    expect(applyGrade(once, 'a', 'got', NOW, 's2').words.a.box).toBe(2);
  });
  it('miss on the first grade is not undone by a got retry (stays box 1, 1 lapse)', () => {
    const once = applyGrade(emptyDoc, 'a', 'missed', NOW, 's1');
    const retry = applyGrade(once, 'a', 'got', NOW, 's1');
    expect(retry.words.a).toMatchObject({ box: 1, lapses: 1 });
  });
});

describe('isDue', () => {
  const dueAt = new Date(2026, 8, 23, 0, 0, 0);
  it('no record => not due (it is "new")', () => {
    expect(isDue(undefined, NOW, 's')).toBe(false);
  });
  it('past and exactly-now are due; future is not', () => {
    expect(isDue(wp({ dueAt: dueAt.toISOString() }), NOW, 's')).toBe(true);
    expect(isDue(wp({ dueAt: NOW.toISOString() }), NOW, 's')).toBe(true);
    expect(isDue(wp({ dueAt: new Date(NOW.getTime() + 1).toISOString() }), NOW, 's')).toBe(false);
  });
  it('excluded when already graded in the given session, included for any other', () => {
    const p = wp({ dueAt: dueAt.toISOString(), lastSessionId: 's_A' });
    expect(isDue(p, NOW, 's_A')).toBe(false);
    expect(isDue(p, NOW, 's_B')).toBe(true);
  });
  it.todo('word with an unparseable dueAt should be surfaced/rejected at the loader boundary, not silently orphaned');
});

describe('computeNewCardBudget', () => {
  it('gives every remaining slot at >= 0.9', () => {
    expect(computeNewCardBudget(10, 0.9)).toBe(10);
    expect(computeNewCardBudget(10, 1)).toBe(10);
  });
  it('gives half (floored) from 0.7 up to 0.9', () => {
    expect(computeNewCardBudget(10, 0.7)).toBe(5);
    expect(computeNewCardBudget(11, 0.89)).toBe(5);
  });
  it('caps at 2 below 0.7, and never exceeds the remaining slots', () => {
    expect(computeNewCardBudget(10, 0.69)).toBe(2);
    expect(computeNewCardBudget(1, 0)).toBe(1);
  });
  it('is 0 when there are no slots', () => {
    expect(computeNewCardBudget(0, 1)).toBe(0);
    expect(computeNewCardBudget(-3, 1)).toBe(0);
  });
});

describe('interleaveEvenly', () => {
  it('spreads inserts through the base, starting half a gap in', () => {
    expect(interleaveEvenly(['a', 'b', 'c', 'd'], ['N'])).toEqual(['a', 'b', 'N', 'c', 'd']);
    expect(interleaveEvenly(['a', 'b', 'c', 'd'], ['N', 'M'])).toEqual(['a', 'N', 'b', 'c', 'M', 'd']);
  });
  it('handles empty sides', () => {
    expect(interleaveEvenly([], ['N'])).toEqual(['N']);
    expect(interleaveEvenly(['a'], [])).toEqual(['a']);
    expect(interleaveEvenly([], [])).toEqual([]);
  });
  it('more inserts than base items: base first, inserts follow in runs', () => {
    expect(interleaveEvenly(['a'], ['N', 'M', 'O'])).toEqual(['a', 'N', 'M', 'O']);
  });
  it('keeps every item exactly once, each side in its original order', () => {
    const base = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    const ins = ['1', '2', '3'];
    const out = interleaveEvenly(base, ins);
    expect(out).toHaveLength(10);
    expect(out.filter(x => base.includes(x))).toEqual(base);
    expect(out.filter(x => ins.includes(x))).toEqual(ins);
  });
  it('does not mutate its inputs and returns a new array', () => {
    const base = ['a', 'b'];
    const out = interleaveEvenly(base, []);
    expect(out).not.toBe(base);
    expect(base).toEqual(['a', 'b']);
  });
});

describe('buildSessionQueue', () => {
  const day = (offset: number, h = 0) => new Date(2026, 8, 23 + offset, h).toISOString();
  const meta = { successRate: 1, totalReviews: 50 };
  const ids = (q: Flashcard[]) => q.map(c => c.id);

  it('returns due reviews most-overdue first, and excludes not-yet-due words', () => {
    const bank = ['a', 'b', 'c', 'd'].map(card);
    const progress: ProgressMap = {
      a: wp({ dueAt: day(-1) }),
      b: wp({ dueAt: day(-5) }),
      c: wp({ dueAt: day(+3) }),   // not due
      d: wp({ dueAt: day(-2) }),
    };
    expect(ids(buildSessionQueue(bank, progress, meta, NOW, 's', 25))).toEqual(['b', 'd', 'a']);
  });
  it('excludes words already graded in this session id', () => {
    const bank = [card('a'), card('b')];
    const progress: ProgressMap = { a: wp({ dueAt: day(-1), lastSessionId: 's_me' }), b: wp({ dueAt: day(-1) }) };
    expect(ids(buildSessionQueue(bank, progress, meta, NOW, 's_me', 25))).toEqual(['b']);
  });
  it('adds new words (no record) in word-bank order', () => {
    const bank = ['a', 'b', 'c'].map(card);
    expect(ids(buildSessionQueue(bank, {}, meta, NOW, 's', 25))).toEqual(['a', 'b', 'c']);
  });
  it('reviews take priority: over the cap there are no new words at all', () => {
    const bank = ['r1', 'r2', 'r3', 'n1'].map(card);
    const progress: ProgressMap = { r1: wp({ dueAt: day(-3) }), r2: wp({ dueAt: day(-2) }), r3: wp({ dueAt: day(-1) }) };
    expect(ids(buildSessionQueue(bank, progress, meta, NOW, 's', 3))).toEqual(['r1', 'r2', 'r3']);
  });
  it('never exceeds the cap', () => {
    const bank = Array.from({ length: 40 }, (_, i) => card(`c${i}`));
    expect(buildSessionQueue(bank, {}, meta, NOW, 's', 25)).toHaveLength(25);
  });
  it('scales the new-word count by success rate', () => {
    const bank = Array.from({ length: 20 }, (_, i) => card(`n${i}`));
    const len = (rate: number) =>
      buildSessionQueue(bank, {}, { successRate: rate, totalReviews: 50 }, NOW, 's', 10).length;
    expect(len(0.95)).toBe(10);
    expect(len(0.8)).toBe(5);
    expect(len(0.3)).toBe(2);
  });
  it('interleaves new words among reviews', () => {
    const bank = ['r1', 'r2', 'r3', 'r4', 'n1'].map(card);
    const progress: ProgressMap = {
      r1: wp({ dueAt: day(-4) }), r2: wp({ dueAt: day(-3) }), r3: wp({ dueAt: day(-2) }), r4: wp({ dueAt: day(-1) }),
    };
    expect(ids(buildSessionQueue(bank, progress, meta, NOW, 's', 25))).toEqual(['r1', 'r2', 'n1', 'r3', 'r4']);
  });
  it('ignores progress entries for words no longer in the bank; empty bank => empty queue', () => {
    expect(buildSessionQueue([], { ghost: wp({ dueAt: day(-1) }) }, meta, NOW, 's', 25)).toEqual([]);
    expect(ids(buildSessionQueue([card('a')], { ghost: wp({ dueAt: day(-1) }) }, meta, NOW, 's', 25))).toEqual(['a']);
  });
  it('returns [] when nothing is due and the budget/candidates are exhausted', () => {
    const bank = [card('a')];
    const progress: ProgressMap = { a: wp({ dueAt: day(+2) }) };
    expect(buildSessionQueue(bank, progress, meta, NOW, 's', 25)).toEqual([]);
  });
});
