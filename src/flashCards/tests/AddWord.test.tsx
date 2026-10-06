// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import FlashCards from '../FlashCards';
import FlashCardsApp from '../FlashCardsApp';
import { withCard } from '../decks';
import type { CardDraft, DeckRecord } from '../decks';
import { ACTION_LOCKOUT_MS } from '../FlashCards.constants';
import type { Flashcard, ProgressDocument } from '../FlashCards.types';

// Data comes in through props; nothing here mocks this folder's modules (context §9).

const fresh = (): ProgressDocument => ({ meta: { successRate: 1, totalReviews: 0 }, words: {} });
const one: Flashcard = { id: 'x1', german: 'Haus', english: 'house', partOfSpeech: 'noun', article: 'das' };

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 8, 23, 12, 0, 0));
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

const wait = () => act(() => { vi.advanceTimersByTime(ACTION_LOCKOUT_MS + 50); });
const frontIsHidden = (c: HTMLElement) => c.querySelector('article[aria-hidden="true"]') !== null;
const addBtn = () => screen.getByRole('button', { name: 'Add word' });

function fillAndAdd(german: string, english: string) {
  fireEvent.change(screen.getByLabelText('German'), { target: { value: german } });
  fireEvent.change(screen.getByLabelText('English'), { target: { value: english } });
  fireEvent.click(screen.getByText('Add to deck'));
}

describe('withCard (pure)', () => {
  const deck = (id: string, wordBank: Flashcard[], progress = fresh()): DeckRecord => ({ id, name: id, wordBank, progress });
  const draft: CardDraft = { german: ' Hund ', english: ' dog ', partOfSpeech: 'noun', article: 'der' };

  it('appends a trimmed card with the next free id, leaving other decks untouched', () => {
    const a = deck('a', [one]);
    const b = deck('b', []);
    const out = withCard([a, b], 'a', draft);
    expect(out[0].wordBank.map(c => c.id)).toEqual(['x1', 'c02']);
    expect(out[0].wordBank[1]).toEqual({ id: 'c02', german: 'Hund', english: 'dog', partOfSpeech: 'noun', article: 'der' });
    expect(out[1]).toBe(b);
  });

  it('skips ids already used by the bank OR by an orphaned progress entry', () => {
    const progress = fresh();
    progress.words.c02 = { box: 3, lapses: 0, dueAt: new Date(2026, 9, 1).toISOString(), lastSessionId: 's_old' };
    const out = withCard([deck('a', [one], progress)], 'a', draft);
    expect(out[0].wordBank[1].id).toBe('c03'); // c02 would inherit the orphan's box
  });
});

