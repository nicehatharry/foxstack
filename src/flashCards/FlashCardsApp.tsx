import React, { useCallback, useEffect, useRef, useState } from 'react';

import { GlobalStyle } from './GlobalStyle';
import FlashCards from './FlashCards';
import { DeckPicker } from './DeckPicker';
import { DeckCreator } from './DeckCreator';
import { useDeckLibrary } from './useDeckLibrary';
import { sampleDeck, sampleDeckName } from './sampleDeck';
import { sampleProgress } from './sampleProgress';
import type { DeckRecord } from './decks';
import type { CompletedSession } from './FlashCards.types';

export interface FlashCardsAppProps {
  /** Decks to offer on load. Read ONCE at mount. Defaults to the sample deck. */
  initialDecks?: DeckRecord[];
  /** Fires with the whole library after every change (never on mount), including each graded card. */
  onLibraryChange?: (decks: DeckRecord[]) => void;
  /**
   * Fires at moments worth persisting: deck created, card added, session
   * complete, leaving a deck. Always AFTER `onLibraryChange` has reported the
   * change that caused it. Never on mount. Persistence seam: wire to a flush.
   */
  onCheckpoint?: () => void;
  /** Opens the Manage words page (routing lives in FlashCardsRoot). Link hidden when absent. */
  onManage?: () => void;
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
 *
 * Replay: the last finished session per deck is kept in a ref (memory only,
 * lost on reload) and handed back as `lastSession` when the deck is reopened.
 *
 * Checkpoints: an action bumps `checkpointTick` in the same batch as its library
 * change; the effect below is declared AFTER useDeckLibrary's, so on the
 * resulting render `onLibraryChange` has already reported the new library when
 * `onCheckpoint` runs. A checkpoint with nothing new is harmless (flush no-ops).
 */
const FlashCardsApp: React.FC<FlashCardsAppProps> = ({
  initialDecks = defaultDecks,
  onLibraryChange,
  onCheckpoint,
  onManage,
}) => {
  const { decks, addDeck, addCard, saveProgress } = useDeckLibrary(initialDecks, onLibraryChange);
  const [view, setView] = useState<View>({ kind: 'picker' });
  const lastSessions = useRef(new Map<string, CompletedSession>());

  const [checkpointTick, setCheckpointTick] = useState(0);
  const requestCheckpoint = useCallback(() => setCheckpointTick((t) => t + 1), []);
  const handledTick = useRef(0);
  useEffect(() => {
    if (handledTick.current === checkpointTick) return;
    handledTick.current = checkpointTick;
    onCheckpoint?.();
  }, [checkpointTick, onCheckpoint]);

  const toPicker = () => setView({ kind: 'picker' });

  const renderView = () => {
    if (view.kind === 'create') {
      return (
        <DeckCreator
          onCancel={toPicker}
          onCreate={(name, drafts) => {
            addDeck(name, drafts);
            requestCheckpoint();
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
            lastSession={lastSessions.current.get(deck.id)}
            onSessionComplete={(session) => {
              lastSessions.current.set(deck.id, session);
              requestCheckpoint();
            }}
            onBack={() => {
              requestCheckpoint();
              toPicker();
            }}
            onAddCard={(draft) => {
              addCard(deck.id, draft);
              requestCheckpoint();
            }}
          />
        );
      }
    }

    return (
      <DeckPicker
        decks={decks}
        onSelect={(deckId) => setView({ kind: 'study', deckId })}
        onCreate={() => setView({ kind: 'create' })}
        onManage={onManage}
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
