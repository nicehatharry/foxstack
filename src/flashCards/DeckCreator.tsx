import React, { useState } from 'react';

import { describeDraft } from './decks';
import type { CardDraft } from './decks';
import { CardDraftForm } from './CardDraftForm';

import { AppShell } from './styles/layout';
import { TopBar, TopBarRow, AppTitle } from './styles/header';
import { Actions } from './styles/actions';
import {
  BackBtn, TitleGroup, FormBody, Field, TextInput,
  DraftList, DraftItem, DraftText, RemoveBtn, FormHint, SubmitBtn,
} from './styles/decks';

export interface DeckCreatorProps {
  onCreate: (name: string, drafts: CardDraft[]) => void;
  onCancel: () => void;
}

/**
 * Name a deck and add its first cards. Cards carry no `forms` (those are
 * authored strings, never generated at runtime — context §2). A deck needs at
 * least one card, so an empty deck is never created.
 */
export const DeckCreator: React.FC<DeckCreatorProps> = ({ onCreate, onCancel }) => {
  const [name, setName] = useState('');
  const [drafts, setDrafts] = useState<CardDraft[]>([]);
  const canCreate = name.trim() !== '' && drafts.length > 0;

  return (
    <AppShell>
      <TopBar>
        <TopBarRow>
          <TitleGroup>
            <BackBtn type="button" aria-label="Back to decks" onClick={onCancel}>‹ Decks</BackBtn>
            <AppTitle>New deck</AppTitle>
          </TitleGroup>
        </TopBarRow>
      </TopBar>
      <FormBody>
        <Field>
          Deck name
          <TextInput value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
        </Field>

        <CardDraftForm
          submitLabel="Add card"
          onSubmit={(draft) => setDrafts((prev) => [...prev, draft])}
        />

        {drafts.length === 0 ? (
          <FormHint>Add at least one card to create the deck.</FormHint>
        ) : (
          <DraftList aria-label="Cards in this deck">
            {drafts.map((draft, i) => (
              <DraftItem key={i}>
                <DraftText>{describeDraft(draft)}</DraftText>
                <RemoveBtn
                  type="button"
                  aria-label={`Remove ${draft.german.trim()}`}
                  onClick={() => setDrafts((prev) => prev.filter((_, j) => j !== i))}
                >
                  Remove
                </RemoveBtn>
              </DraftItem>
            ))}
          </DraftList>
        )}
      </FormBody>
      <Actions>
        <SubmitBtn type="button" disabled={!canCreate} onClick={() => onCreate(name, drafts)}>
          Create deck
        </SubmitBtn>
      </Actions>
    </AppShell>
  );
};
