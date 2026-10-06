import React, { useState } from 'react';

import { GlobalStyle } from './GlobalStyle';
import FlashCards from './FlashCards';
import { DeckPicker } from './DeckPicker';
import { DeckCreator } from './DeckCreator';
import { useDeckLibrary } from './useDeckLibrary';
import { sampleDeck, sampleDeckName } from './sampleDeck';
import { sampleProgress } from './sampleProgress';
import type { DeckRecord } from './decks';

export interface FlashCardsAppProps {
  /** Decks to offer on load. Read ONCE at mount. Defaults to the sample deck. */
  initialDecks?: DeckRecord[];
  /** Fires with the whole library after every change (never on mount). Persistence seam. */
  onLibraryChange?: (decks: DeckRecord[]) => void;
}

const defaultDecks: DeckRecord[] = [
  { id: 'sample', name: sampleDeckName, wordBank: sampleDeck, progress: sampleProgress },
];

type View = { kind: 'picker' } | { kind: 'create' } | { kind: 'study'; deckId: string };

/**
 * Deck picker → study / create. Each deck is studied in its own `<FlashCards>`
 * remounted by `key={deck.id}` (inputs are read once at mount, context §4), and
 * its progress is saved back into the library on every graded card, so leaving a
 * deck mid-session keeps what was graded, and reopening resumes from it.
 */
const FlashCardsApp: React.FC<FlashCardsAppProps> = ({
  initialDecks = defaultDecks,
  onLibraryChange,
}) => {
  const { decks, addDeck, saveProgress } = useDeckLibrary(initialDecks, onLibraryChange);
  const [view, setView] = useState<View>({ kind: 'picker' });

  const toPicker = () => setView({ kind: 'picker' });

  const renderView = () => {
    if (view.kind === 'create') {
      return (
        <DeckCreator
          onCancel={toPicker}
          onCreate={(name, drafts) => {
            addDeck(name, drafts);
            toPicker();
          }}
        />
      );
    }

    if (view.kind === 'study') {
      const deck = decks.find((d) => d.id === view.deckId);
      if (deck) {
        return (
          <FlashCards
            key={deck.id}
            wordBank={deck.wordBank}
            progress={deck.progress}
            deckName={deck.name}
            onProgressChange={(next) => saveProgress(deck.id, next)}
            onBack={toPicker}
          />
        );
      }
    }

    return (
      <DeckPicker
        decks={decks}
        onSelect={(deckId) => setView({ kind: 'study', deckId })}
        onCreate={() => setView({ kind: 'create' })}
      />
    );
  };

  return (
    <>
      <GlobalStyle />
      {renderView()}
    </>
  );
};

export default FlashCardsApp;
