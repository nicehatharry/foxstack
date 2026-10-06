import React from 'react';

import { formatDeckMeta } from './decks';
import type { DeckRecord } from './decks';

import { AppShell } from './styles/layout';
import { TopBar, TopBarRow, AppTitle } from './styles/header';
import { Actions, PrimaryBtn, EmptyState } from './styles/actions';
import { DeckList, DeckRow, DeckName, DeckMeta } from './styles/decks';

export interface DeckPickerProps {
  decks: DeckRecord[];
  onSelect: (deckId: string) => void;
  onCreate: () => void;
}

/** First screen: pick which deck to study, or start a new one. Presentational. */
export const DeckPicker: React.FC<DeckPickerProps> = ({ decks, onSelect, onCreate }) => (
  <AppShell>
    <TopBar>
      <TopBarRow>
        <AppTitle>Choose a deck</AppTitle>
      </TopBarRow>
    </TopBar>
    {decks.length === 0 ? (
      <EmptyState>No decks yet. Create one to start studying.</EmptyState>
    ) : (
      <DeckList>
        {decks.map((deck) => (
          <li key={deck.id}>
            <DeckRow type="button" onClick={() => onSelect(deck.id)}>
              <DeckName>{deck.name}</DeckName>
              <DeckMeta>{formatDeckMeta(deck)}</DeckMeta>
            </DeckRow>
          </li>
        ))}
      </DeckList>
    )}
    <Actions>
      <PrimaryBtn type="button" onClick={onCreate}>New deck</PrimaryBtn>
    </Actions>
  </AppShell>
);
