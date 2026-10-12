// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import FlashCards from '../FlashCards';
import { ACTION_LOCKOUT_MS } from '../FlashCards.constants';
import type { CompletedSession, Flashcard, ProgressDocument } from '../FlashCards.types';

const noun = (id: string, german: string): Flashcard =>
  ({ id, german, english: german.toLowerCase(), partOfSpeech: 'noun', article: 'das' });
const bank = [noun('a', 'Haus'), noun('b', 'Baum'), noun('c', 'Hund')];

// Every word graded in s_prev and not due for a week => "Nothing due right now".
const NOW = new Date(2026, 8, 23, 12, 0, 0);
const progress: ProgressDocument = {
  meta: { successRate: 1, totalReviews: 3 },
  words: Object.fromEntries(bank.map(c => [c.id, {
    box: 2 as const, lapses: 0, dueAt: new Date(2026, 8, 30).toISOString(), lastSessionId: 's_prev',
  }])),
};
const last: CompletedSession = { sessionId: 's_prev', cardIds: ['a', 'b', 'c'] };

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

const wait = () => act(() => { vi.advanceTimersByTime(ACTION_LOCKOUT_MS + 50); });
const tap = (label: string) => { wait(); fireEvent.click(screen.getByText(label)); };

describe('"Nothing due" actions', () => {
  it('offers Study again and New Session when the previous session is known', () => {
    render(<FlashCards wordBank={bank} progress={progress} lastSession={last} />);
    expect(screen.getByText(/Nothing due right now/)).toBeTruthy();
    expect(screen.getByText('Study again')).toBeTruthy();
    expect(screen.getByText('New Session')).toBeTruthy();
  });

  it('hides Study again without a previous session', () => {
    render(<FlashCards wordBank={bank} progress={progress} />);
    expect(screen.queryByText('Study again')).toBeNull();
    expect(screen.getByText('New Session')).toBeTruthy();
  });

  it('hides Study again when none of the previous cards are in the deck any more', () => {
    render(<FlashCards wordBank={bank} progress={progress} lastSession={{ sessionId: 's_prev', cardIds: ['gone'] }} />);
    expect(screen.queryByText('Study again')).toBeNull();
  });
});

describe('Study again', () => {
  it('runs the same cards in a new random order', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // shuffles [a,b,c] -> [b,c,a]
    render(<FlashCards wordBank={bank} progress={progress} lastSession={last} />);
    tap('Study again');
    expect(screen.getByText(/^1 of 3$/)).toBeTruthy();
    expect(screen.getByText('Baum')).toBeTruthy();
    expect(screen.queryByText(/Nothing due/)).toBeNull();
  });

  it('is pure practice: no progress is written; completion reports the same session id', () => {
    const onProgressChange = vi.fn();
    const onSessionComplete = vi.fn();
    render(
      <FlashCards
        wordBank={bank}
        progress={progress}
        lastSession={last}
        onProgressChange={onProgressChange}
        onSessionComplete={onSessionComplete}
      />,
    );
    tap('Study again');
    for (let i = 0; i < 3; i++) { tap('Show answer'); tap('Got it'); }
    expect(screen.getByText('Session complete')).toBeTruthy();
    expect(onProgressChange).not.toHaveBeenCalled();
    expect(onSessionComplete).toHaveBeenCalledTimes(1);
    const reported = onSessionComplete.mock.calls[0][0] as CompletedSession;
    expect(reported.sessionId).toBe('s_prev');
    expect([...reported.cardIds].sort()).toEqual(['a', 'b', 'c']);
  });
});

describe('New Session', () => {
  it('starts a graded session under a new id from the cards closest to due', () => {
    const onProgressChange = vi.fn();
    render(<FlashCards wordBank={[bank[0]]} progress={{ ...progress, words: { a: progress.words.a } }} onProgressChange={onProgressChange} />);
    tap('New Session');
    expect(screen.getByText(/^1 of 1$/)).toBeTruthy();
    tap('Show answer');
    tap('Got it');
    expect(onProgressChange).toHaveBeenCalledTimes(1);
    const next = onProgressChange.mock.calls[0][0] as ProgressDocument;
    expect(next.words.a.lastSessionId).not.toBe('s_prev');
    expect(next.words.a.box).toBe(3);
  });

  it('reports the new session on completion', () => {
    const onSessionComplete = vi.fn();
    render(<FlashCards wordBank={[bank[0]]} progress={{ ...progress, words: { a: progress.words.a } }} onSessionComplete={onSessionComplete} />);
    tap('New Session');
    tap('Show answer');
    tap('Got it');
    expect(onSessionComplete).toHaveBeenCalledTimes(1);
    const reported = onSessionComplete.mock.calls[0][0] as CompletedSession;
    expect(reported.sessionId).not.toBe('s_prev');
    expect(reported.cardIds).toEqual(['a']);
  });
});

describe('Session complete options', () => {
  const one = [bank[0]];
  const fresh: ProgressDocument = { meta: { successRate: 1, totalReviews: 0 }, words: {} };
  const finish = () => { tap('Show answer'); tap('Got it'); };

  it('offers Study again and New Session', () => {
    render(<FlashCards wordBank={one} progress={fresh} />);
    finish();
    expect(screen.getByText('Session complete')).toBeTruthy();
    expect(screen.getByText('Study again')).toBeTruthy();
    expect(screen.getByText('New Session')).toBeTruthy();
    expect(screen.getByText('No words missed.')).toBeTruthy();
  });

  it('lists missed words: nouns with their article, other parts of speech bare', () => {
    const verb: Flashcard = { id: 'v', german: 'erinnern', english: 'remember', partOfSpeech: 'verb' };
    render(<FlashCards wordBank={[bank[0], verb]} progress={fresh} />);
    tap('Show answer'); tap('Missed it');
    tap('Show answer'); tap('Missed it');
    // Each missed card is requeued once; get both right the second time.
    tap('Show answer'); tap('Got it');
    tap('Show answer'); tap('Got it');
    expect(screen.getByText('missed:')).toBeTruthy();
    expect(screen.getByText('das Haus')).toBeTruthy();
    expect(screen.getByText('erinnern')).toBeTruthy();
    expect(screen.queryByText(/^got /)).toBeNull();
  });

  it('Study again replays the same cards without grading them', () => {
    const onProgressChange = vi.fn();
    render(<FlashCards wordBank={one} progress={fresh} onProgressChange={onProgressChange} />);
    finish();
    expect(onProgressChange).toHaveBeenCalledTimes(1);
    tap('Study again');
    expect(screen.getByText(/^1 of 1$/)).toBeTruthy();
    finish();
    expect(onProgressChange).toHaveBeenCalledTimes(1);
  });

  it('New Session starts a fresh study-ahead session', () => {
    render(<FlashCards wordBank={one} progress={fresh} />);
    finish();
    tap('New Session');
    expect(screen.getByText(/^1 of 1$/)).toBeTruthy();
    expect(screen.queryByText('Session complete')).toBeNull();
  });
});
