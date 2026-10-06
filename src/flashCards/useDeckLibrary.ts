import { useCallback, useEffect, useRef, useState } from 'react';

import { createDeck, withProgress } from './decks';
import type { CardDraft, DeckRecord } from './decks';
import type { ProgressDocument } from './FlashCards.types';

/**
 * Holds every deck and its progress. Like useStudySession, `initialDecks` is
 * read ONCE at mount. `onChange` is the persistence seam: it fires with the full
 * library after every change (never on mount), and the future S3 loader/saver
 * hangs off it, keeping this folder free of Amplify/S3 imports (context §2).
 */
export function useDeckLibrary(
  initialDecks: DeckRecord[],
  onChange?: (decks: DeckRecord[]) => void,
) {
  const [decks, setDecks] = useState(initialDecks);

  const reported = useRef(decks);
  useEffect(() => {
    if (reported.current === decks) return;
    reported.current = decks;
    onChange?.(decks);
  }, [decks, onChange]);

  const addDeck = useCallback((name: string, drafts: CardDraft[]) => {
    // Event-handler call, not render, so the clock read is fine here.
    const id = `d_${Date.now()}`;
    setDecks((prev) => [...prev, createDeck(id, name, drafts)]);
  }, []);

  const saveProgress = useCallback((deckId: string, progress: ProgressDocument) => {
    setDecks((prev) => withProgress(prev, deckId, progress));
  }, []);

  return { decks, addDeck, saveProgress };
}