describe('add-word "+" on the study page', () => {
  it('is absent without onAddCard', () => {
    render(<FlashCards wordBank={[one]} progress={fresh()} />);
    expect(screen.queryByRole('button', { name: 'Add word' })).toBeNull();
  });

  it('opens and closes the form WITHOUT flipping the card, and tapping inside the form never flips it', () => {
    const { container } = render(<FlashCards wordBank={[one]} progress={fresh()} onAddCard={() => {}} />);
    wait();
    fireEvent.click(addBtn());
    const dialog = screen.getByRole('dialog');
    expect(frontIsHidden(container)).toBe(false);
    fireEvent.click(dialog);
    fireEvent.click(screen.getByText('Add word', { selector: 'h1' }));
    expect(frontIsHidden(container)).toBe(false);
    fireEvent.click(screen.getByText('Done'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(frontIsHidden(container)).toBe(false);
  });

  it('keeps the card on the answer side if it was already flipped', () => {
    const { container } = render(<FlashCards wordBank={[one]} progress={fresh()} onAddCard={() => {}} />);
    wait();
    fireEvent.click(screen.getByText('Show answer'));
    expect(frontIsHidden(container)).toBe(true);
    fireEvent.click(addBtn());
    fireEvent.click(screen.getByText('Done'));
    expect(frontIsHidden(container)).toBe(true);
  });

  it('makes the study view inert while the form is open', () => {
    const { container } = render(<FlashCards wordBank={[one]} progress={fresh()} onAddCard={() => {}} />);
    expect(container.querySelector('[inert]')).toBeNull();
    fireEvent.click(addBtn());
    expect(container.querySelector('[inert]')).not.toBeNull();
    fireEvent.click(screen.getByText('Done'));
    expect(container.querySelector('[inert]')).toBeNull();
  });

  it('the header "Close" closes the form too', () => {
    render(<FlashCards wordBank={[one]} progress={fresh()} onAddCard={() => {}} />);
    fireEvent.click(addBtn());
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('focuses the German field as the form opens (keyboard comes up inside the tap)', () => {
    render(<FlashCards wordBank={[one]} progress={fresh()} onAddCard={() => {}} />);
    fireEvent.click(addBtn());
    expect(document.activeElement).toBe(screen.getByLabelText('German'));
  });

  it('returns focus to the "+" after closing', () => {
    render(<FlashCards wordBank={[one]} progress={fresh()} onAddCard={() => {}} />);
    fireEvent.click(addBtn());
    fireEvent.click(screen.getByText('Close'));
    expect(document.activeElement).toBe(addBtn());
  });

  it('ships the landscape-phone layout rule (jsdom cannot lay it out — this checks the rule exists)', () => {
    render(<FlashCards wordBank={[one]} progress={fresh()} onAddCard={() => {}} />);
    fireEvent.click(addBtn());
    const css = Array.from(document.querySelectorAll('style')).map(s => s.textContent ?? '').join('');
    expect(css).toMatch(/orientation:\s*landscape/);
    expect(css).toMatch(/max-height:\s*500px/);
  });

  it('Escape closes the form', () => {
    render(<FlashCards wordBank={[one]} progress={fresh()} onAddCard={() => {}} />);
    fireEvent.click(addBtn());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('reports the new word, clears the fields, confirms, and leaves the running session alone', () => {
    const onAddCard = vi.fn();
    render(<FlashCards wordBank={[one]} progress={fresh()} onAddCard={onAddCard} />);
    fireEvent.click(addBtn());
    fillAndAdd('Hund', 'dog');
    expect(onAddCard).toHaveBeenCalledWith({ german: 'Hund', english: 'dog', partOfSpeech: 'noun', article: 'der' });
    expect((screen.getByLabelText('German') as HTMLInputElement).value).toBe('');
    expect(screen.getByRole('status').textContent).toMatch(/der Hund: dog/);
    fireEvent.click(screen.getByText('Done'));
    expect(screen.getByText(/^1 of 1$/)).toBeTruthy(); // queue is fixed at mount
  });

  it('will not submit with a blank field', () => {
    const onAddCard = vi.fn();
    render(<FlashCards wordBank={[one]} progress={fresh()} onAddCard={onAddCard} />);
    fireEvent.click(addBtn());
    fillAndAdd('Hund', '  ');
    expect(onAddCard).not.toHaveBeenCalled();
  });
});

describe('FlashCardsApp: adding a word to an existing deck', () => {
  it('saves it to the library, keeps this session at "1 of 1", and offers it next time the deck is opened', () => {
    const onLibraryChange = vi.fn();
    const deck: DeckRecord = { id: 'd1', name: 'Kitchen', wordBank: [one], progress: fresh() };
    render(<FlashCardsApp initialDecks={[deck]} onLibraryChange={onLibraryChange} />);

    fireEvent.click(screen.getByText('Kitchen'));
    expect(screen.getByText(/^1 of 1$/)).toBeTruthy();
    fireEvent.click(addBtn());
    fillAndAdd('Hund', 'dog');
    fireEvent.click(screen.getByText('Done'));

    const saved = onLibraryChange.mock.calls.at(-1)![0] as DeckRecord[];
    expect(saved[0].wordBank.map(c => c.id)).toEqual(['x1', 'c02']);
    expect(screen.getByText(/^1 of 1$/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Back to decks' }));
    fireEvent.click(screen.getByText('Kitchen'));
    expect(screen.getByText(/^1 of 2$/)).toBeTruthy();
  });
});
