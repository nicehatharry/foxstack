// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import FlashCards from '../FlashCards';
import { sampleDeck } from '../sampleDeck';
import { sampleProgress } from '../sampleProgress';
import { buildSessionQueue } from '../srs';
import { ACTION_LOCKOUT_MS, SESSION_CARD_CAP } from '../FlashCards.constants';

// sampleProgress stamps Date.now() when its module loads (imports are hoisted above this line),
// so keep the fake clock on that same timeline or its "due" words won't be due.
const LOADED_AT = Date.now();

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(LOADED_AT + 1000); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

const wait = () => act(() => { vi.advanceTimersByTime(ACTION_LOCKOUT_MS + 50); });
const tap = (label: string | RegExp) => { wait(); fireEvent.click(screen.getByText(label)); };

describe('FlashCards (sample data)', () => {
  it('the sample session is composed as designed (3 due reviews c02/c01/c04 + 6 new interleaved; c03 not due)', () => {
    const q = buildSessionQueue(sampleDeck, sampleProgress.words, sampleProgress.meta, new Date(), 's_new', SESSION_CARD_CAP);
    expect(q.map(c => c.id)).toEqual(['c02', 'c05', 'c06', 'c01', 'c07', 'c08', 'c04', 'c09', 'c10']);
  });

  it('shows the title, the first prompt without its article, and "1 of 9"', () => {
    render(<FlashCards />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Everyday German');
    expect(screen.getByText(/^1 of 9$/)).toBeTruthy();
    // c02 = das Fernweh. Prompt face shows the bare lemma; the article only appears on the answer face.
    expect(screen.getAllByText('Fernweh')).toHaveLength(1);
    expect(screen.getByText('das Fernweh')).toBeTruthy();
  });

  it('runs a whole session, requeues one miss, and ends on the summary', () => {
    render(<FlashCards />);
    let taps = 0;
    while (!screen.queryByText('Session complete') && taps < 40) {
      tap('Show answer');
      tap(taps === 0 ? 'Missed it' : 'Got it');
      taps += 1;
    }
    expect(taps).toBe(10); // 9 cards + 1 requeue
    expect(screen.getByText('Session complete')).toBeTruthy();
    expect(screen.getByText('9 got it, 1 missed it')).toBeTruthy();
  });

  it('"Study again" returns to the first card of the same queue', () => {
    render(<FlashCards />);
    for (let i = 0; i < 9; i++) { tap('Show answer'); tap('Got it'); }
    expect(screen.getByText('Session complete')).toBeTruthy();
    tap('Study again');
    expect(screen.getByText(/^1 of 9$/)).toBeTruthy();
    expect(screen.queryByText('Session complete')).toBeNull();
  });

  it('tapping the card itself reveals the answer', () => {
    const { container } = render(<FlashCards />);
    const scene = container.querySelector('article')!.parentElement!.parentElement!;
    wait();
    fireEvent.click(scene);
    expect(screen.getByText('Missed it')).toBeTruthy();
    // Front face is hidden from assistive tech once flipped.
    expect(container.querySelector('article[aria-hidden="true"]')).not.toBeNull();
  });
});
