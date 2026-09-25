// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useStudySession } from '../useStudySession';
import { ACTION_LOCKOUT_MS, MISSED_REQUEUE_GAP } from '../FlashCards.constants';
import type { Flashcard, Grade, ProgressDocument } from '../FlashCards.types';

const card = (id: string): Flashcard => ({ id, german: id, english: id, partOfSpeech: 'verb' });
const cards = (...ids: string[]) => ids.map(card);
const fresh: ProgressDocument = { meta: { successRate: 1, totalReviews: 0 }, words: {} };

type Hook = { current: ReturnType<typeof useStudySession> };

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 8, 23, 12, 0, 0));
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

// Every action first waits out the double-tap lockout, like a real (non-double-tapping) user.
const wait = () => act(() => { vi.advanceTimersByTime(ACTION_LOCKOUT_MS + 50); });
const reveal = (r: Hook) => { wait(); act(() => r.current.reveal()); };
const grade = (r: Hook, g: Grade) => { wait(); act(() => r.current.grade(g)); };
const revealAndGrade = (r: Hook, g: Grade) => { reveal(r); grade(r, g); };
const setup = (bank: Flashcard[], progress = fresh) => renderHook(() => useStudySession(bank, progress)).result;

describe('initial state', () => {
  it('starts on the first card, un-flipped, not complete', () => {
    const r = setup(cards('a', 'b', 'c'));
    expect(r.current).toMatchObject({
      position: 1, total: 3, isFlipped: false, isComplete: false, gotCount: 0, missedCount: 0,
    });
    expect(r.current.currentCard?.id).toBe('a');
  });
  it('empty queue: no card, total 0, and NOT complete (the page shows an empty state instead)', () => {
    const r = setup([]);
    expect(r.current.currentCard).toBeNull();
    expect(r.current.total).toBe(0);
    expect(r.current.isComplete).toBe(false);
  });
  it('reads its inputs once: a later, different word bank is ignored', () => {
    const { result, rerender } = renderHook(({ bank }) => useStudySession(bank, fresh), {
      initialProps: { bank: cards('a', 'b') },
    });
    rerender({ bank: cards('x', 'y', 'z') });
    expect(result.current.total).toBe(2);
    expect(result.current.currentCard?.id).toBe('a');
  });
});

describe('reveal', () => {
  it('flips the card', () => {
    const r = setup(cards('a'));
    reveal(r);
    expect(r.current.isFlipped).toBe(true);
  });
  it('is one-way: revealing again is a no-op', () => {
    const r = setup(cards('a'));
    reveal(r); reveal(r);
    expect(r.current.isFlipped).toBe(true);
  });
});

describe('grade', () => {
  it('is ignored before the answer is revealed', () => {
    const r = setup(cards('a', 'b'));
    grade(r, 'got');
    expect(r.current.currentCard?.id).toBe('a');
    expect(r.current.gotCount).toBe(0);
    expect(r.current.progressDraft.words.a).toBeUndefined();
  });
  it('got: advances, un-flips, bumps gotCount, schedules the word', () => {
    const r = setup(cards('a', 'b'));
    revealAndGrade(r, 'got');
    expect(r.current.currentCard?.id).toBe('b');
    expect(r.current.position).toBe(2);
    expect(r.current.isFlipped).toBe(false);
    expect(r.current.gotCount).toBe(1);
    expect(r.current.progressDraft.words.a).toMatchObject({ box: 1, lapses: 0 });
    expect(r.current.progressDraft.meta.totalReviews).toBe(1);
  });
  it('missed: bumps missedCount and records a lapse', () => {
    const r = setup(cards('a', 'b'));
    revealAndGrade(r, 'missed');
    expect(r.current.missedCount).toBe(1);
    expect(r.current.progressDraft.words.a).toMatchObject({ box: 1, lapses: 1 });
  });
  it('completes after the last card is got', () => {
    const r = setup(cards('a'));
    revealAndGrade(r, 'got');
    expect(r.current.isComplete).toBe(true);
    expect(r.current.currentCard).toBeNull();
    expect(r.current.position).toBe(1); // clamped, never "2 of 1"
  });
  it('stamps every graded word with one and the same session id', () => {
    const r = setup(cards('a', 'b', 'c'));
    for (let i = 0; i < 3; i++) revealAndGrade(r, 'got');
    const sessionIds = new Set(Object.values(r.current.progressDraft.words).map(w => w.lastSessionId));
    expect(sessionIds.size).toBe(1);
  });
});

describe('double-tap lockout', () => {
  it('grade within the lockout window after a reveal is ignored', () => {
    const r = setup(cards('a'));
    reveal(r);
    act(() => { vi.advanceTimersByTime(ACTION_LOCKOUT_MS - 100); r.current.grade('got'); });
    expect(r.current.currentCard?.id).toBe('a');
    expect(r.current.progressDraft.words.a).toBeUndefined();
  });
  it('reveal within the lockout window after a grade is ignored', () => {
    const r = setup(cards('a', 'b'));
    revealAndGrade(r, 'got');
    act(() => { vi.advanceTimersByTime(ACTION_LOCKOUT_MS - 100); r.current.reveal(); });
    expect(r.current.isFlipped).toBe(false);
  });
  it('actions work again once the window has passed', () => {
    const r = setup(cards('a', 'b'));
    revealAndGrade(r, 'got');
    reveal(r);
    expect(r.current.isFlipped).toBe(true);
  });
});

