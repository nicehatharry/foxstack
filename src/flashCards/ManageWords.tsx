import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { GlobalStyle } from './GlobalStyle';
import { WordEditor } from './WordEditor';
import { useDeckLibrary } from './useDeckLibrary';
import { PART_OF_SPEECH_OPTIONS, nextCardId } from './decks';
import type { DeckRecord } from './decks';
import { getArticle, hasForms } from './FlashCards.utils';
import type { Flashcard } from './FlashCards.types';

import { TopBar, TopBarRow, AppTitle } from './styles/header';
import { EmptyState } from './styles/actions';
import { BackBtn, TitleGroup, Field, Select, TextInput, FormHint, AddBtn } from './styles/decks';
import {
  ManageShell, DeckBar, SplitPane, ListPane, EditorPane, WordList, WordRow, WordRowTitle, WordRowMeta,
  EditorPlaceholder,
} from './styles/manage';

export interface ManageWordsProps {
  /** Read ONCE at mount, like FlashCardsApp. */
  initialDecks: DeckRecord[];
  onLibraryChange?: (decks: DeckRecord[]) => void;
  /** Fires after Save / Delete / Copy (always after `onLibraryChange`). Wire to a flush. */
  onCheckpoint?: () => void;
  onBack: () => void;
}

type Selection = { kind: 'none' } | { kind: 'new' } | { kind: 'card'; id: string };

const FORMS_POS = new Set(['noun', 'verb', 'adjective']);
const posLabel = (pos: string) => PART_OF_SPEECH_OPTIONS.find((o) => o.value === pos)?.label ?? pos;

/**
 * Manage words: pick a deck, search its words, edit one (all word forms) or
 * add a new one. Saving is manual per word (WordEditor's Save). Phone: list →
 * editor push; ≥ 900px: list | editor. AWS-free; ManageWordsRoot wires persistence.
 * Checkpoint ordering mirrors FlashCardsApp (tick bumped with the change; effect declared after the hook's).
 */
