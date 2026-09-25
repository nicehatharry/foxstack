// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import FlashCards from '../FlashCards';
import { ACTION_LOCKOUT_MS } from '../FlashCards.constants';
import type { Flashcard, ProgressDocument } from '../FlashCards.types';

// These tests pass their data in through FlashCards' props. They deliberately do NOT
// vi.mock the sample modules: a mock only takes effect if the mocked module hasn't already
// been loaded in the worker, so it silently breaks under `isolate: false`, or when a setup
// file imports app code. Props make the tests independent of the vitest configuration.

const fresh: ProgressDocument = { meta: { successRate: 1, totalReviews: 0 }, words: {} };
const one: Flashcard = { id: 'x1', german: 'Haus', english: 'house', partOfSpeech: 'noun', article: 'das' };

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 8, 23, 12, 0, 0));
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

const wait = () => act(() => { vi.advanceTimersByTime(ACTION_LOCKOUT_MS + 50); });
const tap = (label: string) => { wait(); fireEvent.click(screen.getByText(label)); };

describe('FlashCards page states', () => {
  it('empty word bank => "No cards in this deck yet."', () => {
    render(<FlashCards wordBank={[]} progress={fresh} />);
    expect(screen.getByText('No cards in this deck yet.')).toBeTruthy();
    expect(screen.queryByText('Show answer')).toBeNull();
  });

  it('cards exist but none are due and no new words => "Nothing due right now"', () => {
    const progress: ProgressDocument = {
      meta: { successRate: 1, totalReviews: 5 },
      words: { x1: { box: 2, lapses: 0, dueAt: new Date(2026, 8, 30).toISOString(), lastSessionId: 's_prev' } },
    };
    render(<FlashCards wordBank={[one]} progress={progress} />);
    expect(screen.getByText(/Nothing due right now/)).toBeTruthy();
    expect(screen.queryByText('Session complete')).toBeNull();
  });

  it('REGRESSION: missing the only card shows the SAME card again, but as a fresh remount', () => {
    const { container } = render(<FlashCards wordBank={[one]} progress={fresh} />);
    const before = container.querySelector('article');
    tap('Show answer');
    tap('Missed it');
    const after = container.querySelector('article');
    expect(screen.getByText(/^2 of 2$/)).toBeTruthy();   // same card, requeued
    expect(after).not.toBe(before);                       // key changed => remounted, un-flipped, re-animated
    expect(container.querySelector('article[aria-hidden="true"]')).toBeNull(); // new card starts un-flipped
  });

  it('shows the deckName prop in the header', () => {
    render(<FlashCards wordBank={[one]} progress={fresh} deckName="Kitchen words" />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Kitchen words');
  });

  it('reads its deck once: new props after mount are ignored until remounted with a new key', () => {
    const two: Flashcard = { id: 'x2', german: 'Baum', english: 'tree', partOfSpeech: 'noun', article: 'der' };
    const { rerender } = render(<FlashCards key="a" wordBank={[one]} progress={fresh} />);
    expect(screen.getByText(/^1 of 1$/)).toBeTruthy();
    rerender(<FlashCards key="a" wordBank={[one, two]} progress={fresh} />);
    expect(screen.getByText(/^1 of 1$/)).toBeTruthy();           // ignored
    rerender(<FlashCards key="b" wordBank={[one, two]} progress={fresh} />);
    expect(screen.getByText(/^1 of 2$/)).toBeTruthy();           // remounted with the new deck
  });
});
