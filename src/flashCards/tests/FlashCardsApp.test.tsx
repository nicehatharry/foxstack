// @vitest-environment jsd
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

// reveal/grade are ignored within the lockout of the previous action (context §6).
const waitOutLockout = () => new Promise((r) => setTimeout(r, ACTION_LOCKOUT_MS + 50));

async function gradeFirstCardGot() {
  await waitOutLockout();
  fireEvent.click(screen.getByText('Show answer'));
  await waitOutLockout();
  fireEvent.click(screen.getByText('Got it'));
}

const openDeck = (name: RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const backToPicker = () => fireEvent.click(screen.getByRole('button', { name: 'Back to decks' }));

describe('FlashCardsApp: picking a deck', () => {
  it('opens on the deck picker, listing every deck and no study UI', () => {
    render(<FlashCardsApp initialDecks={makeDecks()} />);
    expect(screen.getByText('Choose a deck')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Animals/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Colors/ })).toBeTruthy();
    expect(screen.getByText('0 of 2 cards started')).toBeTruthy();
    expect(screen.getByText('0 of 1 card started')).toBeTruthy();
    expect(screen.queryByText('Show answer')).toBeNull();
  });

  it('opens the chosen deck, and its back button returns to the picker', () => {
    render(<FlashCardsApp initialDecks={makeDecks()} />);
    openDeck(/Animals/);
    expect(screen.getByText('1 of 2')).toBeTruthy();
    expect(screen.queryByText('Choose a deck')).toBeNull();
    backToPicker();
    expect(screen.getByText('Choose a deck')).toBeTruthy();
  });

  it('shows an empty state with no decks, but still offers New deck', () => {
    render(<FlashCardsApp initialDecks={[]} />);
    expect(screen.getByText(/No decks yet/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'New deck' })).toBeTruthy();
  });
});

describe('FlashCardsApp: progress is tracked per deck', () => {
  it('records a graded card on that deck only, and the next session resumes from it', async () => {
    render(<FlashCardsApp initialDecks={makeDecks()} />);

    openDeck(/Animals/);
    await gradeFirstCardGot();
    backToPicker();

    expect(screen.getByText('1 of 2 cards started')).toBeTruthy(); // Animals moved
    expect(screen.getByText('0 of 1 card started')).toBeTruthy();  // Colors did not

    // Hund is now scheduled for tomorrow, so only Katze is left to study.
    openDeck(/Animals/);
    expect(screen.getByText('1 of 1')).toBeTruthy();
  });

  it('reports the library on change but never on mount', async () => {
    const onLibraryChange = vi.fn();
    render(<FlashCardsApp initialDecks={makeDecks()} onLibraryChange={onLibraryChange} />);
    expect(onLibraryChange).not.toHaveBeenCalled();

    openDeck(/Animals/);
    expect(onLibraryChange).not.toHaveBeenCalled(); // opening a deck changes nothing

    await gradeFirstCardGot();
    expect(onLibraryChange).toHaveBeenCalledTimes(1);
    const saved = onLibraryChange.mock.calls[0][0] as DeckRecord[];
    expect(Object.keys(saved[0].progress.words)).toEqual(['c01']);
    expect(Object.keys(saved[1].progress.words)).toEqual([]);
  });
});

describe('FlashCardsApp: creating a deck', () => {
  const type = (label: string, value: string) =>
    fireEvent.change(screen.getByLabelText(label), { target: { value } });

  it('keeps Create deck disabled until there is a name and at least one card', () => {
    render(<FlashCardsApp initialDecks={makeDecks()} />);
    fireEvent.click(screen.getByRole('button', { name: 'New deck' }));
    const create = screen.getByRole('button', { name: 'Create deck' }) as HTMLButtonElement;
    expect(create.disabled).toBe(true);

    type('Deck name', 'Food');
    expect(create.disabled).toBe(true); // name alone is not enough

    type('German', 'Brot');
    type('English', 'bread');
    fireEvent.click(screen.getByRole('button', { name: 'Add card' }));
    expect(create.disabled).toBe(false);
  });

  it('adds a new deck with its own empty progress and lists it on the picker', () => {
    const onLibraryChange = vi.fn();
    render(<FlashCardsApp initialDecks={makeDecks()} onLibraryChange={onLibraryChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'New deck' }));

    type('Deck name', 'Food');
    type('German', 'Brot');
    type('English', 'bread');
    fireEvent.click(screen.getByRole('button', { name: 'Add card' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create deck' }));

    expect(screen.getByText('Choose a deck')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Food/ })).toBeTruthy();
    expect(screen.getAllByText('0 of 1 card started')).toHaveLength(2); // Colors + Food

    const saved = onLibraryChange.mock.calls[0][0] as DeckRecord[];
    expect(saved).toHaveLength(3);
    expect(saved[2].wordBank[0]).toMatchObject({ german: 'Brot', english: 'bread', partOfSpeech: 'noun', article: 'der' });
  });

  it('cancelling returns to the picker without adding a deck', () => {
    render(<FlashCardsApp initialDecks={makeDecks()} />);
    fireEvent.click(screen.getByRole('button', { name: 'New deck' }));
    type('Deck name', 'Nope');
    backToPicker();
    expect(screen.getByText('Choose a deck')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Nope/ })).toBeNull();
  });

  it('lets a card be removed before creating', () => {
    render(<FlashCardsApp initialDecks={makeDecks()} />);
    fireEvent.click(screen.getByRole('button', { name: 'New deck' }));
    type('Deck name', 'Food');
    type('German', 'Brot');
    type('English', 'bread');
    fireEvent.click(screen.getByRole('button', { name: 'Add card' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove Brot' }));
    expect((screen.getByRole('button', { name: 'Create deck' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
