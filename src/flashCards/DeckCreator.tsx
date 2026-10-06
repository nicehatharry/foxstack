import React, { useRef, useState } from 'react';

import { ARTICLE_OPTIONS, PART_OF_SPEECH_OPTIONS } from './decks';
import type { CardDraft } from './decks';
import type { NounArticle, PartOfSpeech } from './FlashCards.types';

import { AppShell } from './styles/layout';
import { TopBar, TopBarRow, AppTitle } from './styles/header';
import { Actions } from './styles/actions';
import {
  BackBtn, TitleGroup, FormBody, AddCardForm, Field, TextInput, Select, FieldRow, AddBtn,
  DraftList, DraftItem, DraftText, RemoveBtn, FormHint, SubmitBtn,
} from './styles/decks';

export interface DeckCreatorProps {
  onCreate: (name: string, drafts: CardDraft[]) => void;
  onCancel: () => void;
}

const describeDraft = (draft: CardDraft): string =>
  `${draft.partOfSpeech === 'noun' ? `${draft.article} ` : ''}${draft.german.trim()}: ${draft.english.trim()}`;

/**
 * Name a deck and add its first cards. Cards carry no `forms` (those are
 * authored strings, never generated at runtime — context §2). A deck needs at
 * least one card: there is no "add cards to an existing deck" yet, so an empty
 * deck would be a dead end.
 */
export const DeckCreator: React.FC<DeckCreatorProps> = ({ onCreate, onCancel }) => {
  const [name, setName] = useState('');
  const [drafts, setDrafts] = useState<CardDraft[]>([]);
  const [german, setGerman] = useState('');
  const [english, setEnglish] = useState('');
  const [pos, setPos] = useState<PartOfSpeech>('noun');
  const [article, setArticle] = useState<NounArticle>('der');
  const germanRef = useRef<HTMLInputElement>(null);

  const canAdd = german.trim() !== '' && english.trim() !== '';
  const canCreate = name.trim() !== '' && drafts.length > 0;

  const addCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) return;
    const draft: CardDraft =
      pos === 'noun'
        ? { german, english, partOfSpeech: 'noun', article }
        : { german, english, partOfSpeech: pos };
    setDrafts((prev) => [...prev, draft]);
    // Keep part of speech / article so a run of similar words is quick to enter.
    setGerman('');
    setEnglish('');
    germanRef.current?.focus();
  };

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

        <AddCardForm onSubmit={addCard}>
          <Field>
            German
            <TextInput
              ref={germanRef}
              value={german}
              onChange={(e) => setGerman(e.target.value)}
              lang="de"
              autoComplete="off"
              autoCapitalize="off"
              placeholder="Without the article"
            />
          </Field>
          <FieldRow>
            <Field>
              Part of speech
              <Select value={pos} onChange={(e) => setPos(e.target.value as PartOfSpeech)}>
                {PART_OF_SPEECH_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </Field>
            {pos === 'noun' && (
              <Field>
                Article
                <Select value={article} onChange={(e) => setArticle(e.target.value as NounArticle)}>
                  {ARTICLE_OPTIONS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </Select>
              </Field>
            )}
          </FieldRow>
          <Field>
            English
            <TextInput
              value={english}
              onChange={(e) => setEnglish(e.target.value)}
              lang="en"
              autoComplete="off"
            />
          </Field>
          <AddBtn type="submit" disabled={!canAdd}>Add card</AddBtn>
        </AddCardForm>

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
