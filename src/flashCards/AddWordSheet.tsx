import React, { useEffect, useState } from 'react';

import { CardDraftForm } from './CardDraftForm';
import { describeDraft } from './decks';
import type { CardDraft } from './decks';

import { AppShell } from './styles/layout';
import { TopBarRow, AppTitle } from './styles/header';
import { FormBody, FormHint, SubmitBtn } from './styles/decks';
import { SheetOverlay, CloseBtn, SheetFooter } from './styles/addWord';

export interface AddWordSheetProps {
  onAdd: (draft: CardDraft) => void;
  onClose: () => void;
}

/**
 * Add words to the deck being studied. Stays open between adds (like
 * DeckCreator) and closes only via "Close" (header), "Done" (bottom, portrait only) or Escape — no backdrop-tap dismiss,
 * so no stray tap can close it. A new word has no progress record, so it joins
 * the NEXT session as a new word; the running session is untouched (inputs are
 * read once at mount, context §4).
 */
export const AddWordSheet: React.FC<AddWordSheetProps> = ({ onAdd, onClose }) => {
  const [lastAdded, setLastAdded] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <SheetOverlay role="dialog" aria-modal="true" aria-label="Add word">
      <AppShell>
        <TopBarRow>
          <AppTitle>Add word</AppTitle>
          <CloseBtn type="button" onClick={onClose}>Close</CloseBtn>
        </TopBarRow>
        <FormBody>
          <CardDraftForm
            autoFocus
            submitLabel="Add to deck"
            onSubmit={(draft) => {
              onAdd(draft);
              setLastAdded(describeDraft(draft));
            }}
          />
          {lastAdded !== null && (
            <FormHint role="status">Added {lastAdded}. It will appear in your next session.</FormHint>
          )}
        </FormBody>
        <SheetFooter>
          <SubmitBtn type="button" onClick={onClose}>Done</SubmitBtn>
        </SheetFooter>
      </AppShell>
    </SheetOverlay>
  );
};