describe('missed-card requeue', () => {
  it(`brings a missed card back ${MISSED_REQUEUE_GAP} cards later`, () => {
    const r = setup(cards('a', 'b', 'c', 'd', 'e', 'f', 'g'));
    revealAndGrade(r, 'missed');
    const order: string[] = [];
    for (let i = 0; i < MISSED_REQUEUE_GAP + 1; i++) { order.push(r.current.currentCard!.id); revealAndGrade(r, 'got'); }
    expect(order).toEqual(['b', 'c', 'd', 'e', 'a']);
  });
  it('total grows by one per requeue', () => {
    const r = setup(cards('a', 'b', 'c'));
    revealAndGrade(r, 'missed');
    expect(r.current.total).toBe(4);
  });
  it('near the end of the queue the card goes last', () => {
    const r = setup(cards('a', 'b', 'c'));
    revealAndGrade(r, 'missed');            // a -> end
    revealAndGrade(r, 'got');               // b
    revealAndGrade(r, 'got');               // c
    expect(r.current.currentCard?.id).toBe('a');
  });
  it('a missed LAST/only card comes straight back', () => {
    const r = setup(cards('a'));
    revealAndGrade(r, 'missed');
    expect(r.current.currentCard?.id).toBe('a');
    expect(r.current.isFlipped).toBe(false);
    expect(r.current.isComplete).toBe(false);
  });
  it('a session cannot finish while a card keeps being missed', () => {
    const r = setup(cards('a'));
    for (let i = 0; i < 4; i++) revealAndGrade(r, 'missed');
    expect(r.current.isComplete).toBe(false);
    revealAndGrade(r, 'got');
    expect(r.current.isComplete).toBe(true);
  });
});

describe('first grade per session decides scheduling', () => {
  it('miss then got on the retry: box 1, one lapse, no better than a clean got', () => {
    const r = setup(cards('a', 'b'));
    revealAndGrade(r, 'missed'); // a
    revealAndGrade(r, 'got');    // b
    revealAndGrade(r, 'got');    // a retry
    const w = r.current.progressDraft.words;
    expect(w.a).toMatchObject({ box: 1, lapses: 1 });
    expect(w.b.box).toBe(1);
    expect(w.a.dueAt).toBe(w.b.dueAt);
  });
  it('retries do not count toward totalReviews / successRate', () => {
    const r = setup(cards('a'));
    revealAndGrade(r, 'missed');
    revealAndGrade(r, 'got');
    expect(r.current.progressDraft.meta).toEqual({ successRate: 0, totalReviews: 1 });
  });
  it('the on-screen counters still count every tap', () => {
    const r = setup(cards('a'));
    revealAndGrade(r, 'missed');
    revealAndGrade(r, 'got');
    expect(r.current).toMatchObject({ gotCount: 1, missedCount: 1 });
  });
});

describe('restart ("Study again")', () => {
  it('resets position/counters/flip and replays the initial queue', () => {
    const r = setup(cards('a', 'b'));
    revealAndGrade(r, 'got');
    revealAndGrade(r, 'missed'); // b requeued
    revealAndGrade(r, 'got');
    expect(r.current.isComplete).toBe(true);
    wait();
    act(() => r.current.restart());
    expect(r.current).toMatchObject({
      position: 1, total: 2, isFlipped: false, isComplete: false, gotCount: 0, missedCount: 0,
    });
    expect(r.current.currentCard?.id).toBe('a');
  });
  it('is pure practice: progressDraft is untouched by replayed grades', () => {
    const r = setup(cards('a'));
    revealAndGrade(r, 'got');
    const snapshot = r.current.progressDraft;
    wait();
    act(() => r.current.restart());
    revealAndGrade(r, 'got');
    expect(r.current.progressDraft).toBe(snapshot); // same object: no update at all
  });
  it('is itself subject to the lockout (a double-tap on "Study again" does not reveal)', () => {
    const r = setup(cards('a'));
    revealAndGrade(r, 'got');
    wait();
    act(() => { r.current.restart(); r.current.reveal(); });
    expect(r.current.isFlipped).toBe(false);
  });
});

describe('progress from earlier sessions', () => {
  it('a due word is reviewed and moves up a box; the session queue honours the schedule', () => {
    const progress: ProgressDocument = {
      meta: { successRate: 1, totalReviews: 10 },
      words: {
        a: { box: 2, lapses: 0, dueAt: new Date(2026, 8, 22).toISOString(), lastSessionId: 's_prev' }, // due
        b: { box: 2, lapses: 0, dueAt: new Date(2026, 8, 30).toISOString(), lastSessionId: 's_prev' }, // not due
      },
    };
    const r = setup(cards('a', 'b'), progress);
    expect(r.current.total).toBe(1);
    revealAndGrade(r, 'got');
    expect(r.current.progressDraft.words.a.box).toBe(3);
    expect(r.current.progressDraft.words.b).toBe(progress.words.b);
    expect(r.current.progressDraft.meta.totalReviews).toBe(11);
  });
});
