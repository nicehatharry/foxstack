// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

import FlashCardsApp from '../FlashCardsApp';
import { emptyProgress } from '../decks';
import type { DeckRecord } from '../decks';
import { ACTION_LOCKOUT_MS } from '../FlashCards.constants';

afterEach(cleanup);

const makeDecks = (): DeckRecord[] => [
  {
    id: 'animals',
    name: 'Animals',
    wordBank: [
      { id: 'c01', german: 'Hund', english: 'dog', partOfSpeech: 'noun', article: 'der' },
      { id: 'c02', german: 'Katze', english: 'cat', partOfSpeech: 'noun', article: 'die' },
    ],
    progress: emptyProgress(),
  },
  {
    id: 'colors',
    name: 'Colors',
    wordBank: [{ id: 'c01', german: 'rot', english: 'red', partOfSpeech: 'adjective' }],
    progress: emptyProgress(),
  },
];

const waitOutLockout = () => new Promise((r) => setTimeout(r, ACTION_LOCKOUT_MS + 50));

async function gradeFirstCardGot() {
  await waitOutLockout();
  fireEvent.click(screen.getByText('Show answer'));
  await waitOutLockout();
  fireEvent.click(screen.getByText('Got it'));
}

const openDeck = (name: RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const backToPicker = () => fireEvent.click(screen.getByRole('button', { name: 'Back to decks' }));
const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

/** Records the interleaving of the two seams, which is the property that matters. */
const spies = () => {
  const order: string[] = [];
  const onLibraryChange = vi.fn(() => { order.push('change'); });
  const onCheckpoint = vi.fn(() => { order.push('checkpoint'); });
  return { order, onLibraryChange, onCheckpoint };
};

describe('FlashCardsApp: checkpoints', () => {
  it('never checkpoints on mount or on cancelling creation', () => {
    const { onLibraryChange, onCheckpoint } = spies();
    render(<FlashCardsApp initialDecks={makeDecks()} onLibraryChange={onLibraryChange} onCheckpoint={onCheckpoint} />);
    expect(onCheckpoint).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'New deck' }));
    type('Deck name', 'Nope');
    backToPicker();
    expect(onCheckpoint).not.toHaveBeenCalled();
  });

  it('checkpoints when a deck is created, after the library reported it', () => {
    const { order, onLibraryChange, onCheckpoint } = spies();
    render(<FlashCardsApp initialDecks={makeDecks()} onLibraryChange={onLibraryChange} onCheckpoint={onCheckpoint} />);
    fireEvent.click(screen.getByRole('button', { name: 'New deck' }));
    type('Deck name', 'Food');
    type('German', 'Brot');
    type('English', 'bread');
    fireEvent.click(screen.getByRole('button', { name: 'Add card' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create deck' }));

    expect(order).toEqual(['change', 'checkpoint']);
    const saved = onLibraryChange.mock.calls[0] as unknown as [DeckRecord[]];
    expect(saved[0]).toHaveLength(3);
  });

  it('checkpoints when leaving a deck', () => {
    const { onLibraryChange, onCheckpoint } = spies();
    render(<FlashCardsApp initialDecks={makeDecks()} onLibraryChange={onLibraryChange} onCheckpoint={onCheckpoint} />);
    openDeck(/Animals/);
    expect(onCheckpoint).not.toHaveBeenCalled();
    backToPicker();
    expect(onCheckpoint).toHaveBeenCalledTimes(1);
  });

  it('checkpoints once when a session completes, after the final grade is reported, and not per grade', async () => {
    const { order, onLibraryChange, onCheckpoint } = spies();
    render(<FlashCardsApp initialDecks={makeDecks()} onLibraryChange={onLibraryChange} onCheckpoint={onCheckpoint} />);

    openDeck(/Animals/); // two cards: grading the first must NOT checkpoint
    await gradeFirstCardGot();
    expect(order).toEqual(['change']);
    expect(onCheckpoint).not.toHaveBeenCalled();
    backToPicker();
    order.length = 0;

    openDeck(/Colors/); // one card: grading it completes the session
    await gradeFirstCardGot();
    expect(screen.getByText('Session complete')).toBeTruthy();
    expect(order).toEqual(['change', 'checkpoint']);
  });
});