const ManageWords: React.FC<ManageWordsProps> = ({ initialDecks, onLibraryChange, onCheckpoint, onBack }) => {
  const { decks, saveCard, deleteCard, copyCard } = useDeckLibrary(initialDecks, onLibraryChange);
  const [deckId, setDeckId] = useState(initialDecks[0]?.id ?? '');
  const [selection, setSelection] = useState<Selection>({ kind: 'none' });
  const [query, setQuery] = useState('');
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [checkpointTick, setCheckpointTick] = useState(0);
  const handledTick = React.useRef(0);
  useEffect(() => {
    if (handledTick.current === checkpointTick) return;
    handledTick.current = checkpointTick;
    onCheckpoint?.();
  }, [checkpointTick, onCheckpoint]);
  const requestCheckpoint = () => setCheckpointTick((t) => t + 1);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const deck = decks.find((d) => d.id === deckId);
  const newId = useMemo(() => (deck ? nextCardId(deck) : ''), [deck]);

  const visible = useMemo(() => {
    if (!deck) return [];
    const q = query.trim().toLowerCase();
    return deck.wordBank
      .filter((c) => !q || c.german.toLowerCase().includes(q) || c.english.toLowerCase().includes(q))
      .sort((a, b) => a.german.localeCompare(b.german, 'de'));
  }, [deck, query]);

  const selectedCard = deck && selection.kind === 'card'
    ? deck.wordBank.find((c) => c.id === selection.id) ?? null
    : null;
  const editing = selection.kind === 'new' || (selection.kind === 'card' && selectedCard !== null);

  const confirmDiscard = () => !dirty || window.confirm('Discard unsaved changes?');

  const select = (next: Selection) => {
    if (!confirmDiscard()) return;
    setDirty(false);
    setNotice(null);
    setSelection(next);
  };

  const handleDirtyChange = useCallback((d: boolean) => {
    setDirty(d);
    if (d) setNotice(null);
  }, []);

  const handleSave = (card: Flashcard) => {
    if (!deck) return;
    saveCard(deck.id, card);
    setSelection({ kind: 'card', id: card.id });
    setNotice(`Saved ${card.german}.`);
    requestCheckpoint();
  };

  const handleDelete = (card: Flashcard) => {
    if (!deck) return;
    if (!window.confirm(`Delete “${card.german}”? Its study progress is removed too.`)) return;
    deleteCard(deck.id, card.id);
    setDirty(false);
    setSelection({ kind: 'none' });
    setNotice(`Deleted ${card.german}.`);
    requestCheckpoint();
  };

  const handleCopy = (card: Flashcard, toDeckId: string) => {
    if (!deck) return;
    copyCard(deck.id, card.id, toDeckId);
    const target = decks.find((d) => d.id === toDeckId);
    setNotice(`Copied ${card.german} to ${target?.name ?? 'deck'}.`);
    requestCheckpoint();
  };

  const changeDeck = (id: string) => {
    if (!confirmDiscard()) return;
    setDirty(false);
    setNotice(null);
    setQuery('');
    setSelection({ kind: 'none' });
    setDeckId(id);
  };

  const handleBack = () => {
    if (confirmDiscard()) onBack();
  };

  return (
    <>
      <GlobalStyle />
      <ManageShell>
        <TopBar>
          <TopBarRow>
            <TitleGroup>
              <BackBtn type="button" aria-label="Back to flashcards" onClick={handleBack}>‹ Cards</BackBtn>
              <AppTitle>Manage words</AppTitle>
            </TitleGroup>
          </TopBarRow>
        </TopBar>

        {!deck ? (
          <EmptyState>No decks yet. Create one in Flashcards first.</EmptyState>
        ) : (
          <>
            <DeckBar>
              <Field>
                Deck
                <Select value={deck.id} onChange={(e) => changeDeck(e.target.value)}>
                  {decks.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>
              </Field>
            </DeckBar>
            {notice && <FormHint role="status">{notice}</FormHint>}

            <SplitPane>
              <ListPane $editing={editing}>
                <TextInput
                  type="search"
                  aria-label="Search words"
                  placeholder="Search words"
                  autoComplete="off"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <AddBtn type="button" onClick={() => select({ kind: 'new' })}>New word</AddBtn>
                {visible.length === 0 ? (
                  <FormHint>{deck.wordBank.length === 0 ? 'No words in this deck.' : 'No words match.'}</FormHint>
                ) : (
                  <WordList aria-label="Words">
                    {visible.map((c) => {
                      const article = getArticle(c);
                      const missing = FORMS_POS.has(c.partOfSpeech) && !hasForms(c);
                      return (
                        <li key={c.id}>
                          <WordRow
                            type="button"
                            $active={selection.kind === 'card' && selection.id === c.id}
                            onClick={() => select({ kind: 'card', id: c.id })}
                          >
                            <WordRowTitle lang="de">{article ? `${article} ` : ''}{c.german}</WordRowTitle>
                            <WordRowMeta>
                              {c.english} · {posLabel(c.partOfSpeech)}{missing ? ' · no forms' : ''}
                            </WordRowMeta>
                          </WordRow>
                        </li>
                      );
                    })}
                  </WordList>
                )}
              </ListPane>

              <EditorPane $editing={editing}>
                {editing ? (
                  <WordEditor
                    key={selection.kind === 'new' ? `${deck.id}:new` : `${deck.id}:${selectedCard?.id}`}
                    cardId={selectedCard?.id ?? newId}
                    card={selectedCard}
                    decks={decks}
                    currentDeckId={deck.id}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    onCopy={handleCopy}
                    onDirtyChange={handleDirtyChange}
                    onClose={() => select({ kind: 'none' })}
                  />
                ) : (
                  <EditorPlaceholder>Select a word to edit, or add a new one.</EditorPlaceholder>
                )}
              </EditorPane>
            </SplitPane>
          </>
        )}
      </ManageShell>
    </>
  );
};

export default ManageWords;
